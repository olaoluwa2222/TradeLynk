package com.codewithola.tradelynkapi.services;


import com.codewithola.tradelynkapi.Enum.BankEnum;
import com.codewithola.tradelynkapi.config.PaystackConfig;
import com.codewithola.tradelynkapi.dtos.requests.PaymentMetadata;
import com.codewithola.tradelynkapi.dtos.requests.PaystackInitializeRequest;
import com.codewithola.tradelynkapi.dtos.requests.PaystackSubaccountRequest;
import com.codewithola.tradelynkapi.dtos.response.InitializePaymentResponse;
import com.codewithola.tradelynkapi.dtos.response.PaystackInitializeResponse;
import com.codewithola.tradelynkapi.dtos.response.PaystackSubaccountResponse;
import com.codewithola.tradelynkapi.dtos.response.PaystackVerifyResponse;
import com.codewithola.tradelynkapi.entity.Item;
import com.codewithola.tradelynkapi.entity.Payment;
import com.codewithola.tradelynkapi.entity.SellerProfile;
import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.exception.BadRequestException;
import com.codewithola.tradelynkapi.exception.NotFoundException;
import com.codewithola.tradelynkapi.repositories.ItemRepository;
import com.codewithola.tradelynkapi.repositories.PaymentRepository;
import com.codewithola.tradelynkapi.repositories.SellerProfileRepository;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaystackService {

    private final PaystackConfig paystackConfig;
    private final RestTemplate restTemplate;
    private final PaymentRepository paymentRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository; // ADDED

    private static final Double PLATFORM_FEE_PERCENTAGE = 3.0; // 10% platform fee

    /**
     * Create a Paystack subaccount for a seller
     * This allows split payments - platform takes 10%, seller gets 90%
     */
    public String createSubaccount(SellerProfile seller) {
        log.info("Creating Paystack subaccount for seller: {}", seller.getUser().getFullName());

        try {
            // Get bank code from bank name
            BankEnum bank = BankEnum.fromName(seller.getBankName());

            // Prepare request
            PaystackSubaccountRequest request = PaystackSubaccountRequest.builder()
                    .businessName(seller.getBusinessName() != null ?
                            seller.getBusinessName() : "Seller-" + seller.getUser().getId())
                    .settlementBank(bank.getCode())
                    .accountNumber(seller.getAccountNumber())
                    .percentageCharge(PLATFORM_FEE_PERCENTAGE)
                    .build();

            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", paystackConfig.getAuthorizationHeader());

            HttpEntity<PaystackSubaccountRequest> entity = new HttpEntity<>(request, headers);

            // Call Paystack API
            String url = paystackConfig.getBaseUrl() + "/subaccount";
            ResponseEntity<PaystackSubaccountResponse> response = restTemplate.postForEntity(
                    url, entity, PaystackSubaccountResponse.class);

            if (response.getBody() != null && response.getBody().getStatus()) {
                String subaccountCode = response.getBody().getData().getSubaccountCode();
                log.info("Subaccount created successfully: {}", subaccountCode);
                return subaccountCode;
            } else {
                throw new RuntimeException("Failed to create subaccount: " +
                        (response.getBody() != null ? response.getBody().getMessage() : "Unknown error"));
            }

        } catch (HttpClientErrorException e) {
            log.error("Paystack API error: {}", e.getResponseBodyAsString(), e);
            throw new RuntimeException("Failed to create Paystack subaccount: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error creating subaccount", e);
            throw new RuntimeException("Failed to create subaccount: " + e.getMessage());
        }
    }

    /**
     * Initialize a payment transaction
     * Creates a payment record and gets authorization URL from Paystack
     */
    @Transactional
    public InitializePaymentResponse initializePayment(Long itemId, Long buyerId, Long amount) {
        log.info("Initializing payment for item: {}, buyer: {}, amount: {}", itemId, buyerId, amount);

        // 1. Fetch item and validate
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found"));

        if (item.getQuantity() < 1) {
            throw new BadRequestException("Item is out of stock");
        }

        // 2. Fetch buyer
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new NotFoundException("Buyer not found"));

        // 3. Fetch seller
        User seller = userRepository.findById(item.getSeller().getId())
                .orElseThrow(() -> new NotFoundException("Seller not found"));

        // 4. Get seller's subaccount (if not exists, throw error)
        // Note: Subaccount should be created during seller activation
        String subaccountCode = getSellerSubaccount(item.getSeller().getId());

        try {
            // 5. Prepare Paystack initialize request
            PaymentMetadata metadata = PaymentMetadata.builder()
                    .itemId(itemId)
                    .sellerId(item.getSeller().getId())
                    .buyerId(buyerId)
                    .itemTitle(item.getTitle())
                    .build();

            PaystackInitializeRequest request = PaystackInitializeRequest.builder()
                    .amount(String.valueOf(amount)) // Amount in kobo
                    .email(buyer.getEmail())
                    .subaccount(subaccountCode)
                    .metadata(metadata)
                    .build();

            // 6. Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", paystackConfig.getAuthorizationHeader());

            HttpEntity<PaystackInitializeRequest> entity = new HttpEntity<>(request, headers);

            // 7. Call Paystack API
            String url = paystackConfig.getBaseUrl() + "/transaction/initialize";
            ResponseEntity<PaystackInitializeResponse> response = restTemplate.postForEntity(
                    url, entity, PaystackInitializeResponse.class);

            if (response.getBody() != null && response.getBody().getStatus()) {
                PaystackInitializeResponse.InitializeData data = response.getBody().getData();

                // 8. Save payment record with PENDING status
                Payment payment = Payment.builder()
                        .itemId(itemId)
                        .sellerId(item.getSeller().getId())
                        .buyerId(buyerId)
                        .amount(amount)
                        .paystackReference(data.getReference())
                        .paystackAccessCode(data.getAccessCode())
                        .authorizationUrl(data.getAuthorizationUrl())
                        .status(Payment.PaymentStatus.PENDING)
                        .build();

                paymentRepository.save(payment);

                log.info("Payment initialized successfully. Reference: {}", data.getReference());

                return InitializePaymentResponse.builder()
                        .paymentUrl(data.getAuthorizationUrl())
                        .reference(data.getReference())
                        .amount(amount)
                        .message("Payment initialized successfully")
                        .build();

            } else {
                throw new RuntimeException("Failed to initialize payment: " +
                        (response.getBody() != null ? response.getBody().getMessage() : "Unknown error"));
            }

        } catch (HttpClientErrorException e) {
            log.error("Paystack API error: {}", e.getResponseBodyAsString(), e);
            throw new RuntimeException("Failed to initialize payment: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error initializing payment", e);
            throw new RuntimeException("Failed to initialize payment: " + e.getMessage());
        }
    }

    /**
     * Verify a payment transaction
     * Checks with Paystack if payment was successful
     */
    @Transactional
    public PaystackVerifyResponse verifyPayment(String reference) {
        log.info("Verifying payment with reference: {}", reference);

        try {
            // 1. Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", paystackConfig.getAuthorizationHeader());

            HttpEntity<?> entity = new HttpEntity<>(headers);

            // 2. Call Paystack API
            String url = paystackConfig.getBaseUrl() + "/transaction/verify/" + reference;
            ResponseEntity<PaystackVerifyResponse> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, PaystackVerifyResponse.class);

            if (response.getBody() != null && response.getBody().getStatus()) {
                PaystackVerifyResponse verifyResponse = response.getBody();
                String status = verifyResponse.getData().getStatus();

                // 3. Update payment record in database
                Payment payment = paymentRepository.findByPaystackReference(reference)
                        .orElseThrow(() -> new NotFoundException("Payment record not found"));

                if ("success".equalsIgnoreCase(status)) {
                    payment.markAsSuccess();

                    // 4. Decrement item quantity
                    Item item = itemRepository.findById(payment.getItemId())
                            .orElseThrow(() -> new NotFoundException("Item not found"));

                    if (item.getQuantity() > 0) {
                        item.setQuantity(item.getQuantity() - 1);
                        itemRepository.save(item);
                    }

                } else {
                    payment.markAsFailed();
                }

                paymentRepository.save(payment);
                log.info("Payment verification completed. Status: {}", status);

                return verifyResponse;

            } else {
                throw new RuntimeException("Failed to verify payment: " +
                        (response.getBody() != null ? response.getBody().getMessage() : "Unknown error"));
            }

        } catch (HttpClientErrorException e) {
            log.error("Paystack API error: {}", e.getResponseBodyAsString(), e);
            throw new RuntimeException("Failed to verify payment: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error verifying payment", e);
            throw new RuntimeException("Failed to verify payment: " + e.getMessage());
        }
    }

    /**
     * Verify Paystack webhook signature
     * Security measure to ensure webhook is from Paystack
     */
    public boolean verifyWebhookSignature(String payload, String signature) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(
                    paystackConfig.getSecretKey().getBytes(StandardCharsets.UTF_8),
                    "HmacSHA512"
            );
            mac.init(secretKey);

            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String computedSignature = HexFormat.of().formatHex(hash);

            boolean isValid = computedSignature.equals(signature);
            log.info("Webhook signature verification: {}", isValid ? "VALID" : "INVALID");

            return isValid;

        } catch (Exception e) {
            log.error("Error verifying webhook signature", e);
            return false;
        }
    }

    private String getSellerSubaccount(Long sellerId) {
        // Fetch seller's subaccount from database
        SellerProfile sellerProfile = sellerProfileRepository.findByUserId(sellerId)
                .orElseThrow(() -> new NotFoundException("Seller profile not found"));

        if (sellerProfile.getPayStackSubaccountId() == null ||
                sellerProfile.getPayStackSubaccountId().isEmpty()) {
            throw new BadRequestException(
                    "Seller subaccount not configured. Please contact support.");
        }

        return sellerProfile.getPayStackSubaccountId();
    }
}
