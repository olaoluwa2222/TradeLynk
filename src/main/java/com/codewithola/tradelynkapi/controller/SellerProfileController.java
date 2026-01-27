package com.codewithola.tradelynkapi.controller;

import com.codewithola.tradelynkapi.dtos.requests.SellerProfileUpdateRequest;
import com.codewithola.tradelynkapi.dtos.requests.SellerStatsDTO;
import com.codewithola.tradelynkapi.dtos.response.ItemDTO;
import com.codewithola.tradelynkapi.dtos.response.SellerProfileDTO;
import com.codewithola.tradelynkapi.dtos.response.StorefrontResponse;
import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.SellerProfileService;
import jakarta.servlet.http.HttpServletRequest;
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

@RestController
@RequestMapping("/sellers")
@RequiredArgsConstructor
@Slf4j
public class SellerProfileController {

    private final SellerProfileService sellerProfileService;

    /**
     * GET /api/sellers/{userId}/profile
     * Get seller profile (public endpoint)
     */
    @GetMapping("/{userId}/profile")
    public ResponseEntity<Map<String, Object>> getSellerProfile(@PathVariable Long userId) {
        log.info("GET /api/sellers/{}/profile - Fetching seller profile", userId);

        SellerProfileDTO profile = sellerProfileService.getSellerProfile(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", profile);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/sellers/{userId}/items
     * Get seller's items (public, paginated)
     */
    @GetMapping("/{userId}/items")
    public ResponseEntity<Map<String, Object>> getSellerItems(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/sellers/{}/items - Fetching seller items", userId);

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ?
                Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Long currentUserId = userPrincipal != null ? userPrincipal.getId() : null;
        Page<ItemDTO> items = sellerProfileService.getSellerItems(userId, pageable, currentUserId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", items.getContent());
        response.put("currentPage", items.getNumber());
        response.put("totalItems", items.getTotalElements());
        response.put("totalPages", items.getTotalPages());
        response.put("hasNext", items.hasNext());
        response.put("hasPrevious", items.hasPrevious());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/sellers/{userId}/stats
     * Get seller statistics (public)
     */
    @GetMapping("/{userId}/stats")
    public ResponseEntity<Map<String, Object>> getSellerStats(@PathVariable Long userId) {
        log.info("GET /api/sellers/{}/stats - Fetching seller stats", userId);

        SellerStatsDTO stats = sellerProfileService.getSellerStats(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", stats);

        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/sellers/me/profile
     * Update own seller profile (authenticated, seller only)
     */
    @PutMapping("/me/profile")
    public ResponseEntity<Map<String, Object>> updateMyProfile(
            @Valid @RequestBody SellerProfileUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("PUT /api/sellers/me/profile - User: {} updating profile",
                userPrincipal.getEmail());

        SellerProfileDTO updatedProfile = sellerProfileService.updateSellerProfile(
                userPrincipal.getId(), request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Seller profile updated successfully");
        response.put("data", updatedProfile);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/sellers/me/profile
     * Get own seller profile (authenticated)
     */
    @GetMapping("/me/profile")
    public ResponseEntity<Map<String, Object>> getMyProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/sellers/me/profile - User: {}", userPrincipal.getEmail());

        SellerProfileDTO profile = sellerProfileService.getSellerProfile(userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", profile);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/sellers/me/stats
     * Get own seller statistics (authenticated)
     */
    @GetMapping("/me/stats")
    public ResponseEntity<Map<String, Object>> getMyStats(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/sellers/me/stats - User: {}", userPrincipal.getEmail());

        SellerStatsDTO stats = sellerProfileService.getSellerStats(userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", stats);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/sellers/{username}/storefront
     * Get seller's public storefront (by username)
     * This is the main endpoint for the public storefront page
     */
    @GetMapping("/{username}/storefront")
    public ResponseEntity<Map<String, Object>> getStorefrontByUsername(
            @PathVariable String username) {

        log.info("GET /api/sellers/{}/storefront - Fetching storefront", username);

        StorefrontResponse storefront = sellerProfileService.getStorefrontByUsername(username);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", storefront);

        return ResponseEntity.ok(response);
    }

    /**
     * GET / (with subdomain)
     * Handle subdomain-based storefront requests
     * Example: qvnanniezbtq.tradelynk.app → username = qvnanniezbtq
     */
    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> getStorefrontBySubdomain(
            HttpServletRequest request) {

        String host = request.getHeader("Host");
        log.info("Request host: {}", host);

        // Extract subdomain
        String subdomain = extractSubdomain(host);

        if (subdomain != null && !subdomain.equals("www")) {
            log.info("Subdomain detected: {} - Serving storefront", subdomain);
            return getStorefrontByUsername(subdomain);
        }

        // Not a subdomain request - return error or redirect
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "Invalid subdomain");
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Helper method to extract subdomain from host
     */
    private String extractSubdomain(String host) {
        if (host == null) return null;

        // Remove port if present
        host = host.split(":")[0];

        // Split by dots
        String[] parts = host.split("\\.");

        // tradelynk.app = 2 parts (no subdomain)
        // qvnanniezbtq.tradelynk.app = 3 parts (subdomain = qvnanniezbtq)
        if (parts.length >= 3) {
            return parts[0]; // Return subdomain
        }

        return null; // No subdomain
    }

}
