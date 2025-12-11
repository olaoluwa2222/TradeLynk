package com.codewithola.tradelynkapi.controller;

import com.codewithola.tradelynkapi.dtos.requests.OrderCancelRequest;
import com.codewithola.tradelynkapi.dtos.requests.OrderCreateRequest;
import com.codewithola.tradelynkapi.dtos.response.OrderDTO;
import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {

    private final OrderService orderService;

    /**
     * POST /api/orders
     * Create an order (authenticated)
     * Note: In most cases, orders are auto-created via webhook after payment
     * But this endpoint allows manual order creation if needed
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(
            @Valid @RequestBody OrderCreateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("POST /api/orders - User: {} creating order for item: {}",
                userPrincipal.getEmail(), request.getItemId());

        // Note: In production, you'd extract sellerId and amount from the item/payment
        // For now, this assumes the client provides valid data
        // Better approach: Get these from Payment entity using paymentId

        OrderDTO order = orderService.createOrder(
                request.getItemId(),
                userPrincipal.getId(),
                null, // TODO: Get sellerId from item or payment
                request.getPaymentId(),
                null, // TODO: Get amount from payment
                request.getDeliveryAddress()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Order created successfully");
        response.put("data", order);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/orders/my-purchases
     * Get current user's purchase history (authenticated)
     */
    @GetMapping("/my-purchases")
    public ResponseEntity<Map<String, Object>> getMyPurchases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/orders/my-purchases - User: {}, page: {}, size: {}",
                userPrincipal.getEmail(), page, size);

        Pageable pageable = PageRequest.of(page, size);
        Page<OrderDTO> orders = orderService.getMyPurchases(userPrincipal.getId(), pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", orders.getContent());
        response.put("currentPage", orders.getNumber());
        response.put("totalPages", orders.getTotalPages());
        response.put("totalItems", orders.getTotalElements());
        response.put("hasNext", orders.hasNext());
        response.put("hasPrevious", orders.hasPrevious());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/orders/my-sales
     * Get current user's sales history (authenticated)
     */
    @GetMapping("/my-sales")
    public ResponseEntity<Map<String, Object>> getMySales(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/orders/my-sales - User: {}, page: {}, size: {}",
                userPrincipal.getEmail(), page, size);

        Pageable pageable = PageRequest.of(page, size);
        Page<OrderDTO> orders = orderService.getMySales(userPrincipal.getId(), pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", orders.getContent());
        response.put("currentPage", orders.getNumber());
        response.put("totalPages", orders.getTotalPages());
        response.put("totalItems", orders.getTotalElements());
        response.put("hasNext", orders.hasNext());
        response.put("hasPrevious", orders.hasPrevious());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/orders/{id}
     * Get order details by ID (authenticated)
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getOrderById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/orders/{} - User: {}", id, userPrincipal.getEmail());

        OrderDTO order = orderService.getOrderById(id, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", order);

        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/orders/{id}/mark-delivered
     * Mark order as delivered (only buyer can do this)
     */
    @PutMapping("/{id}/mark-delivered")
    public ResponseEntity<Map<String, Object>> markAsDelivered(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("PUT /api/orders/{}/mark-delivered - User: {}", id, userPrincipal.getEmail());

        OrderDTO order = orderService.markAsDelivered(id, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Order marked as delivered successfully");
        response.put("data", order);

        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/orders/{id}/cancel
     * Cancel an order (buyer or seller can do this)
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelOrder(
            @PathVariable Long id,
            @Valid @RequestBody OrderCancelRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("PUT /api/orders/{}/cancel - User: {}, reason: {}",
                id, userPrincipal.getEmail(), request.getReason());

        OrderDTO order = orderService.cancelOrder(id, userPrincipal.getId(), request.getReason());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Order cancelled successfully");
        response.put("data", order);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/orders/statistics
     * Get order statistics for current user (authenticated)
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/orders/statistics - User: {}", userPrincipal.getEmail());

        OrderService.OrderStatistics stats = orderService.getOrderStatistics(userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", stats);

        return ResponseEntity.ok(response);
    }
}