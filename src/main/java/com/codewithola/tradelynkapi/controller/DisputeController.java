package com.codewithola.tradelynkapi.controller;

import com.codewithola.tradelynkapi.dtos.requests.DisputeCreateRequest;
import com.codewithola.tradelynkapi.dtos.response.DisputeDTO;
import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.DisputeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * DisputeController handles buyer dispute operations
 * Buyers can create disputes and view their dispute history
 */
@RestController
@RequestMapping("/disputes")
@RequiredArgsConstructor
@Slf4j
public class DisputeController {

    private final DisputeService disputeService;

    /**
     * POST /api/disputes/orders/{orderId}
     * Create a dispute for an order (buyer only)
     */
    @PostMapping("/orders/{orderId}")
    public ResponseEntity<Map<String, Object>> createDispute(
            @PathVariable Long orderId,
            @Valid @RequestBody DisputeCreateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("POST /api/disputes/orders/{} - User: {} creating dispute",
                orderId, userPrincipal.getEmail());

        DisputeDTO dispute = disputeService.createDispute(
                orderId,
                userPrincipal.getId(),
                request
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Dispute created successfully. Our team will review it shortly.");
        response.put("data", dispute);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/disputes/my-disputes
     * Get current user's disputes
     */
    @GetMapping("/my-disputes")
    public ResponseEntity<Map<String, Object>> getMyDisputes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/disputes/my-disputes - User: {}", userPrincipal.getEmail());

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ?
                Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<DisputeDTO> disputes = disputeService.getMyDisputes(userPrincipal.getId(), pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", disputes.getContent());
        response.put("currentPage", disputes.getNumber());
        response.put("totalItems", disputes.getTotalElements());
        response.put("totalPages", disputes.getTotalPages());
        response.put("hasNext", disputes.hasNext());
        response.put("hasPrevious", disputes.hasPrevious());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/disputes/seller/disputes
     * Get disputes for seller's orders
     */
    @GetMapping("/seller/disputes")
    public ResponseEntity<Map<String, Object>> getSellerDisputes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/disputes/seller/disputes - Seller: {}", userPrincipal.getEmail());

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ?
                Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<DisputeDTO> disputes = disputeService.getSellerDisputes(userPrincipal.getId(), pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", disputes.getContent());
        response.put("currentPage", disputes.getNumber());
        response.put("totalItems", disputes.getTotalElements());
        response.put("totalPages", disputes.getTotalPages());
        response.put("hasNext", disputes.hasNext());
        response.put("hasPrevious", disputes.hasPrevious());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/disputes/{id}
     * Get dispute details by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getDisputeById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/disputes/{} - User: {}", id, userPrincipal.getEmail());

        DisputeDTO dispute = disputeService.getDisputeById(id, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", dispute);

        return ResponseEntity.ok(response);
    }
}