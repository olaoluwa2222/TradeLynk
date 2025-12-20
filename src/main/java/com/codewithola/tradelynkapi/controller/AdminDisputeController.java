package com.codewithola.tradelynkapi.controller;

import com.codewithola.tradelynkapi.dtos.requests.DisputeResolveRequest;
import com.codewithola.tradelynkapi.dtos.response.DisputeDTO;
import com.codewithola.tradelynkapi.entity.Dispute;
import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.DisputeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * AdminDisputeController handles admin dispute resolution
 * Only admins can access these endpoints
 */
@RestController
@RequestMapping("/admin/disputes")
@RequiredArgsConstructor
@Slf4j
public class AdminDisputeController {

    private final DisputeService disputeService;

    /**
     * GET /api/admin/disputes
     * Get all disputes (admin only)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllDisputes(
            @RequestParam(required = false) Dispute.DisputeStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/admin/disputes - Admin: {} fetching disputes (status: {})",
                userPrincipal.getEmail(), status);

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ?
                Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<DisputeDTO> disputes = disputeService.getAllDisputes(pageable, status);

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
     * PUT /api/admin/disputes/{id}/resolve
     * Resolve a dispute (admin only)
     */
    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> resolveDispute(
            @PathVariable Long id,
            @Valid @RequestBody DisputeResolveRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("PUT /api/admin/disputes/{}/resolve - Admin: {} resolving dispute with resolution: {}",
                id, userPrincipal.getEmail(), request.getResolution());

        DisputeDTO dispute = disputeService.resolveDispute(
                id,
                userPrincipal.getId(),
                request
        );

        String message = getResolutionMessage(request.getResolution());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", dispute);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/admin/disputes/statistics
     * Get dispute statistics (admin only)
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getDisputeStatistics(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/admin/disputes/statistics - Admin: {}", userPrincipal.getEmail());

        DisputeService.DisputeStatistics stats = disputeService.getDisputeStatistics();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", stats);

        return ResponseEntity.ok(response);
    }

    /**
     * Helper method to get user-friendly resolution message
     */
    private String getResolutionMessage(Dispute.DisputeResolution resolution) {
        return switch (resolution) {
            case REFUND_BUYER -> "Dispute resolved: Buyer will receive a full refund.";
            case RELEASE_TO_SELLER -> "Dispute resolved: Payment will be released to seller.";
            case PARTIAL_REFUND -> "Dispute resolved: Partial refund issued.";
            case NO_ACTION -> "Dispute closed without action.";
        };
    }
}