package com.codewithola.tradelynkapi.controller;

import com.codewithola.tradelynkapi.dtos.requests.OrderCancelRequest;
import com.codewithola.tradelynkapi.dtos.response.OrderDTO;
import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * UPDATED OrderController with Escrow Flow
 * Handles order operations: create, view, ship, confirm delivery, cancel
 */
@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {

    private final OrderService orderService;

    /**
     * GET /api/orders/my-purchases
     * Get buyer's purchase history
     */
    @GetMapping("/my-purchases")
    public ResponseEntity<Map<String, Object>> getMyPurchases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/orders/my-purchases - Buyer: {}", userPrincipal.getEmail());

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ?
                Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<OrderDTO> orders = orderService.getMyPurchases(userPrincipal.getId(), pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", orders.getContent());
        response.put("currentPage", orders.getNumber());
        response.put("totalItems", orders.getTotalElements());
        response.put("totalPages", orders.getTotalPages());
        response.put("hasNext", orders.hasNext());
        response.put("hasPrevious", orders.hasPrevious());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/orders/my-sales
     * Get seller's sales history
     */
    @GetMapping("/my-sales")
    public ResponseEntity<Map<String, Object>> getMySales(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/orders/my-sales - Seller: {}", userPrincipal.getEmail());

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ?
                Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<OrderDTO> orders = orderService.getMySales(userPrincipal.getId(), pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", orders.getContent());
        response.put("currentPage", orders.getNumber());
        response.put("totalItems", orders.getTotalElements());
        response.put("totalPages", orders.getTotalPages());
        response.put("hasNext", orders.hasNext());
        response.put("hasPrevious", orders.hasPrevious());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/orders/{id}
     * Get order details by ID
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
     * ✅ NEW: PUT /api/orders/{id}/mark-shipped
     * Seller marks order as shipped
     */
    @PutMapping("/{id}/mark-shipped")
    public ResponseEntity<Map<String, Object>> markAsShipped(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("PUT /api/orders/{}/mark-shipped - Seller: {}", id, userPrincipal.getEmail());

        OrderDTO order = orderService.markAsShipped(id, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Order marked as shipped successfully");
        response.put("data", order);

        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/orders/{id}/confirm-delivery
     * Buyer confirms delivery (releases escrow to seller)
     */
    @PutMapping("/{id}/confirm-delivery")
    public ResponseEntity<Map<String, Object>> confirmDelivery(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("PUT /api/orders/{}/confirm-delivery - Buyer: {}", id, userPrincipal.getEmail());

        OrderDTO order = orderService.markAsDelivered(id, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Delivery confirmed. Payment will be released to seller.");
        response.put("data", order);

        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/orders/{id}/cancel
     * Cancel an order
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelOrder(
            @PathVariable Long id,
            @Valid @RequestBody OrderCancelRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("PUT /api/orders/{}/cancel - User: {}", id, userPrincipal.getEmail());

        OrderDTO order = orderService.cancelOrder(id, userPrincipal.getId(), request.getReason());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Order cancelled successfully");
        response.put("data", order);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/orders/statistics
     * Get order statistics for current user
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getOrderStatistics(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/orders/statistics - User: {}", userPrincipal.getEmail());

        OrderService.OrderStatistics stats = orderService.getOrderStatistics(userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", stats);

        return ResponseEntity.ok(response);
    }
}