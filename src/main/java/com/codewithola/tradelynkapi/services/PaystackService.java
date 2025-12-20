package com.codewithola.tradelynkapi.services;

import com.codewithola.tradelynkapi.Enum.BankEnum;
import com.codewithola.tradelynkapi.config.PaystackConfig;
import com.codewithola.tradelynkapi.dtos.requests.PaymentMetadata;
import com.codewithola.tradelynkapi.dtos.requests.PaystackInitializeRequest;
import com.codewithola.tradelynkapi.dtos.requests.PaystackSubaccountRequest;
import com.codewithola.tradelynkapi.dtos.response.*;
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
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;

/**
 * UPDATED PaystackService with Escrow Support
 * KEY CHANGES:
 * 1. Removed subaccount from payment initialization (money goes to platform account)
 * 2. Added refund functionality
 * 3. Payments now held in escrow until delivery confirmation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaystackService {

    private final PaystackConfig paystackConfig;
    private final RestTemplate restTemplate;
    private final PaymentRepository paymentRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final NotificationService notificationService;

    private static final Double PLATFORM_FEE_PERCENTAGE = 3.0; // 3% platform fee

    /**
     * Create a Paystack subaccount for a seller
     * Note: Subaccounts are NO LONGER used during payment initialization (escrow system)
     * They may be used in future for direct transfers
     */
    public String createSubaccount(SellerProfile seller) {
        log.info("Creating Paystack subaccount for seller: {}", seller.getUser().getFullName());

        try {
            BankEnum bank = BankEnum.fromName(seller.getBankName());

            PaystackSubaccountRequest request = PaystackSubaccountRequest.builder()
                    .businessName(seller.getBusinessName() != null ?
                            seller.getBusinessName() : "Seller-" + seller.getUser().getId())
                    .settlementBank(bank.getCode())
                    .accountNumber(seller.getAccountNumber())
                    .percentageCharge(PLATFORM_FEE_PERCENTAGE)
                    .build();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", paystackConfig.getAuthorizationHeader());

            HttpEntity<PaystackSubaccountRequest> entity = new HttpEntity<>(request, headers);

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
     * ✅ UPDATED: Initialize a payment transaction (ESCROW SYSTEM)
     * KEY CHANGE: NO subaccount - money goes to platform account (escrow)
     */
    @Transactional
    public InitializePaymentResponse initializePayment(Long itemId, Long buyerId, Long amount, String deliveryAddress) {
        log.info("🔒 Initializing ESCROW payment for item: {}, buyer: {}, amount: ₦{}, delivery: {}",
                itemId, buyerId, amount, deliveryAddress);

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

        // ❌ REMOVED: Get seller's subaccount (now using escrow system)
        // Payment will go to platform account, not seller's subaccount

        try {
            // 4. Prepare Paystack initialize request
            PaymentMetadata metadata = PaymentMetadata.builder()
                    .itemId(itemId)
                    .sellerId(item.getSeller().getId())
                    .buyerId(buyerId)
                    .itemTitle(item.getTitle())
                    .deliveryAddress(deliveryAddress)
                    .build();

            // Convert Naira to kobo (Paystack expects amount in kobo)
            Long amountInKobo = amount * 100;
            log.info("Converting amount: ₦{} → {} kobo", amount, amountInKobo);

            PaystackInitializeRequest request = PaystackInitializeRequest.builder()
                    .amount(String.valueOf(amountInKobo))
                    .email(buyer.getEmail())
                    // ❌ REMOVED: .subaccount(subaccountCode) - Money goes to platform account
                    .metadata(metadata)
                    .build();

            // 5. Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", paystackConfig.getAuthorizationHeader());

            HttpEntity<PaystackInitializeRequest> entity = new HttpEntity<>(request, headers);

            // 6. Call Paystack API
            String url = paystackConfig.getBaseUrl() + "/transaction/initialize";
            ResponseEntity<PaystackInitializeResponse> response = restTemplate.postForEntity(
                    url, entity, PaystackInitializeResponse.class);

            if (response.getBody() != null && response.getBody().getStatus()) {
                PaystackInitializeResponse.InitializeData data = response.getBody().getData();

                // 7. Save payment record with PENDING status
                Payment payment = Payment.builder()
                        .itemId(itemId)
                        .sellerId(item.getSeller().getId())
                        .buyerId(buyerId)
                        .amount(amount)  // Store in Naira
                        .paystackReference(data.getReference())
                        .paystackAccessCode(data.getAccessCode())
                        .authorizationUrl(data.getAuthorizationUrl())
                        .status(Payment.PaymentStatus.PENDING)
                        .build();

                paymentRepository.save(payment);

                log.info("✅ ESCROW payment initialized. Reference: {}", data.getReference());

                return InitializePaymentResponse.builder()
                        .paymentUrl(data.getAuthorizationUrl())
                        .reference(data.getReference())
                        .amount(amount)
                        .message("Payment initialized successfully (escrow mode)")
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

                    // Notify seller about payment (money in escrow)
                    Item item = itemRepository.findById(payment.getItemId())
                            .orElseThrow(() -> new NotFoundException("Item not found"));

                    notificationService.sendPaymentHeldNotification(
                            payment.getSellerId(),
                            payment.getAmount(),
                            item.getTitle()
                    );

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
     * ✅ NEW: Refund a payment (for disputed orders)
     * Uses Paystack Refund API to return money to buyer's original payment method
     */
    public void refundPayment(String reference) {
        log.info("🔄 Initiating refund for payment reference: {}", reference);

        try {
            // 1. Verify payment exists and is eligible for refund
            Payment payment = paymentRepository.findByPaystackReference(reference)
                    .orElseThrow(() -> new NotFoundException("Payment not found"));

            if (payment.getStatus() != Payment.PaymentStatus.SUCCESS) {
                throw new BadRequestException("Can only refund successful payments");
            }

            // 2. Call Paystack Refund API
            Map<String, Object> refundRequest = new HashMap<>();
            refundRequest.put("transaction", reference);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", paystackConfig.getAuthorizationHeader());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(refundRequest, headers);

            String url = paystackConfig.getBaseUrl() + "/refund";
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getBody() != null && Boolean.TRUE.equals(response.getBody().get("status"))) {
                log.info("✅ Refund successful for reference: {}", reference);

                // Notify buyer about refund
                notificationService.sendRefundNotification(
                        payment.getBuyerId(),
                        payment.getAmount()
                );

            } else {
                String errorMessage = response.getBody() != null ?
                        (String) response.getBody().get("message") : "Unknown error";
                throw new RuntimeException("Paystack refund failed: " + errorMessage);
            }

        } catch (HttpClientErrorException e) {
            log.error("Paystack refund API error: {}", e.getResponseBodyAsString(), e);
            throw new RuntimeException("Failed to refund payment: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error refunding payment", e);
            throw new RuntimeException("Failed to refund payment: " + e.getMessage());
        }
    }

    /**
     * Verify Paystack webhook signature
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

    /**
     * Validate bank account (for seller profile setup)
     */
    public String validateBankAccount(String accountNumber, String bankCode) {
        log.info("Validating bank account: {} with bank code: {}", accountNumber, bankCode);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", paystackConfig.getAuthorizationHeader());

            HttpEntity<?> entity = new HttpEntity<>(headers);

            String url = String.format(
                    "%s/bank/resolve?account_number=%s&bank_code=%s",
                    paystackConfig.getBaseUrl(),
                    accountNumber,
                    bankCode
            );

            ResponseEntity<PaystackAccountValidationResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    PaystackAccountValidationResponse.class
            );

            if (response.getBody() != null && response.getBody().getStatus()) {
                String accountName = response.getBody().getData().getAccountName();
                log.info("Account validated successfully: {} - {}", accountNumber, accountName);
                return accountName;

            } else {
                throw new BadRequestException("Unable to validate account: " +
                        (response.getBody() != null ? response.getBody().getMessage() : "Invalid account details"));
            }

        } catch (HttpClientErrorException e) {
            log.error("Paystack API error during account validation: {}", e.getResponseBodyAsString());

            if (e.getStatusCode() == HttpStatus.UNPROCESSABLE_ENTITY) {
                throw new BadRequestException("Invalid account number or bank code");
            }

            throw new RuntimeException("Failed to validate account: " + e.getMessage());

        } catch (Exception e) {
            log.error("Error validating bank account", e);
            throw new RuntimeException("Failed to validate account: " + e.getMessage());
        }
    }
}