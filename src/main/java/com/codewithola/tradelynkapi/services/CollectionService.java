package com.codewithola.tradelynkapi.services;

import com.codewithola.tradelynkapi.dtos.requests.CollectionCreateRequest;
import com.codewithola.tradelynkapi.dtos.requests.CollectionUpdateRequest;
import com.codewithola.tradelynkapi.dtos.response.CollectionDTO;
import com.codewithola.tradelynkapi.dtos.response.ItemDTO;
import com.codewithola.tradelynkapi.entity.Collection;
import com.codewithola.tradelynkapi.entity.Item;
import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.exception.BadRequestException;
import com.codewithola.tradelynkapi.exception.ForbiddenException;
import com.codewithola.tradelynkapi.exception.NotFoundException;
import com.codewithola.tradelynkapi.repositories.CollectionRepository;
import com.codewithola.tradelynkapi.repositories.ItemRepository;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CollectionService {

    private final CollectionRepository collectionRepository;
    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final ItemService itemService;

    // ============================================
    // CREATE
    // ============================================

    /**
     * Create a new collection
     */
    @Transactional
    public CollectionDTO createCollection(Long sellerId, CollectionCreateRequest request) {
        log.info("Creating collection '{}' for seller ID: {}", request.getName(), sellerId);

        // 1. Validate seller exists
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new NotFoundException("Seller not found"));

        // 2. Validate name is unique for this seller
        if (collectionRepository.findBySellerIdAndName(sellerId, request.getName()).isPresent()) {
            throw new BadRequestException("Collection with name '" + request.getName() + "' already exists");
        }

        // 3. Generate slug
        String baseSlug = generateSlugFromName(request.getName(), sellerId);
        String slug = baseSlug;
        int counter = 1;

        // Ensure slug is unique
        while (collectionRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter++;
        }

        // 4. Create collection entity
        Collection collection = Collection.builder()
                .seller(seller)
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .isFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : false)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .metaTitle(request.getMetaTitle())
                .metaDescription(request.getMetaDescription())
                .build();

        // 5. Save collection
        Collection savedCollection = collectionRepository.save(collection);

        // 6. Add items to collection (if provided)
        if (request.getItemIds() != null && !request.getItemIds().isEmpty()) {
            for (Long itemId : request.getItemIds()) {
                Item item = itemRepository.findById(itemId).orElse(null);
                if (item != null && item.getSeller().getId().equals(sellerId)) {
                    savedCollection.addItem(item);
                }
            }
            savedCollection = collectionRepository.save(savedCollection);
        }

        log.info("Collection created successfully with ID: {} (slug: {})", savedCollection.getId(), slug);

        return convertToDTO(savedCollection);
    }

    // ============================================
    // READ
    // ============================================

    /**
     * Get collection by ID
     */
    @Transactional(readOnly = true)
    public CollectionDTO getCollectionById(Long collectionId) {
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new NotFoundException("Collection not found"));

        return convertToDTO(collection);
    }

    /**
     * Get collection by slug
     */
    @Transactional(readOnly = true)
    public CollectionDTO getCollectionBySlug(String slug) {
        Collection collection = collectionRepository.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Collection not found"));

        return convertToDTO(collection);
    }

    /**
     * Get all collections for a seller
     */
    @Transactional(readOnly = true)
    public List<CollectionDTO> getSellerCollections(Long sellerId, Boolean activeOnly) {
        List<Collection> collections;

        if (activeOnly != null && activeOnly) {
            collections = collectionRepository.findBySellerIdAndIsActiveTrueOrderByDisplayOrderAsc(sellerId);
        } else {
            collections = collectionRepository.findBySellerIdOrderByDisplayOrderAsc(sellerId);
        }

        return collections.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get featured collections for a seller
     */
    @Transactional(readOnly = true)
    public List<CollectionDTO> getFeaturedCollections(Long sellerId) {
        List<Collection> collections = collectionRepository.findFeaturedCollectionsBySeller(sellerId);

        return collections.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ============================================
    // UPDATE
    // ============================================

    /**
     * Update collection
     */
    @Transactional
    public CollectionDTO updateCollection(Long collectionId, Long sellerId, CollectionUpdateRequest request) {
        log.info("Updating collection ID: {} by seller ID: {}", collectionId, sellerId);

        // 1. Fetch collection
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new NotFoundException("Collection not found"));

        // 2. Verify seller owns the collection
        if (!collection.getSeller().getId().equals(sellerId)) {
            throw new ForbiddenException("You are not authorized to update this collection");
        }

        // 3. Update fields
        if (request.getName() != null && !request.getName().isBlank()) {
            // Check if new name is unique (excluding current collection)
            collectionRepository.findBySellerIdAndName(sellerId, request.getName())
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(collectionId)) {
                            throw new BadRequestException("Collection with name '" + request.getName() + "' already exists");
                        }
                    });

            collection.setName(request.getName());

            // Regenerate slug if name changed
            String newSlug = generateSlugFromName(request.getName(), sellerId);
            if (!newSlug.equals(collection.getSlug())) {
                collection.setSlug(newSlug);
            }
        }

        if (request.getDescription() != null) {
            collection.setDescription(request.getDescription());
        }

        if (request.getImageUrl() != null) {
            collection.setImageUrl(request.getImageUrl());
        }

        if (request.getIsActive() != null) {
            collection.setIsActive(request.getIsActive());
        }

        if (request.getIsFeatured() != null) {
            collection.setIsFeatured(request.getIsFeatured());
        }

        if (request.getDisplayOrder() != null) {
            collection.setDisplayOrder(request.getDisplayOrder());
        }

        if (request.getMetaTitle() != null) {
            collection.setMetaTitle(request.getMetaTitle());
        }

        if (request.getMetaDescription() != null) {
            collection.setMetaDescription(request.getMetaDescription());
        }

        // 4. Update items in collection (if provided)
        if (request.getItemIds() != null) {
            // Clear existing items
            collection.getItems().clear();

            // Add new items
            for (Long itemId : request.getItemIds()) {
                Item item = itemRepository.findById(itemId).orElse(null);
                if (item != null && item.getSeller().getId().equals(sellerId)) {
                    collection.addItem(item);
                }
            }
        }

        // 5. Save updated collection
        Collection updatedCollection = collectionRepository.save(collection);

        log.info("Collection updated successfully: {}", collectionId);

        return convertToDTO(updatedCollection);
    }

    /**
     * Add items to collection
     */
    @Transactional
    public CollectionDTO addItemsToCollection(Long collectionId, Long sellerId, List<Long> itemIds) {
        log.info("Adding {} items to collection ID: {}", itemIds.size(), collectionId);

        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new NotFoundException("Collection not found"));

        if (!collection.getSeller().getId().equals(sellerId)) {
            throw new ForbiddenException("You are not authorized to modify this collection");
        }

        for (Long itemId : itemIds) {
            Item item = itemRepository.findById(itemId).orElse(null);
            if (item != null && item.getSeller().getId().equals(sellerId)) {
                collection.addItem(item);
            }
        }

        Collection updatedCollection = collectionRepository.save(collection);

        return convertToDTO(updatedCollection);
    }

    /**
     * Remove items from collection
     */
    @Transactional
    public CollectionDTO removeItemsFromCollection(Long collectionId, Long sellerId, List<Long> itemIds) {
        log.info("Removing {} items from collection ID: {}", itemIds.size(), collectionId);

        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new NotFoundException("Collection not found"));

        if (!collection.getSeller().getId().equals(sellerId)) {
            throw new ForbiddenException("You are not authorized to modify this collection");
        }

        for (Long itemId : itemIds) {
            Item item = itemRepository.findById(itemId).orElse(null);
            if (item != null) {
                collection.removeItem(item);
            }
        }

        Collection updatedCollection = collectionRepository.save(collection);

        return convertToDTO(updatedCollection);
    }

    // ============================================
    // DELETE
    // ============================================

    /**
     * Delete collection
     */
    @Transactional
    public void deleteCollection(Long collectionId, Long sellerId) {
        log.info("Deleting collection ID: {} by seller ID: {}", collectionId, sellerId);

        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new NotFoundException("Collection not found"));

        if (!collection.getSeller().getId().equals(sellerId)) {
            throw new ForbiddenException("You are not authorized to delete this collection");
        }

        collectionRepository.delete(collection);

        log.info("Collection deleted successfully: {}", collectionId);
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Generate slug from collection name
     */
    private String generateSlugFromName(String name, Long sellerId) {
        String slug = name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");

        // Add seller ID to ensure uniqueness across sellers
        return sellerId + "-" + slug;
    }

    /**
     * Convert Collection entity to DTO
     */
    private CollectionDTO convertToDTO(Collection collection) {
        // Get items in collection
        List<ItemDTO> items = collection.getItems().stream()
                .filter(item -> item.getStatus() == Item.Status.ACTIVE)
                .map(item -> {
                    User seller = item.getSeller();
                    return itemService.convertToDTOPublic(item, seller, Collections.emptySet());
                })
                .collect(Collectors.toList());

        return CollectionDTO.builder()
                .id(collection.getId())
                .sellerId(collection.getSeller().getId())
                .sellerName(collection.getSeller().getName())
                .name(collection.getName())
                .slug(collection.getSlug())
                .description(collection.getDescription())
                .imageUrl(collection.getImageUrl())
                .isActive(collection.getIsActive())
                .isFeatured(collection.getIsFeatured())
                .displayOrder(collection.getDisplayOrder())
                .metaTitle(collection.getMetaTitle())
                .metaDescription(collection.getMetaDescription())
                .items(items)
                .itemCount(items.size())
                .createdAt(collection.getCreatedAt())
                .updatedAt(collection.getUpdatedAt())
                .build();
    }
}