package com.codewithola.tradelynkapi.controller;

import com.codewithola.tradelynkapi.dtos.requests.CollectionCreateRequest;
import com.codewithola.tradelynkapi.dtos.requests.CollectionUpdateRequest;
import com.codewithola.tradelynkapi.dtos.response.CollectionDTO;
import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.CollectionService;
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

@Slf4j
@RestController
@RequestMapping("/collections")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;

    // ========================================
    // CREATE
    // ========================================

    /**
     * POST /api/collections
     * Create a new collection
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createCollection(
            @Valid @RequestBody CollectionCreateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("POST /api/collections - Creating collection '{}' for user: {}",
                request.getName(), userPrincipal.getEmail());

        CollectionDTO collection = collectionService.createCollection(userPrincipal.getId(), request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Collection created successfully");
        response.put("data", collection);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ========================================
    // READ
    // ========================================

    /**
     * GET /api/collections/{id}
     * Get collection by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getCollectionById(@PathVariable Long id) {
        log.info("GET /api/collections/{} - Fetching collection", id);

        CollectionDTO collection = collectionService.getCollectionById(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", collection);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/collections/slug/{slug}
     * Get collection by slug (for public storefront URLs)
     */
    @GetMapping("/slug/{slug}")
    public ResponseEntity<Map<String, Object>> getCollectionBySlug(@PathVariable String slug) {
        log.info("GET /api/collections/slug/{} - Fetching collection", slug);

        CollectionDTO collection = collectionService.getCollectionBySlug(slug);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", collection);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/collections/my-collections
     * Get all collections for the authenticated seller
     */
    @GetMapping("/my-collections")
    public ResponseEntity<Map<String, Object>> getMyCollections(
            @RequestParam(required = false) Boolean activeOnly,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/collections/my-collections - Fetching collections for user: {}",
                userPrincipal.getEmail());

        List<CollectionDTO> collections = collectionService.getSellerCollections(
                userPrincipal.getId(), activeOnly);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", collections);
        response.put("count", collections.size());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/collections/seller/{sellerId}
     * Get all collections for a specific seller (public)
     */
    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<Map<String, Object>> getSellerCollections(
            @PathVariable Long sellerId,
            @RequestParam(defaultValue = "true") Boolean activeOnly) {

        log.info("GET /api/collections/seller/{} - Fetching collections", sellerId);

        List<CollectionDTO> collections = collectionService.getSellerCollections(sellerId, activeOnly);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", collections);
        response.put("count", collections.size());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/collections/seller/{sellerId}/featured
     * Get featured collections for a seller
     */
    @GetMapping("/seller/{sellerId}/featured")
    public ResponseEntity<Map<String, Object>> getFeaturedCollections(@PathVariable Long sellerId) {
        log.info("GET /api/collections/seller/{}/featured - Fetching featured collections", sellerId);

        List<CollectionDTO> collections = collectionService.getFeaturedCollections(sellerId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", collections);
        response.put("count", collections.size());

        return ResponseEntity.ok(response);
    }

    // ========================================
    // UPDATE
    // ========================================

    /**
     * PUT /api/collections/{id}
     * Update a collection
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateCollection(
            @PathVariable Long id,
            @Valid @RequestBody CollectionUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("PUT /api/collections/{} - Updating collection by user: {}",
                id, userPrincipal.getEmail());

        CollectionDTO collection = collectionService.updateCollection(id, userPrincipal.getId(), request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Collection updated successfully");
        response.put("data", collection);

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/collections/{id}/items
     * Add items to a collection
     */
    @PostMapping("/{id}/items")
    public ResponseEntity<Map<String, Object>> addItemsToCollection(
            @PathVariable Long id,
            @RequestBody Map<String, List<Long>> body,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("POST /api/collections/{}/items - Adding items to collection", id);

        List<Long> itemIds = body.get("itemIds");
        CollectionDTO collection = collectionService.addItemsToCollection(id, userPrincipal.getId(), itemIds);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Items added to collection successfully");
        response.put("data", collection);

        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/collections/{id}/items
     * Remove items from a collection
     */
    @DeleteMapping("/{id}/items")
    public ResponseEntity<Map<String, Object>> removeItemsFromCollection(
            @PathVariable Long id,
            @RequestBody Map<String, List<Long>> body,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("DELETE /api/collections/{}/items - Removing items from collection", id);

        List<Long> itemIds = body.get("itemIds");
        CollectionDTO collection = collectionService.removeItemsFromCollection(id, userPrincipal.getId(), itemIds);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Items removed from collection successfully");
        response.put("data", collection);

        return ResponseEntity.ok(response);
    }

    // ========================================
    // DELETE
    // ========================================

    /**
     * DELETE /api/collections/{id}
     * Delete a collection
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteCollection(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("DELETE /api/collections/{} - Deleting collection by user: {}",
                id, userPrincipal.getEmail());

        collectionService.deleteCollection(id, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Collection deleted successfully");

        return ResponseEntity.ok(response);
    }
}