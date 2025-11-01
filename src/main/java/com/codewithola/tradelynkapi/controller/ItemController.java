package com.codewithola.tradelynkapi.controller;


import com.codewithola.tradelynkapi.dtos.requests.ItemCreateRequest;
import com.codewithola.tradelynkapi.dtos.requests.ItemUpdateRequest;
import com.codewithola.tradelynkapi.dtos.requests.SearchFilters;
import com.codewithola.tradelynkapi.dtos.response.ItemDTO;
import com.codewithola.tradelynkapi.entity.Item;
import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.ItemFilterService;
import com.codewithola.tradelynkapi.services.ItemService;
import com.codewithola.tradelynkapi.services.SearchService;
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
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;
    private final ItemFilterService itemFilterService;
    private final SearchService searchService;


    // ---------------- CREATE ----------------
    /**
     * POST /api/items
     * Create a new item (seller only, authentication required)
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createItem(
            @Valid @RequestBody ItemCreateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("POST /api/items - Creating item for user: {}", userPrincipal.getEmail());

        ItemDTO createdItem = itemService.createItem(userPrincipal.getId(), request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Item created successfully");
        response.put("data", createdItem);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/items (paginated with advanced filtering)
     * Get all active items for feed with filtering and sorting
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllActiveItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Item.Category category,
            @RequestParam(required = false) Long minPrice,
            @RequestParam(required = false) Long maxPrice,
            @RequestParam(required = false) Item.Condition condition,
            @RequestParam(defaultValue = "RECENT") String sort,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/items - Fetching items (page: {}, size: {}, category: {}, minPrice: {}, maxPrice: {}, condition: {}, sort: {})",
                page, size, category, minPrice, maxPrice, condition, sort);

        Pageable pageable = PageRequest.of(page, size);
        Long currentUserId = userPrincipal != null ? userPrincipal.getId() : null;

        Page<ItemDTO> items = itemFilterService.filterItems(
                category, minPrice, maxPrice, condition, sort, currentUserId, pageable
        );

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
     * GET /api/items/{id}
     * Get item details and increment view count
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getItemById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/items/{} - Fetching item details", id);

        Long viewerId = userPrincipal != null ? userPrincipal.getId() : null;

        ItemDTO item = itemService.incrementViewCountAndGet(id, viewerId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", item);

        return ResponseEntity.ok(response);
    }


    /**
     * PUT /api/items/{id}
     * Update item (seller only, authentication required)
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateItem(
            @PathVariable Long id,
            @Valid @RequestBody ItemUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("PUT /api/items/{} - Updating item by user: {}", id, userPrincipal.getEmail());

        ItemDTO updatedItem = itemService.updateItem(id, userPrincipal.getId(), request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Item updated successfully");
        response.put("data", updatedItem);

        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/items/{id}
     * Soft delete item (seller only, authentication required)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteItem(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("DELETE /api/items/{} - Deleting item by user: {}", id, userPrincipal.getEmail());

        itemService.deleteItem(id, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Item deleted successfully");

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/items/search?query=...
     * Search items by keyword
     */


    /**
     * GET /api/items/category/{category}
     * Get items by category
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<Map<String, Object>> getItemsByCategory(
            @PathVariable Item.Category category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("GET /api/items/category/{} - Fetching items", category);

        Pageable pageable = PageRequest.of(page, size);
        Page<ItemDTO> items = itemService.getItemsByCategory(category, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", items.getContent());
        response.put("currentPage", items.getNumber());
        response.put("totalItems", items.getTotalElements());
        response.put("totalPages", items.getTotalPages());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/items/seller/{sellerId}
     * Get all items by a specific seller
     */
    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<Map<String, Object>> getItemsBySeller(@PathVariable Long sellerId) {
        log.info("GET /api/items/seller/{} - Fetching seller's items", sellerId);

        List<ItemDTO> items = itemService.getItemsBySeller(sellerId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", items);
        response.put("totalItems", items.size());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/items/my-items
     * Get all items posted by the authenticated user
     */
    @GetMapping("/my-items")
    public ResponseEntity<Map<String, Object>> getMyItems(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/items/my-items - Fetching items for user: {}", userPrincipal.getEmail());

        List<ItemDTO> items = itemService.getItemsBySeller(userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", items);
        response.put("totalItems", items.size());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/items/trending
     * Get trending items (most liked in last 7 days)
     */
    @GetMapping("/trending")
    public ResponseEntity<Map<String, Object>> getTrendingItems(
            @RequestParam(defaultValue = "7") int days,
            @RequestParam(defaultValue = "10") int limit,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/items/trending - Fetching trending items from last {} days", days);

        Long currentUserId = userPrincipal != null ? userPrincipal.getId() : null;
        List<ItemDTO> trendingItems = itemFilterService.getTrendingItems(days, limit, currentUserId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", trendingItems);
        response.put("count", trendingItems.size());
        response.put("period", days + " days");

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/items/search
     * Advanced search with filters
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchItems(
            @RequestParam(required = true) String q,
            @RequestParam(required = false) Item.Category category,
            @RequestParam(required = false) Long minPrice,
            @RequestParam(required = false) Long maxPrice,
            @RequestParam(required = false) Item.Condition condition,
            @RequestParam(defaultValue = "RELEVANCE") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/items/search - query: '{}', category: {}, sort: {}",
                q, category, sort);

        SearchFilters filters = SearchFilters.builder()
                .keyword(q)
                .category(category)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .condition(condition)
                .sortBy(sort)
                .page(page)
                .size(size)
                .build();

        Long currentUserId = userPrincipal != null ? userPrincipal.getId() : null;
        Page<ItemDTO> items = searchService.searchItems(filters, currentUserId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("query", q);
        response.put("data", items.getContent());
        response.put("currentPage", items.getNumber());
        response.put("totalItems", items.getTotalElements());
        response.put("totalPages", items.getTotalPages());
        response.put("hasNext", items.hasNext());
        response.put("hasPrevious", items.hasPrevious());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/items/suggestions
     * Get keyword suggestions based on partial input
     */
    @GetMapping("/suggestions")
    public ResponseEntity<Map<String, Object>> getSearchSuggestions(
            @RequestParam(required = true) String q) {

        log.info("GET /api/items/suggestions - partial query: '{}'", q);

        List<String> suggestions = searchService.getSuggestedKeywords(q);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("query", q);
        response.put("suggestions", suggestions);
        response.put("count", suggestions.size());

        return ResponseEntity.ok(response);
    }

}