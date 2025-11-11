package com.codewithola.tradelynkapi.controller;


import com.codewithola.tradelynkapi.dtos.requests.ItemAnalyticsDTO;
import com.codewithola.tradelynkapi.dtos.requests.SellerAnalyticsDTO;
import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * GET /api/sellers/me/analytics
     * Get seller's dashboard analytics (authenticated, seller only)
     */
    @GetMapping("/sellers/me/analytics")
    public ResponseEntity<Map<String, Object>> getMySellerAnalytics(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/sellers/me/analytics - Seller: {}", userPrincipal.getEmail());

        SellerAnalyticsDTO analytics = analyticsService.getSellerAnalytics(userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", analytics);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/items/{id}/analytics
     * Get item-specific analytics (authenticated, item owner only)
     */
    @GetMapping("/items/{id}/analytics")
    public ResponseEntity<Map<String, Object>> getItemAnalytics(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/items/{}/analytics - User: {}", id, userPrincipal.getEmail());

        ItemAnalyticsDTO analytics = analyticsService.getItemAnalytics(id, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", analytics);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/sellers/{sellerId}/analytics
     * Get seller analytics by ID (public - for viewing other sellers' stats)
     * Returns limited public information
     */
    @GetMapping("/sellers/{sellerId}/analytics/public")
    public ResponseEntity<Map<String, Object>> getPublicSellerAnalytics(
            @PathVariable Long sellerId) {

        log.info("GET /api/sellers/{}/analytics/public - Fetching public analytics", sellerId);

        SellerAnalyticsDTO fullAnalytics = analyticsService.getSellerAnalytics(sellerId);

        // Return only public information
        Map<String, Object> publicAnalytics = new HashMap<>();
        publicAnalytics.put("totalItemsPosted", fullAnalytics.getTotalItemsPosted());
        publicAnalytics.put("activeItems", fullAnalytics.getActiveItems());
        publicAnalytics.put("totalSales", fullAnalytics.getTotalSales());
        publicAnalytics.put("totalLikes", fullAnalytics.getTotalLikes());
        publicAnalytics.put("averageItemPrice", fullAnalytics.getAverageItemPrice());
        publicAnalytics.put("lastItemPosted", fullAnalytics.getLastItemPosted());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", publicAnalytics);

        return ResponseEntity.ok(response);
    }
}
