package com.codewithola.tradelynkapi.controller;


import com.codewithola.tradelynkapi.dtos.requests.InitializePaymentRequest;
import com.codewithola.tradelynkapi.dtos.response.InitializePaymentResponse;
import com.codewithola.tradelynkapi.dtos.response.PaystackVerifyResponse;
import com.codewithola.tradelynkapi.entity.Payment;
import com.codewithola.tradelynkapi.repositories.PaymentRepository;
import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.PaystackService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaystackService paystackService;
    private final PaymentRepository paymentRepository;
    private final ObjectMapper objectMapper;

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
                request.getAmount()
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
    @PostMapping("/webhook")
    public ResponseEntity<String> paystackWebhook(
            @RequestBody String payload,
            @RequestHeader("x-paystack-signature") String signature) {

        log.info("POST /api/payments/webhook - Received Paystack webhook");

        // 1. Verify webhook signature (SECURITY)
        boolean isValid = paystackService.verifyWebhookSignature(payload, signature);

        if (!isValid) {
            log.error("Invalid webhook signature. Rejecting webhook.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
        }

        try {
            // 2. Parse webhook payload
            JsonNode jsonPayload = objectMapper.readTree(payload);
            String event = jsonPayload.get("event").asText();

            log.info("Webhook event: {}", event);

            // 3. Handle different webhook events
            if ("charge.success".equals(event)) {
                // Payment successful
                JsonNode data = jsonPayload.get("data");
                String reference = data.get("reference").asText();
                String status = data.get("status").asText();

                log.info("Payment successful. Reference: {}, Status: {}", reference, status);

                // 4. Verify payment with Paystack API (double-check)
                paystackService.verifyPayment(reference);

                // Note: verifyPayment() already updates database and decrements stock

            } else if ("charge.failed".equals(event)) {
                // Payment failed
                JsonNode data = jsonPayload.get("data");
                String reference = data.get("reference").asText();

                log.warn("Payment failed. Reference: {}", reference);

                // Update payment status to FAILED
                Payment payment = paymentRepository.findByPaystackReference(reference)
                        .orElse(null);

                if (payment != null) {
                    payment.markAsFailed();
                    paymentRepository.save(payment);
                }
            }

            return ResponseEntity.ok("Webhook received");

        } catch (Exception e) {
            log.error("Error processing webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing webhook");
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

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", verifyResponse.getData());

        return ResponseEntity.ok(response);
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
