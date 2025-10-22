package com.codewithola.tradelynkapi.services;


import com.codewithola.tradelynkapi.dtos.requests.ItemCreateRequest;
import com.codewithola.tradelynkapi.dtos.requests.ItemUpdateRequest;
import com.codewithola.tradelynkapi.dtos.response.ItemDTO;
import com.codewithola.tradelynkapi.entity.Item;
import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.exception.BadRequestException;
import com.codewithola.tradelynkapi.exception.ForbiddenException;
import com.codewithola.tradelynkapi.exception.NotFoundException;
import com.codewithola.tradelynkapi.repositories.ItemRepository;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ItemService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    // ---------------- CREATE ----------------
    @Transactional
    public ItemDTO createItem(Long sellerId, ItemCreateRequest request) {
        log.info("Creating item for seller ID: {}", sellerId);

        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new NotFoundException("Seller not found"));

        validateItemRequest(request);

        String imageUrlsJson = convertImageListToJson(request.getImageUrls());

        Item item = Item.builder()
                .seller(seller)
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .price(request.getPrice())
                .category(request.getCategory())
                .condition(request.getCondition())
                .quantity(request.getQuantity())
                .expiryDate(request.getExpiryDate())
                .imageUrls(imageUrlsJson)
                .status(Item.Status.ACTIVE)
                .likeCount(0)
                .viewCount(0)
                .build();

        Item savedItem = itemRepository.save(item);
        log.info("Item created successfully with ID: {}", savedItem.getId());

        return convertToDTO(savedItem);
    }

    // ---------------- READ ----------------
    @Transactional(readOnly = true)
    public ItemDTO getItemById(Long itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found"));

        return convertToDTO(item);
    }

    @Transactional
    public ItemDTO incrementViewCountAndGet(Long itemId, Long viewerId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found"));

        // Optional: Prevent self-views from incrementing
        if (!item.getSeller().getId().equals(viewerId)) {
            item.incrementViewCount();
            itemRepository.save(item);
        }

        return convertToDTO(item);
    }


    // ---------------- UPDATE ----------------
    @Transactional
    public ItemDTO updateItem(Long itemId, Long sellerId, ItemUpdateRequest request) {
        log.info("Updating item ID: {} by seller ID: {}", itemId, sellerId);

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found"));

        if (!item.getSeller().getId().equals(sellerId)) {
            throw new ForbiddenException("You are not authorized to update this item");
        }

        if (request.getTitle() != null) item.setTitle(request.getTitle().trim());
        if (request.getDescription() != null) item.setDescription(request.getDescription().trim());

        if (request.getPrice() != null) {
            if (request.getPrice() <= 0) throw new BadRequestException("Price must be greater than 0");
            item.setPrice(request.getPrice());
        }

        if (request.getCategory() != null) {
            item.setCategory(request.getCategory());
            if (request.getCategory() == Item.Category.FOOD &&
                    item.getExpiryDate() == null &&
                    request.getExpiryDate() == null) {
                throw new BadRequestException("Expiry date is required for FOOD category");
            }
        }

        if (request.getCondition() != null) item.setCondition(request.getCondition());

        if (request.getQuantity() != null) {
            if (request.getQuantity() < 1) throw new BadRequestException("Quantity must be at least 1");
            item.setQuantity(request.getQuantity());
        }

        if (request.getExpiryDate() != null) item.setExpiryDate(request.getExpiryDate());

        if (request.getImageUrls() != null)
            item.setImageUrls(convertImageListToJson(request.getImageUrls()));

        if (request.getStatus() != null) item.setStatus(request.getStatus());

        Item updatedItem = itemRepository.save(item);
        log.info("Item updated successfully: {}", itemId);

        return convertToDTO(updatedItem);
    }

    // ---------------- DELETE ----------------
    @Transactional
    public void deleteItem(Long itemId, Long sellerId) {
        log.info("Deleting item ID: {} by seller ID: {}", itemId, sellerId);

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found"));

        if (!item.getSeller().getId().equals(sellerId)) {
            throw new ForbiddenException("You are not authorized to delete this item");
        }

        item.setStatus(Item.Status.HIDDEN);
        itemRepository.save(item);

        log.info("Item soft deleted successfully: {}", itemId);
    }

    // ---------------- LISTING METHODS ----------------
    @Transactional(readOnly = true)
    public Page<ItemDTO> getAllActiveItems(Pageable pageable) {
        Page<Item> items = itemRepository.findByStatusOrderByCreatedAtDesc(pageable);
        return items.map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<ItemDTO> searchItems(String keyword, Pageable pageable) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllActiveItems(pageable);
        }

        Page<Item> items = itemRepository.searchByKeyword(keyword.trim(), pageable);
        return items.map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<ItemDTO> getItemsByCategory(Item.Category category, Pageable pageable) {
        Page<Item> items = itemRepository.findActiveByCategoryOrderByCreatedAtDesc(category, pageable);
        return items.map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public List<ItemDTO> getItemsBySeller(Long sellerId) {
        List<Item> items = itemRepository.findBySellerId(sellerId);
        return items.stream().map(this::convertToDTO).toList();
    }

    // ---------------- HELPER METHODS ----------------
    private void validateItemRequest(ItemCreateRequest request) {
        if (request.getCategory() == null)
            throw new BadRequestException("Category is required");
        if (request.getPrice() == null || request.getPrice() <= 0)
            throw new BadRequestException("Price must be greater than 0");
        if (request.getQuantity() == null || request.getQuantity() < 1)
            throw new BadRequestException("Quantity must be at least 1");
        if (request.getCategory() == Item.Category.FOOD && request.getExpiryDate() == null)
            throw new BadRequestException("Expiry date is required for FOOD category");
    }

    private String convertImageListToJson(List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(imageUrls);
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Invalid image URLs format");
        }
    }

    private ItemDTO convertToDTO(Item item) {
        List<String> imageUrls = Collections.emptyList();
        if (item.getImageUrls() != null && !item.getImageUrls().isEmpty()) {
            try {
                imageUrls = Arrays.asList(objectMapper.readValue(item.getImageUrls(), String[].class));
            } catch (JsonProcessingException e) {
                log.error("Error parsing image URLs for item {}", item.getId(), e);
            }
        }

        return ItemDTO.builder()
                .id(item.getId())
                .sellerId(item.getSeller().getId())
                .sellerName(item.getSeller().getName())
                .sellerEmail(item.getSeller().getEmail())
                .title(item.getTitle())
                .description(item.getDescription())
                .price(item.getPrice())
                .category(item.getCategory())
                .condition(item.getCondition())
                .quantity(item.getQuantity())
                .expiryDate(item.getExpiryDate())
                .imageUrls(imageUrls)
                .likeCount(item.getLikeCount())
                .viewCount(item.getViewCount())
                .status(item.getStatus())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}

