package com.codewithola.tradelynkapi.controller;


import com.codewithola.tradelynkapi.dtos.requests.ItemCreateRequest;
import com.codewithola.tradelynkapi.dtos.requests.ItemUpdateRequest;
import com.codewithola.tradelynkapi.dtos.response.ItemDTO;
import com.codewithola.tradelynkapi.entity.Item;
import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.ItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    // ---------------- CREATE ----------------
    @PostMapping
    public ResponseEntity<Map<String, Object>> createItem(
            @Valid @RequestBody ItemCreateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("POST /api/items - Creating item by user: {}", userPrincipal.getEmail());

        ItemDTO newItem = itemService.createItem(userPrincipal.getId(), request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Item created successfully");
        response.put("data", newItem);

        return ResponseEntity.ok(response);
    }

    // ---------------- UPDATE ----------------
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

    // ---------------- LISTING ----------------
    @GetMapping
    public ResponseEntity<Page<ItemDTO>> getAllItems(Pageable pageable) {
        Page<ItemDTO> items = itemService.getAllActiveItems(pageable);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ItemDTO>> searchItems(
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        Page<ItemDTO> items = itemService.searchItems(keyword, pageable);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemDTO> getItemById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        ItemDTO item = itemService.incrementViewCountAndGet(id, userPrincipal != null ? userPrincipal.getId() : null);
        return ResponseEntity.ok(item);
    }


    @GetMapping("/category/{category}")
    public ResponseEntity<Page<ItemDTO>> getItemsByCategory(
            @PathVariable Item.Category category,
            Pageable pageable) {
        Page<ItemDTO> items = itemService.getItemsByCategory(category, pageable);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<ItemDTO>> getItemsBySeller(@PathVariable Long sellerId) {
        List<ItemDTO> items = itemService.getItemsBySeller(sellerId);
        return ResponseEntity.ok(items);
    }

    // ---------------- DELETE ----------------
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteItem(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        itemService.deleteItem(id, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Item deleted successfully");

        return ResponseEntity.ok(response);
    }
}
