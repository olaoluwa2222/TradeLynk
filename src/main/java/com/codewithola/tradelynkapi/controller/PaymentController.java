package com.codewithola.tradelynkapi.controller;


import com.codewithola.tradelynkapi.dtos.requests.InitializePaymentRequest;
import com.codewithola.tradelynkapi.dtos.requests.PaymentMetadata;
import com.codewithola.tradelynkapi.dtos.response.InitializePaymentResponse;
import com.codewithola.tradelynkapi.dtos.response.OrderDTO;
import com.codewithola.tradelynkapi.dtos.response.PaystackVerifyResponse;
import com.codewithola.tradelynkapi.entity.Order;
import com.codewithola.tradelynkapi.entity.Payment;
import com.codewithola.tradelynkapi.repositories.OrderRepository;
import com.codewithola.tradelynkapi.repositories.PaymentRepository;
import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.OrderService;
import com.codewithola.tradelynkapi.services.PaystackService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaystackService paystackService;
    private final PaymentRepository paymentRepository;
    private final ObjectMapper objectMapper;
    private final OrderService orderService; // Add this to constructor injection
    private final OrderRepository orderRepository; // Add this to constructor injection

    /**
     * POST /api/payments/initialize
     * Initialize a payment transaction (authenticated)
     */
    @PostMapping("/initialize")
    public ResponseEntity<Map<String, Object>> initializePayment(
            @Valid @RequestBody InitializePaymentRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("POST /api/payments/initialize - User: {} initiating payment for item: {}",
                userPrincipal.getEmail(), request.getItemId());

        InitializePaymentResponse response = paystackService.initializePayment(
                request.getItemId(),
                userPrincipal.getId(),
                request.getAmount(),
                request.getDeliveryAddress() // ✅ NEW: Pass delivery address
        );

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", response.getMessage());
        result.put("data", Map.of(
                "paymentUrl", response.getPaymentUrl(),
                "reference", response.getReference(),
                "amount", response.getAmount()
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * POST /api/payments/webhook
     * Paystack webhook endpoint (called by Paystack after payment)
     * Public endpoint - no authentication
     */
    /**
     * FINAL WEBHOOK IMPLEMENTATION
     * This version extracts deliveryAddress from payment metadata
     */

    @PostMapping("/webhook")
    public ResponseEntity<String> paystackWebhook(
            @RequestBody(required = false) String payload,
            @RequestHeader(value = "x-paystack-signature", required = false) String signature,
            HttpServletRequest request
    ) {
        log.info("========== PAYSTACK WEBHOOK RECEIVED ==========");
        log.info("Request Method: {}", request.getMethod());
        log.info("Request URI: {}", request.getRequestURI());
        log.info("Remote Address: {}", request.getRemoteAddr());

        // Log ALL headers
        log.info("========== HEADERS ==========");
        request.getHeaderNames().asIterator().forEachRemaining(headerName -> {
            log.info("Header: {} = {}", headerName, request.getHeader(headerName));
        });

        log.info("========== SIGNATURE ==========");
        if (signature != null) {
            log.info("x-paystack-signature: {}", signature);
        } else {
            log.warn("No signature header found! Webhook will fail signature validation.");
        }

        log.info("========== RAW PAYLOAD ==========");
        if (payload == null || payload.isEmpty()) {
            log.error("Webhook payload is NULL or EMPTY!");
            return ResponseEntity.badRequest().body("No payload received");
        }

        log.info("Payload ({} bytes): {}", payload.length(), payload);

        try {
            // Parse webhook payload
            JsonNode jsonPayload = objectMapper.readTree(payload);
            String event = jsonPayload.path("event").asText("unknown");
            JsonNode data = jsonPayload.path("data");
            String reference = data.path("reference").asText("unknown");

            log.info("Event Type: {}", event);
            log.info("Reference: {}", reference);

            // 1. VERIFY SIGNATURE
            log.info("Verifying webhook signature...");
            boolean isValid = paystackService.verifyWebhookSignature(payload, signature);

            if (!isValid) {
                log.error("❌ Invalid webhook signature — possible spoof or MITM attack");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
            }
            log.info("✔ Webhook signature verified");

            // 2. PROCESS EVENT
            if ("charge.success".equals(event)) {
                log.info("Processing charge.success event for reference {}", reference);

                // Verify with Paystack
                log.info("Verifying payment via Paystack API...");
                PaystackVerifyResponse verifyResponse = paystackService.verifyPayment(reference);

                if (!verifyResponse.getData().getStatus().equalsIgnoreCase("success")) {
                    log.warn("❌ Paystack verification FAILED even though webhook said success!");
                    return ResponseEntity.ok("Verification failed");
                }
                log.info("✔ Payment verified successfully via Paystack API");

                // Fetch payment in DB
                Payment payment = paymentRepository.findByPaystackReference(reference)
                        .orElse(null);

                if (payment == null) {
                    log.error("❌ Payment not found in database for reference {}", reference);
                    return ResponseEntity.ok("Payment not found");
                }

                log.info("✔ Payment found in database. ID: {}", payment.getId());

                // Check if order already exists
                Optional<Order> existingOrder = orderRepository.findByPaymentId(payment.getId());

                if (existingOrder.isPresent()) {
                    log.info("⚠ Order already exists for payment {}. Order ID: {}",
                            payment.getId(), existingOrder.get().getId());
                } else {
                    try {
                        // Extract delivery address
                        String deliveryAddress = extractDeliveryAddressFromMetadata(data);
                        log.info("Delivery address extracted: {}", deliveryAddress);

                        // Create order
                        log.info("Attempting to create order...");
                        OrderDTO order = orderService.createOrder(
                                payment.getItemId(),
                                payment.getBuyerId(),
                                payment.getSellerId(),
                                payment.getId(),
                                payment.getAmount(),
                                deliveryAddress
                        );

                        log.info("✔ ORDER CREATED SUCCESSFULLY! Order ID: {}", order.getId());

                    } catch (Exception e) {
                        log.error("❌ Failed to create order for payment {}", payment.getId(), e);
                    }
                }

            } else if ("charge.failed".equals(event)) {
                log.warn("Charge FAILED for reference {}", reference);
            }

        } catch (Exception e) {
            log.error("❌ ERROR PROCESSING WEBHOOK", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error processing webhook");
        }

        log.info("========== WEBHOOK PROCESSING COMPLETE ==========");
        return ResponseEntity.ok("Webhook received");
    }


    /**
     * Helper method to extract delivery address from Paystack webhook metadata
     */
    private String extractDeliveryAddressFromMetadata(JsonNode data) {
        try {
            // Check if metadata exists and contains delivery_address
            if (data.has("metadata")) {
                JsonNode metadata = data.get("metadata");

                if (metadata.has("delivery_address")) {
                    return metadata.get("delivery_address").asText();
                }
            }

            // Default fallback
            return "Campus Location (Not Specified)";

        } catch (Exception e) {
            log.error("Error extracting delivery address from metadata", e);
            return "Campus Location (Not Specified)";
        }
    }

    /**
     * GET /api/payments/verify/{reference}
     * Manually verify payment status (authenticated)
     */
    @GetMapping("/verify/{reference}")
    public ResponseEntity<Map<String, Object>> verifyPayment(
            @PathVariable String reference,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/payments/verify/{} - User: {}", reference, userPrincipal.getEmail());

        PaystackVerifyResponse verifyResponse = paystackService.verifyPayment(reference);

        // ✅ Only create order if payment was successful AND order doesn't exist
        if (verifyResponse.getData().getStatus().equalsIgnoreCase("success")) {

            Payment payment = paymentRepository.findByPaystackReference(reference)
                    .orElseThrow(() -> new RuntimeException("Payment not found"));

            // CHECK if order already exists BEFORE calling createOrder
            Optional<Order> existingOrder = orderRepository.findByPaymentId(payment.getId());

            if (existingOrder.isEmpty()) {
                // Order doesn't exist, create it
                try {
                    // Extract delivery address from metadata
                    String deliveryAddress = extractDeliveryAddressFromVerifyResponse(verifyResponse);

                    orderService.createOrder(
                            payment.getItemId(),
                            payment.getBuyerId(),
                            payment.getSellerId(),
                            payment.getId(),
                            payment.getAmount(),
                            deliveryAddress
                    );
                    log.info("✔ Order created via manual verify for payment {}", payment.getId());
                } catch (Exception e) {
                    log.error("Failed to create order during verify", e);
                    // Don't fail the entire request
                }
            } else {
                log.info("⚠ Order already exists for payment {}, skipping creation", payment.getId());
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", verifyResponse.getData());

        return ResponseEntity.ok(response);
    }

    /**
     * Helper method to extract delivery address from Paystack verify response
     */
    private String extractDeliveryAddressFromVerifyResponse(PaystackVerifyResponse verifyResponse) {
        try {
            PaymentMetadata metadata = verifyResponse.getData().getMetadata();

            if (metadata != null && metadata.getDeliveryAddress() != null) {
                return metadata.getDeliveryAddress();
            }

            // Default fallback
            return "Campus Location (Not Specified)";

        } catch (Exception e) {
            log.error("Error extracting delivery address from verify response", e);
            return "Campus Location (Not Specified)";
        }
    }

    /**
     * GET /api/payments/my-payments
     * Get current user's payment history (authenticated)
     */
    @GetMapping("/my-payments")
    public ResponseEntity<Map<String, Object>> getMyPayments(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/payments/my-payments - User: {}", userPrincipal.getEmail());

        List<Payment> payments = paymentRepository.findByBuyerId(userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", payments);
        response.put("count", payments.size());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/payments/seller/payments
     * Get seller's payment history (authenticated)
     */
    @GetMapping("/seller/payments")
    public ResponseEntity<Map<String, Object>> getSellerPayments(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/payments/seller/payments - Seller: {}", userPrincipal.getEmail());

        List<Payment> payments = paymentRepository.findBySellerId(userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", payments);
        response.put("count", payments.size());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/payments/{id}
     * Get payment details by ID (authenticated)
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getPaymentById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/payments/{} - User: {}", id, userPrincipal.getEmail());

        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        // Verify user is buyer or seller
        if (!payment.getBuyerId().equals(userPrincipal.getId()) &&
                !payment.getSellerId().equals(userPrincipal.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Access denied"));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", payment);

        return ResponseEntity.ok(response);
    }
}
