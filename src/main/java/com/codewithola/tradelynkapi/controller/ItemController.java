package com.codewithola.tradelynkapi.controller;

import com.codewithola.tradelynkapi.dtos.requests.ItemCreateRequest;
import com.codewithola.tradelynkapi.dtos.requests.ItemUpdateRequest;
import com.codewithola.tradelynkapi.dtos.requests.SearchFilters;
import com.codewithola.tradelynkapi.dtos.response.ItemDTO;
import com.codewithola.tradelynkapi.dtos.response.PageResponse;
import com.codewithola.tradelynkapi.entity.Item;
import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.ItemFilterService;
import com.codewithola.tradelynkapi.services.ItemService;
import com.codewithola.tradelynkapi.services.SearchService;
import com.codewithola.tradelynkapi.services.SellerProfileService;
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
    private final SellerProfileService sellerProfileService;

    // ========================================
    // CREATE
    // ========================================

    @PostMapping
    public ResponseEntity<Map<String, Object>> createItem(
            @Valid @RequestBody ItemCreateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("POST /api/items - Creating item for user: {}", userPrincipal.getEmail());

        // ✅ CHECK IF SELLER IS VERIFIED BEFORE CREATING ITEM
        if (!sellerProfileService.isVerified(userPrincipal.getId())) {
            log.warn("User {} attempted to create item without verification", userPrincipal.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "You must be a verified seller of tradelynk to be able to create items");
            response.put("error", "SELLER_NOT_VERIFIED");
            response.put("hint", "Please complete seller verification or send a mail to start selling");

            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        // If verified, proceed to create item
        ItemDTO createdItem = itemService.createItem(userPrincipal.getId(), request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Item created successfully");
        response.put("data", createdItem);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ========================================
    // READ - PAGINATED (Using PageResponse)
    // ========================================

    /**
     * GET /api/items (paginated with advanced filtering)
     * ✅ UPDATED: Now returns PageResponse<ItemDTO>
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

        log.info("GET /api/items - Fetching items (page: {}, size: {}, category: {}, sort: {})",
                page, size, category, sort);

        Pageable pageable = PageRequest.of(page, size);
        Long currentUserId = userPrincipal != null ? userPrincipal.getId() : null;

        Page<ItemDTO> itemsPage = itemFilterService.filterItems(
                category, minPrice, maxPrice, condition, sort, currentUserId, pageable
        );

        // ✅ Convert to PageResponse
        PageResponse<ItemDTO> pageResponse = PageResponse.of(itemsPage);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", pageResponse);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/items/search
     * ✅ UPDATED: Now returns PageResponse<ItemDTO>
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
        Page<ItemDTO> itemsPage = searchService.searchItems(filters, currentUserId);

        // ✅ Convert to PageResponse
        PageResponse<ItemDTO> pageResponse = PageResponse.of(itemsPage);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("query", q);
        response.put("data", pageResponse);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/items/category/{category}
     * ✅ UPDATED: Now returns PageResponse<ItemDTO>
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<Map<String, Object>> getItemsByCategory(
            @PathVariable Item.Category category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("GET /api/items/category/{} - Fetching items", category);

        Pageable pageable = PageRequest.of(page, size);
        Page<ItemDTO> itemsPage = itemService.getItemsByCategory(category, pageable);

        // ✅ Convert to PageResponse
        PageResponse<ItemDTO> pageResponse = PageResponse.of(itemsPage);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", pageResponse);

        return ResponseEntity.ok(response);
    }

    // ========================================
    // READ - NON-PAGINATED (Keep as-is)
    // ========================================

    /**
     * GET /api/items/{id}
     * ❌ NOT PAGINATED - Keep as-is
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
     * GET /api/items/seller/{sellerId}
     * ❌ NOT PAGINATED - Keep as-is (returns full list)
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
     * ❌ NOT PAGINATED - Keep as-is (user's own items)
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
     * ❌ NOT PAGINATED - Keep as-is (limited trending list)
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
     * GET /api/items/suggestions
     * ❌ NOT PAGINATED - Keep as-is (simple suggestion list)
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

    // ========================================
    // UPDATE & DELETE
    // ========================================

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
}