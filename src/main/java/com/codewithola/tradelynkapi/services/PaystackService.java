package com.codewithola.tradelynkapi.services;

import com.codewithola.tradelynkapi.Enum.BankEnum;
import com.codewithola.tradelynkapi.config.PaystackConfig;
import com.codewithola.tradelynkapi.dtos.requests.PaymentMetadata;
import com.codewithola.tradelynkapi.dtos.requests.PaystackInitializeRequest;
import com.codewithola.tradelynkapi.dtos.requests.PaystackSubaccountRequest;
import com.codewithola.tradelynkapi.dtos.response.*;
import com.codewithola.tradelynkapi.entity.Item;
import com.codewithola.tradelynkapi.entity.Payment;
import com.codewithola.tradelynkapi.entity.ProductVariant;
import com.codewithola.tradelynkapi.entity.SellerProfile;
import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.exception.BadRequestException;
import com.codewithola.tradelynkapi.exception.NotFoundException;
import com.codewithola.tradelynkapi.repositories.ItemRepository;
import com.codewithola.tradelynkapi.repositories.PaymentRepository;
import com.codewithola.tradelynkapi.repositories.ProductVariantRepository;
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
import java.util.UUID;

/**
 * UPDATED PaystackService with Variant Support + Escrow
 * KEY CHANGES:
 * 1. Added variantId parameter to initializePayment
 * 2. Stock check now handles both simple products and variants
 * 3. Payments store variantId for tracking
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaystackService {

    private final PaystackConfig paystackConfig;
    private final RestTemplate restTemplate;
    private final PaymentRepository paymentRepository;
    private final ItemRepository itemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final NotificationService notificationService;

    private static final Double PLATFORM_FEE_PERCENTAGE = 3.0; // 3% platform fee

    /**
     * Create a Paystack subaccount for a seller
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
     * ✅ UPDATED: Initialize payment with VARIANT SUPPORT + CALLBACK URL
     *
     * @param itemId Item ID
     * @param variantId Variant ID (null for simple products)
     * @param buyerId Buyer user ID
     * @param amount Payment amount in Naira
     * @param deliveryAddress Delivery address
     * @param callbackUrl Where Paystack redirects after payment (null defaults to tradelynk.app)
     * @return Payment initialization response
     */
    @Transactional
    public InitializePaymentResponse initializePayment(
            Long itemId,
            Long variantId,
            Long buyerId,
            Long amount,
            String deliveryAddress,
            String callbackUrl) {

        log.info("🔒 Initializing ESCROW payment - Item: {}, Variant: {}, Buyer: {}, Amount: ₦{}",
                itemId, variantId, buyerId, amount);

        // 1. Fetch and validate item
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found"));

        // 2. ✅ NEW: Check stock based on product type
        ProductVariant selectedVariant = null;

        if (variantId != null) {
            // Variable product - check variant stock
            selectedVariant = productVariantRepository.findById(variantId)
                    .orElseThrow(() -> new NotFoundException("Product variant not found"));

            // Verify variant belongs to this item
            if (!selectedVariant.getItem().getId().equals(itemId)) {
                throw new BadRequestException("Variant does not belong to this item");
            }

            // Check variant stock
            if (!selectedVariant.isInStock()) {
                throw new BadRequestException("Selected variant is out of stock");
            }

            log.info("✅ Variant stock check passed: {} (Stock: {})",
                    selectedVariant.getVariantName(), selectedVariant.getStock());

        } else {
            // Simple product - check item quantity
            if (item.getQuantity() < 1) {
                throw new BadRequestException("Item is out of stock");
            }

            log.info("✅ Simple product stock check passed (Stock: {})", item.getQuantity());
        }

        // 3. Fetch buyer
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new NotFoundException("Buyer not found"));

        // 4. Fetch seller
        User seller = userRepository.findById(item.getSeller().getId())
                .orElseThrow(() -> new NotFoundException("Seller not found"));

        try {
            // 5. Prepare Paystack initialize request
            PaymentMetadata metadata = PaymentMetadata.builder()
                    .itemId(itemId)
                    .variantId(variantId) // ✅ NEW: Include variant ID in metadata
                    .sellerId(item.getSeller().getId())
                    .buyerId(buyerId)
                    .itemTitle(item.getTitle())
                    .variantName(selectedVariant != null ? selectedVariant.getVariantName() : null) // ✅ NEW
                    .deliveryAddress(deliveryAddress)
                    .build();

            // Convert Naira to kobo (Paystack expects amount in kobo)
            Long amountInKobo = amount * 100;
            log.info("Converting amount: ₦{} → {} kobo", amount, amountInKobo);

            // Generate unique reference
            String generatedReference = "tl_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

            // Determine callback URL (default to tradelynk.app)
            String effectiveCallbackUrl = (callbackUrl != null && !callbackUrl.isBlank())
                    ? callbackUrl
                    : "https://tradelynk.app/payment/success";

            PaystackInitializeRequest request = PaystackInitializeRequest.builder()
                    .amount(String.valueOf(amountInKobo))
                    .email(buyer.getEmail())
                    .reference(generatedReference)
                    .callbackUrl(effectiveCallbackUrl)
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
                        .variantId(variantId)
                        .sellerId(item.getSeller().getId())
                        .buyerId(buyerId)
                        .amount(amount)  // Store in Naira
                        .paystackReference(data.getReference())
                        .paystackAccessCode(data.getAccessCode())
                        .authorizationUrl(data.getAuthorizationUrl())
                        .deliveryAddress(deliveryAddress) // ✅ Store for webhook order creation
                        .status(Payment.PaymentStatus.PENDING)
                        .build();

                paymentRepository.save(payment);

                log.info("✅ ESCROW payment initialized. Reference: {}, Variant: {}",
                        data.getReference(), variantId);

                return InitializePaymentResponse.builder()
                        .paymentUrl(data.getAuthorizationUrl())
                        .reference(data.getReference())
                        .paymentReference(data.getReference()) // ✅ Same as reference for frontend
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
     * Refund a payment (for disputed orders)
     */
    public void refundPayment(String reference) {
        log.info("🔄 Initiating refund for payment reference: {}", reference);

        try {
            Payment payment = paymentRepository.findByPaystackReference(reference)
                    .orElseThrow(() -> new NotFoundException("Payment not found"));

            if (payment.getStatus() != Payment.PaymentStatus.SUCCESS) {
                throw new BadRequestException("Can only refund successful payments");
            }

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