package com.codewithola.tradelynkapi.controller;


import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.LikeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/items")
@RequiredArgsConstructor
@Slf4j
public class LikeController {

    private final LikeService likeService;

    /**
     * POST /api/items/{id}/like
     * Like an item (authenticated)
     */
    @PostMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> likeItem(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("POST /api/items/{}/like - User: {}", id, userPrincipal.getEmail());

        likeService.likeItem(id, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Item liked successfully");
        response.put("data", Map.of(
                "itemId", id,
                "liked", true,
                "likeCount", likeService.getLikeCount(id)
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * DELETE /api/items/{id}/like
     * Unlike an item (authenticated)
     */
    @DeleteMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> unlikeItem(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("DELETE /api/items/{}/like - User: {}", id, userPrincipal.getEmail());

        likeService.unlikeItem(id, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Item unliked successfully");
        response.put("data", Map.of(
                "itemId", id,
                "liked", false,
                "likeCount", likeService.getLikeCount(id)
        ));

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/items/{id}/like-count
     * Get like count for an item (public)
     */
    @GetMapping("/{id}/like-count")
    public ResponseEntity<Map<String, Object>> getLikeCount(@PathVariable Long id) {
        log.info("GET /api/items/{}/like-count", id);

        Long likeCount = likeService.getLikeCount(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", Map.of(
                "itemId", id,
                "likeCount", likeCount
        ));

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/items/{id}/like-status
     * Check if current user has liked an item (authenticated)
     */
    @GetMapping("/{id}/like-status")
    public ResponseEntity<Map<String, Object>> getLikeStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/items/{}/like-status - User: {}", id, userPrincipal.getEmail());

        boolean isLiked = likeService.hasUserLikedItem(id, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", Map.of(
                "itemId", id,
                "isLiked", isLiked,
                "likeCount", likeService.getLikeCount(id)
        ));

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/items/my-likes
     * Get all items liked by current user (authenticated)
     */
    @GetMapping("/my-likes")
    public ResponseEntity<Map<String, Object>> getMyLikedItems(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/items/my-likes - User: {}", userPrincipal.getEmail());

        var likedItems = likeService.getLikedItemsByUser(userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", likedItems);
        response.put("count", likedItems.size());

        return ResponseEntity.ok(response);
    }
}
