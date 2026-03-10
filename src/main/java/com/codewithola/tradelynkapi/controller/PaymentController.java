package com.codewithola.tradelynkapi.controller;


import com.codewithola.tradelynkapi.dtos.requests.GuestInitializePaymentRequest;
import com.codewithola.tradelynkapi.dtos.requests.InitializePaymentRequest;
import com.codewithola.tradelynkapi.dtos.requests.PaymentMetadata;
import com.codewithola.tradelynkapi.dtos.response.InitializePaymentResponse;
import com.codewithola.tradelynkapi.dtos.response.OrderDTO;
import com.codewithola.tradelynkapi.dtos.response.PaystackVerifyResponse;
import com.codewithola.tradelynkapi.entity.GuestPayment;
import com.codewithola.tradelynkapi.entity.Order;
import com.codewithola.tradelynkapi.entity.Payment;
import com.codewithola.tradelynkapi.repositories.GuestPaymentRepository;
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
    private final GuestPaymentRepository guestPaymentRepository;
    private final ObjectMapper objectMapper;
    private final OrderService orderService;
    private final OrderRepository orderRepository;

    // =====================================================================
    // 1. INITIALIZE PAYMENT
    // =====================================================================

    /**
     * POST /api/v1/payments/initialize
     * Initialize a Paystack payment transaction.
     * Accepts callbackUrl from frontend, passes it to Paystack.
     * Returns paymentUrl, reference, and paymentReference.
     */
    @PostMapping("/initialize")
    public ResponseEntity<Map<String, Object>> initializePayment(
            @Valid @RequestBody InitializePaymentRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("POST /payments/initialize - User: {} item: {} variant: {} amount: ₦{}",
                userPrincipal.getEmail(), request.getItemId(), request.getVariantId(), request.getAmount());

        InitializePaymentResponse response = paystackService.initializePayment(
                request.getItemId(),
                request.getVariantId(),
                userPrincipal.getId(),
                request.getAmount(),
                request.getDeliveryAddress(),
                request.getCallbackUrl()   // ✅ NEW: pass callbackUrl to service
        );

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", response.getMessage());
        result.put("data", Map.of(
                "paymentUrl", response.getPaymentUrl(),
                "reference", response.getReference(),
                "paymentReference", response.getReference() // ✅ frontend expects this
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // =====================================================================
    // 1b. GUEST INITIALIZE — no authentication required
    // =====================================================================

    /**
     * POST /api/v1/payments/guest/initialize
     * Create a Paystack payment link for a guest buyer (no TradeLynk account needed).
     * Used by the WhatsApp bot to send payment links to non-registered users.
     *
     * Request body:
     * {
     *   "itemId": 123,
     *   "amount": 1000,            // Naira
     *   "deliveryAddress": "...",
     *   "buyerName": "John Doe",
     *   "buyerEmail": "john@example.com",
     *   "buyerPhone": "+2348012345678",  // optional
     *   "variantId": 5,                  // optional
     *   "callbackUrl": "https://..."     // optional
     * }
     *
     * Returns the same shape as /initialize:
     * { "success": true, "data": { "paymentUrl", "reference", "paymentReference" } }
     */
    @PostMapping("/guest/initialize")
    public ResponseEntity<Map<String, Object>> guestInitializePayment(
            @Valid @RequestBody GuestInitializePaymentRequest request) {

        log.info("POST /payments/guest/initialize — Item: {}, Guest: {} <{}>",
                request.getItemId(), request.getBuyerName(), request.getBuyerEmail());

        InitializePaymentResponse response = paystackService.initializeGuestPayment(
                request.getItemId(),
                request.getVariantId(),
                request.getBuyerName(),
                request.getBuyerEmail(),
                request.getBuyerPhone(),
                request.getAmount(),
                request.getDeliveryAddress(),
                request.getCallbackUrl()
        );

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", response.getMessage());
        result.put("data", Map.of(
                "paymentUrl", response.getPaymentUrl(),
                "reference", response.getReference(),
                "paymentReference", response.getReference()
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // =====================================================================
    // 2. WEBHOOK — SAFETY NET (most important fix)
    // =====================================================================

    /**
     * POST /api/v1/payments/webhook
     * Paystack webhook — SAFETY NET for order creation.
     * Ensures orders are created even if user's browser closes or network fails.
     * Public endpoint — no JWT authentication required.
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> paystackWebhook(
            @RequestBody(required = false) String payload,
            @RequestHeader(value = "x-paystack-signature", required = false) String signature,
            HttpServletRequest request
    ) {
        log.info("========== PAYSTACK WEBHOOK RECEIVED ==========");
        log.info("URI: {} | Remote: {}", request.getRequestURI(), request.getRemoteAddr());

        if (payload == null || payload.isEmpty()) {
            log.error("Webhook payload is NULL or EMPTY!");
            return ResponseEntity.badRequest().body("No payload received");
        }

        log.info("Payload size: {} bytes", payload.length());

        try {
            // 1. VERIFY SIGNATURE FIRST — reject unsigned requests
            if (signature == null || signature.isEmpty()) {
                log.error("❌ No x-paystack-signature header — rejecting");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing signature");
            }

            boolean isValid = paystackService.verifyWebhookSignature(payload, signature);
            if (!isValid) {
                log.error("❌ Invalid webhook signature — possible spoof");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
            }
            log.info("✔ Webhook signature verified");

            // 2. Parse payload
            JsonNode jsonPayload = objectMapper.readTree(payload);
            String event = jsonPayload.path("event").asText("unknown");
            JsonNode data = jsonPayload.path("data");
            String reference = data.path("reference").asText("unknown");

            log.info("Event: {} | Reference: {}", event, reference);

            // 3. Handle charge.success
            if ("charge.success".equals(event)) {
                processSuccessfulPayment(reference, data);
            } else if ("charge.failed".equals(event)) {
                log.warn("Charge FAILED for reference: {}", reference);
            } else {
                log.info("Ignoring event type: {}", event);
            }

        } catch (Exception e) {
            log.error("❌ ERROR PROCESSING WEBHOOK", e);
            // Always return 200 to prevent Paystack retries for unrecoverable errors
        }

        log.info("========== WEBHOOK COMPLETE ==========");
        return ResponseEntity.ok("Webhook received");
    }

    // =====================================================================
    // 3. VERIFY PAYMENT — CRITICAL ENDPOINT
    // =====================================================================

    /**
     * GET /api/v1/payments/verify/{reference}
     * CRITICAL: Verify payment with Paystack and create order if successful.
     * Must be idempotent — frontend retries up to 3 times.
     * Returns: orderId, itemTitle, amount, sellerName
     */
    @GetMapping("/verify/{reference}")
    public ResponseEntity<Map<String, Object>> verifyPayment(
            @PathVariable String reference,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /payments/verify/{} - User: {}", reference, userPrincipal.getEmail());

        try {
            // 1. Fast path: if order already exists, return it immediately (idempotent)
            Optional<Order> existingOrder = orderRepository.findByPaymentPaystackReference(reference);
            if (existingOrder.isPresent()) {
                Order order = existingOrder.get();
                log.info("✔ Order already exists for ref {}. Order ID: {} (cached response)", reference, order.getId());
                return ResponseEntity.ok(buildVerifySuccessResponse(order));
            }

            // 2. Process the payment: verify with Paystack → mark SUCCESS → create order
            OrderDTO orderDTO = processSuccessfulPayment(reference, null);

            if (orderDTO != null) {
                // Fetch full order entity for response (with JOIN FETCH for lazy fields)
                Optional<Order> createdOrder = orderRepository.findByPaymentPaystackReference(reference);
                if (createdOrder.isPresent()) {
                    return ResponseEntity.ok(buildVerifySuccessResponse(createdOrder.get()));
                }

                // Fallback: build response from DTO
                Map<String, Object> resp = new HashMap<>();
                resp.put("success", true);
                resp.put("message", "Payment verified successfully");
                Map<String, Object> data = new HashMap<>();
                data.put("orderId", orderDTO.getId());
                data.put("itemTitle", orderDTO.getItem() != null ? orderDTO.getItem().getTitle() : "Unknown");
                data.put("amount", orderDTO.getAmount());
                data.put("sellerName", orderDTO.getSeller() != null ? orderDTO.getSeller().getName() : "Unknown");
                resp.put("data", data);
                return ResponseEntity.ok(resp);
            }

            // 3. Payment not successful yet
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", false);
            resp.put("message", "Payment verification failed or payment not yet successful");
            return ResponseEntity.ok(resp);

        } catch (Exception e) {
            log.error("Error verifying payment ref: {}", reference, e);

            // Even on error, check if order was created (race condition between webhook + verify)
            try {
                Optional<Order> order = orderRepository.findByPaymentPaystackReference(reference);
                if (order.isPresent()) {
                    return ResponseEntity.ok(buildVerifySuccessResponse(order.get()));
                }
            } catch (Exception ex) {
                log.error("Failed to fetch existing order after error", ex);
            }

            Map<String, Object> resp = new HashMap<>();
            resp.put("success", false);
            resp.put("message", "Payment verification error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }

    // =====================================================================
    // SHARED LOGIC — used by BOTH webhook and verify
    // =====================================================================

    /**
     * Verify payment with Paystack, mark as SUCCESS, create order if it doesn't exist.
     * This is the single source of truth for order creation after payment.
     * Guest references (tlg_ prefix) are verified but do NOT create an Order entity.
     *
     * @param reference   Paystack payment reference
     * @param webhookData Optional webhook JSON data (for metadata extraction fallback)
     * @return OrderDTO if order was created or already exists, null if payment not successful or guest
     */
    private OrderDTO processSuccessfulPayment(String reference, JsonNode webhookData) {
        log.info("Processing payment for reference: {}", reference);

        try {
            // 1. Verify with Paystack API
            PaystackVerifyResponse verifyResponse = paystackService.verifyPayment(reference);

            if (!verifyResponse.getData().getStatus().equalsIgnoreCase("success")) {
                log.warn("❌ Paystack says NOT success for reference: {}", reference);
                return null;
            }
            log.info("✔ Paystack confirmed SUCCESS for reference: {}", reference);

            // 2. Guest payments (tlg_ prefix) — no Order row; GuestPayment record already updated by verifyPayment
            if (reference.startsWith("tlg_")) {
                GuestPayment guestPayment = guestPaymentRepository.findByPaystackReference(reference).orElse(null);
                if (guestPayment != null) {
                    guestPayment.markOrderCreated();
                    guestPaymentRepository.save(guestPayment);
                }
                log.info("✔ Guest payment verified. No Order entity created for guest reference: {}", reference);
                return null; // caller handles guest response separately
            }

            // 3. Authenticated payment — fetch Payment record
            Payment payment = paymentRepository.findByPaystackReference(reference).orElse(null);
            if (payment == null) {
                log.error("❌ Payment not found in DB for reference: {}", reference);
                return null;
            }

            // 4. IDEMPOTENT CHECK: does order already exist?
            Optional<Order> existingOrder = orderRepository.findByPaymentId(payment.getId());
            if (existingOrder.isPresent()) {
                log.info("⚠ Order already exists for payment {}. Order ID: {}", payment.getId(), existingOrder.get().getId());
                return OrderDTO.fromEntity(existingOrder.get());
            }

            // 5. Resolve delivery address: DB → Paystack verify metadata → webhook metadata → fallback
            String deliveryAddress = payment.getDeliveryAddress();
            if (deliveryAddress == null || deliveryAddress.isBlank()) {
                deliveryAddress = extractDeliveryAddressFromVerifyResponse(verifyResponse);
            }
            if ((deliveryAddress == null || deliveryAddress.isBlank()) && webhookData != null) {
                deliveryAddress = extractDeliveryAddressFromMetadata(webhookData);
            }
            if (deliveryAddress == null || deliveryAddress.isBlank()) {
                deliveryAddress = "Not specified";
            }

            log.info("Delivery address: {}", deliveryAddress);

            // 6. CREATE THE ORDER
            OrderDTO order = orderService.createOrder(
                    payment.getItemId(),
                    payment.getBuyerId(),
                    payment.getSellerId(),
                    payment.getId(),
                    payment.getAmount(),
                    deliveryAddress
            );

            log.info("✔ ORDER CREATED! Order ID: {}", order.getId());
            return order;

        } catch (Exception e) {
            log.error("❌ Error processing payment ref: {}", reference, e);

            // Race condition: if webhook + verify both tried to create, one wins
            try {
                Optional<Order> existingOrder = orderRepository.findByPaymentPaystackReference(reference);
                if (existingOrder.isPresent()) {
                    log.info("Order exists after race condition for ref: {}", reference);
                    return OrderDTO.fromEntity(existingOrder.get());
                }
            } catch (Exception ex) {
                log.error("Failed to fetch order after race condition", ex);
            }

            return null;
        }
    }

    // =====================================================================
    // HELPER METHODS
    // =====================================================================

    /**
     * Build the standardized success response for the verify endpoint.
     * Returns: { success, message, data: { orderId, itemTitle, amount, sellerName } }
     */
    private Map<String, Object> buildVerifySuccessResponse(Order order) {
        Map<String, Object> data = new HashMap<>();
        data.put("orderId", order.getId());
        data.put("itemTitle", order.getItem() != null ? order.getItem().getTitle() : "Unknown");
        data.put("amount", order.getAmount());
        data.put("sellerName", order.getSeller() != null ? order.getSeller().getFullName() : "Unknown");

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Payment verified successfully");
        response.put("data", data);
        return response;
    }

    /**
     * Extract delivery address from Paystack verify response metadata
     */
    private String extractDeliveryAddressFromVerifyResponse(PaystackVerifyResponse verifyResponse) {
        try {
            PaymentMetadata metadata = verifyResponse.getData().getMetadata();
            if (metadata != null && metadata.getDeliveryAddress() != null) {
                return metadata.getDeliveryAddress();
            }
            return null;
        } catch (Exception e) {
            log.error("Error extracting delivery address from verify response", e);
            return null;
        }
    }

    /**
     * Extract delivery address from Paystack webhook JSON metadata
     */
    private String extractDeliveryAddressFromMetadata(JsonNode data) {
        try {
            if (data.has("metadata")) {
                JsonNode metadata = data.get("metadata");
                if (metadata.has("delivery_address")) {
                    return metadata.get("delivery_address").asText();
                }
            }
            return null;
        } catch (Exception e) {
            log.error("Error extracting delivery address from webhook metadata", e);
            return null;
        }
    }

    // =====================================================================
    // OTHER PAYMENT ENDPOINTS (unchanged)
    // =====================================================================

    /**
     * GET /api/v1/payments/my-payments
     * Get current user's payment history
     */
    @GetMapping("/my-payments")
    public ResponseEntity<Map<String, Object>> getMyPayments(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /payments/my-payments - User: {}", userPrincipal.getEmail());

        List<Payment> payments = paymentRepository.findByBuyerId(userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", payments);
        response.put("count", payments.size());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/payments/seller/payments
     * Get seller's payment history
     */
    @GetMapping("/seller/payments")
    public ResponseEntity<Map<String, Object>> getSellerPayments(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /payments/seller/payments - Seller: {}", userPrincipal.getEmail());

        List<Payment> payments = paymentRepository.findBySellerId(userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", payments);
        response.put("count", payments.size());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/payments/{id}
     * Get payment details by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getPaymentById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /payments/{} - User: {}", id, userPrincipal.getEmail());

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
