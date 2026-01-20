package com.codewithola.tradelynkapi.services;

import com.codewithola.tradelynkapi.dtos.requests.ItemCreateRequest;
import com.codewithola.tradelynkapi.dtos.requests.ItemUpdateRequest;
import com.codewithola.tradelynkapi.dtos.requests.ProductVariantCreateRequest;
import com.codewithola.tradelynkapi.dtos.response.*;
import com.codewithola.tradelynkapi.entity.*;
import com.codewithola.tradelynkapi.entity.Collection;
import com.codewithola.tradelynkapi.exception.BadRequestException;
import com.codewithola.tradelynkapi.exception.ForbiddenException;
import com.codewithola.tradelynkapi.exception.NotFoundException;
import com.codewithola.tradelynkapi.repositories.*;
import com.codewithola.tradelynkapi.services.LikeService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ItemService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final LikeService likeService;
    private final ObjectMapper objectMapper;
    private final ContentModerationService contentModerationService;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private ProductImageRepository productImageRepository;

    @Autowired
    private CollectionRepository collectionRepository;

    @Autowired
    private ProductTagRepository productTagRepository;

    @Autowired
    private ShippingProfileRepository shippingProfileRepository;

    // ========================================
    // CREATE
    // ========================================

    /**
     * UPDATED createItem method - handles variants, images, collections, tags
     */
    @Transactional
    public ItemDTO createItem(Long sellerId, ItemCreateRequest request) {
        log.info("Creating item with enhanced features for seller ID: {}", sellerId);

        // 1. Validate seller exists
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new NotFoundException("Seller not found"));

        // 2. Content moderation
        ContentModerationResult moderationResult = contentModerationService.validateItemContent(
                request.getTitle(), request.getDescription());
        if (!moderationResult.getAllowed()) {
            throw new BadRequestException("Item contains prohibited keywords");
        }

        // 3. Validate request
        validateItemCreateRequest(request);

        // 4. Convert image URLs to JSON (for legacy support)
        String imageUrlsJson = null;
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            try {
                imageUrlsJson = objectMapper.writeValueAsString(request.getImageUrls());
            } catch (JsonProcessingException e) {
                throw new BadRequestException("Invalid image URLs format");
            }
        }

        // 5. Create item entity
        Item item = Item.builder()
                .seller(seller)
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .price(request.getPrice())
                .category(request.getCategory())
                .condition(request.getCondition())
                .quantity(request.getQuantity() != null ? request.getQuantity() : 0)
                .expiryDate(request.getExpiryDate())
                .imageUrls(imageUrlsJson) // Legacy
                // New fields
                .compareAtPrice(request.getCompareAtPrice())
                .costPrice(request.getCostPrice())
                .isTaxable(request.getIsTaxable() != null ? request.getIsTaxable() : true)
                .hasVariants(request.getHasVariants() != null && request.getHasVariants())
                .isDigital(request.getIsDigital() != null && request.getIsDigital())
                .downloadUrl(request.getDownloadUrl())
                .downloadLimit(request.getDownloadLimit())
                .trackInventory(request.getTrackInventory() != null ? request.getTrackInventory() : true)
                .lowStockThreshold(request.getLowStockThreshold() != null ? request.getLowStockThreshold() : 5)
                .allowBackorders(request.getAllowBackorders() != null && request.getAllowBackorders())
                .weightInGrams(request.getWeightInGrams())
                .lengthInCm(request.getLengthInCm())
                .widthInCm(request.getWidthInCm())
                .heightInCm(request.getHeightInCm())
                .isFeatured(request.getIsFeatured() != null && request.getIsFeatured())
                .metaTitle(request.getMetaTitle())
                .metaDescription(request.getMetaDescription())
                .vendor(request.getVendor())
                .productType(request.getProductType())
                .status(Item.Status.ACTIVE)
                .likeCount(0)
                .viewCount(0)
                .build();

        // 6. Save item (to get ID)
        Item savedItem = itemRepository.save(item);

        // 7. Generate and set slug & SKU
        savedItem.setSlug(Item.generateSlug(request.getTitle(), savedItem.getId()));
        savedItem.setSku(Item.generateSKU(request.getCategory(), savedItem.getId()));
        savedItem = itemRepository.save(savedItem);

        // 8. Handle variants (if any)
        if (request.getHasVariants() != null && request.getHasVariants() &&
                request.getVariants() != null && !request.getVariants().isEmpty()) {

            int position = 0;
            for (ProductVariantCreateRequest variantReq : request.getVariants()) {
                ProductVariant variant = createVariantFromRequest(savedItem, variantReq, position++);
                productVariantRepository.save(variant);
            }
        }

        // 9. Handle images (if any)
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            List<String> altTexts = request.getImageAltTexts();
            Integer primaryIndex = request.getPrimaryImageIndex() != null ? request.getPrimaryImageIndex() : 0;

            for (int i = 0; i < request.getImageUrls().size(); i++) {
                String imageUrl = request.getImageUrls().get(i);
                String altText = (altTexts != null && i < altTexts.size()) ? altTexts.get(i) : request.getTitle();

                ProductImage image = ProductImage.builder()
                        .item(savedItem)
                        .imageUrl(imageUrl)
                        .altText(altText)
                        .position(i)
                        .isPrimary(i == primaryIndex)
                        .build();

                productImageRepository.save(image);
            }
        }

        // 10. Handle collections (if any)
        if (request.getCollectionIds() != null && !request.getCollectionIds().isEmpty()) {
            for (Long collectionId : request.getCollectionIds()) {
                Collection collection = collectionRepository.findById(collectionId)
                        .orElse(null);
                if (collection != null && collection.getSeller().getId().equals(sellerId)) {
                    collection.addItem(savedItem);
                    collectionRepository.save(collection);
                }
            }
        }

        // 11. Handle tags (if any)
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            for (String tagName : request.getTags()) {
                String normalizedName = ProductTag.normalizeName(tagName);

                // Find or create tag
                ProductTag tag = productTagRepository.findByName(normalizedName)
                        .orElseGet(() -> {
                            ProductTag newTag = ProductTag.builder()
                                    .name(normalizedName)
                                    .displayName(tagName)
                                    .usageCount(0)
                                    .build();
                            return productTagRepository.save(newTag);
                        });

                savedItem.addTag(tag);
            }
            itemRepository.save(savedItem);
        }

        // 12. Handle shipping profile (if specified)
        if (request.getShippingProfileId() != null) {
            ShippingProfile shippingProfile = shippingProfileRepository.findById(request.getShippingProfileId())
                    .orElse(null);
            if (shippingProfile != null && shippingProfile.getSeller().getId().equals(sellerId)) {
                savedItem.setShippingProfile(shippingProfile);
                itemRepository.save(savedItem);
            }
        }

        log.info("Item created successfully with ID: {} (variants: {}, images: {})",
                savedItem.getId(),
                request.getVariants() != null ? request.getVariants().size() : 0,
                request.getImageUrls() != null ? request.getImageUrls().size() : 0);

        return convertToEnhancedDTO(savedItem, seller, Collections.emptySet());
    }

    // ========================================
    // READ
    // ========================================

    @Transactional(readOnly = true)
    public ItemDTO getItemById(Long itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found"));

        User seller = userRepository.findById(item.getSeller().getId())
                .orElseThrow(() -> new NotFoundException("Seller not found"));

        return convertToEnhancedDTO(item, seller, Collections.emptySet()); // ✅ FIXED
    }

    @Transactional
    public ItemDTO incrementViewCountAndGet(Long itemId, Long viewerId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found"));

        if (viewerId == null || !item.getSeller().getId().equals(viewerId)) {
            item.incrementViewCount();
            itemRepository.save(item);
        }

        User seller = userRepository.findById(item.getSeller().getId())
                .orElseThrow(() -> new NotFoundException("Seller not found"));

        return convertToEnhancedDTO(item, seller, Collections.emptySet()); // ✅ FIXED
    }

    @Transactional(readOnly = true)
    public Page<ItemDTO> getAllActiveItems(Pageable pageable) {
        Page<Item> items = itemRepository.findByStatusOrderByCreatedAtDesc(pageable);
        return items.map(item -> {
            User seller = userRepository.findById(item.getSeller().getId()).orElse(null);
            return convertToEnhancedDTO(item, seller, Collections.emptySet()); // ✅ FIXED
        });
    }

    @Transactional(readOnly = true)
    public Page<ItemDTO> getAllActiveItemsWithLikeStatus(Pageable pageable, Long currentUserId) {
        Page<Item> items = itemRepository.findByStatusOrderByCreatedAtDesc(pageable);
        Set<Long> likedItemIds = currentUserId != null
                ? likeService.getUserLikedItemIdsAsSet(currentUserId)
                : Collections.emptySet();

        return items.map(item -> {
            User seller = userRepository.findById(item.getSeller().getId()).orElse(null);
            return convertToEnhancedDTO(item, seller, likedItemIds); // ✅ FIXED
        });
    }

    @Transactional(readOnly = true)
    public Page<ItemDTO> searchItems(String keyword, Pageable pageable) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllActiveItems(pageable);
        }

        Page<Item> items = itemRepository.searchByKeyword(keyword.trim(), pageable);
        return items.map(item -> {
            User seller = userRepository.findById(item.getSeller().getId()).orElse(null);
            return convertToEnhancedDTO(item, seller, Collections.emptySet()); // ✅ FIXED
        });
    }

    @Transactional(readOnly = true)
    public Page<ItemDTO> getItemsByCategory(Item.Category category, Pageable pageable) {
        Page<Item> items = itemRepository.findActiveByCategoryOrderByCreatedAtDesc(category, pageable);
        return items.map(item -> {
            User seller = userRepository.findById(item.getSeller().getId()).orElse(null);
            return convertToEnhancedDTO(item, seller, Collections.emptySet()); // ✅ FIXED
        });
    }

    @Transactional(readOnly = true)
    public List<ItemDTO> getItemsBySeller(Long sellerId) {
        List<Item> items = itemRepository.findBySellerId(sellerId);
        return items.stream()
                .map(item -> {
                    User seller = userRepository.findById(sellerId).orElse(null);
                    return convertToEnhancedDTO(item, seller, Collections.emptySet()); // ✅ FIXED
                })
                .toList();
    }

    // ========================================
    // UPDATE
    // ========================================

    @Transactional
    public ItemDTO updateItem(Long itemId, Long sellerId, ItemUpdateRequest request) {
        log.info("Updating item ID: {} by seller ID: {}", itemId, sellerId);

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found"));

        if (!item.getSeller().getId().equals(sellerId)) {
            throw new ForbiddenException("You are not authorized to update this item");
        }

        // Handle title & description updates with content moderation
        if (request.getTitle() != null || request.getDescription() != null) {
            String newTitle = request.getTitle() != null ? request.getTitle().trim() : item.getTitle();
            String newDescription = request.getDescription() != null ? request.getDescription().trim() : item.getDescription();

            ContentModerationResult moderationResult = contentModerationService.validateItemContent(
                    newTitle, newDescription);

            if (!moderationResult.getAllowed()) {
                log.warn("Item content flagged on update. Flagged words: {}", moderationResult.getFlaggedWords());
                throw new BadRequestException(
                        "Item update contains prohibited keywords: " + String.join(", ", moderationResult.getFlaggedWords()));
            }

            item.setTitle(newTitle);
            item.setDescription(newDescription);
        }

        if (request.getPrice() != null) {
            if (request.getPrice() <= 0) {
                throw new BadRequestException("Price must be greater than 0");
            }
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

        if (request.getCondition() != null) {
            item.setCondition(request.getCondition());
        }

        if (request.getQuantity() != null) {
            if (request.getQuantity() < 1) {
                throw new BadRequestException("Quantity must be at least 1");
            }
            item.setQuantity(request.getQuantity());
        }

        if (request.getExpiryDate() != null) {
            item.setExpiryDate(request.getExpiryDate());
        }

        if (request.getImageUrls() != null) {
            try {
                String imageUrlsJson = objectMapper.writeValueAsString(request.getImageUrls());
                item.setImageUrls(imageUrlsJson);
            } catch (JsonProcessingException e) {
                throw new BadRequestException("Invalid image URLs format");
            }
        }

        if (request.getStatus() != null) {
            item.setStatus(request.getStatus());
        }

        Item updatedItem = itemRepository.save(item);
        log.info("Item updated successfully: {}", itemId);

        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new NotFoundException("Seller not found"));

        return convertToEnhancedDTO(updatedItem, seller, Collections.emptySet()); // ✅ FIXED
    }

    // ========================================
    // DELETE
    // ========================================

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

    // ========================================
    // HELPER METHODS
    // ========================================

    private ProductVariant createVariantFromRequest(Item item, ProductVariantCreateRequest req, int position) {
        String variantOptions = null;
        if (req.getVariantOptions() != null) {
            try {
                variantOptions = objectMapper.writeValueAsString(req.getVariantOptions());
            } catch (JsonProcessingException e) {
                log.error("Error serializing variant options", e);
            }
        }

        String sku = req.getSku();
        if (sku == null || sku.isBlank()) {
            sku = item.getSku() + "-V" + (position + 1);
        }

        return ProductVariant.builder()
                .item(item)
                .variantName(req.getVariantName())
                .sku(sku)
                .price(req.getPrice())
                .compareAtPrice(req.getCompareAtPrice())
                .costPrice(req.getCostPrice())
                .stock(req.getStock())
                .lowStockThreshold(req.getLowStockThreshold() != null ? req.getLowStockThreshold() : 5)
                .trackInventory(req.getTrackInventory() != null ? req.getTrackInventory() : true)
                .allowBackorders(req.getAllowBackorders() != null && req.getAllowBackorders())
                .imageUrl(req.getImageUrl())
                .isDefault(position == 0)
                .position(position)
                .weightInGrams(req.getWeightInGrams())
                .variantOptions(variantOptions)
                .isAvailable(req.getIsAvailable() != null ? req.getIsAvailable() : true)
                .build();
    }

    private void validateItemCreateRequest(ItemCreateRequest request) {
        if (request.getCategory() == null) {
            throw new BadRequestException("Category is required");
        }

        if (request.getPrice() == null || request.getPrice() <= 0) {
            throw new BadRequestException("Price must be greater than 0");
        }

        if (!request.isVariableProduct() && (request.getQuantity() == null || request.getQuantity() < 0)) {
            throw new BadRequestException("Quantity is required for simple products");
        }

        if (request.isVariableProduct() && (request.getVariants() == null || request.getVariants().isEmpty())) {
            throw new BadRequestException("At least one variant is required for variable products");
        }

        if (!request.isDigitalProductValid()) {
            throw new BadRequestException("Download URL is required for digital products");
        }

        if (request.getCategory() == Item.Category.FOOD && request.getExpiryDate() == null) {
            throw new BadRequestException("Expiry date is required for FOOD category");
        }
    }

    // ========================================
    // DTO CONVERTERS
    // ========================================

    /**
     * ✅ ENHANCED DTO CONVERTER - USE THIS FOR ALL CONVERSIONS
     */
    private ItemDTO convertToEnhancedDTO(Item item, User seller, Set<Long> likedItemIds) {
        // 1. Get variants
        List<ProductVariantDTO> variantDTOs = null;
        if (item.getHasVariants()) {
            List<ProductVariant> variants = productVariantRepository.findByItemIdOrderByPositionAsc(item.getId());
            variantDTOs = variants.stream().map(this::convertVariantToDTO).toList();
        }

        // 2. Get images
        List<ProductImage> images = productImageRepository.findByItemIdOrderByPositionAsc(item.getId());
        List<ProductImageDTO> imageDTOs = images.stream()
                .map(this::convertImageToDTO)
                .toList();

        ProductImageDTO primaryImage = images.stream()
                .filter(ProductImage::getIsPrimary)
                .map(this::convertImageToDTO)
                .findFirst()
                .orElse(imageDTOs.isEmpty() ? null : imageDTOs.get(0));

        // 3. Get collections
        List<Collection> collections = collectionRepository.findCollectionsByItemId(item.getId());
        List<CollectionSummaryDTO> collectionDTOs = collections.stream()
                .map(c -> CollectionSummaryDTO.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .slug(c.getSlug())
                        .isFeatured(c.getIsFeatured())
                        .build())
                .toList();

        // 4. Get tags
        List<ProductTag> tags = productTagRepository.findTagsByItemId(item.getId());
        List<String> tagNames = tags.stream().map(ProductTag::getDisplayName).toList();

        // 5. Get shipping profile
        ShippingProfileSummaryDTO shippingDTO = null;
        if (item.getShippingProfile() != null) {
            ShippingProfile sp = item.getShippingProfile();
            shippingDTO = ShippingProfileSummaryDTO.builder()
                    .id(sp.getId())
                    .name(sp.getName())
                    .shippingMethod(sp.getShippingMethod().name())
                    .flatRateCost(sp.getFlatRateCost())
                    .minDeliveryDays(sp.getMinDeliveryDays())
                    .maxDeliveryDays(sp.getMaxDeliveryDays())
                    .isFreeShipping(sp.getShippingMethod() == ShippingProfile.ShippingMethod.FREE_SHIPPING)
                    .build();
        }

        // 6. Calculate computed fields (FIXED!)
        Long lowestPrice = null;
        Long highestPrice = null;
        Integer totalStock = 0;
        Boolean isInStock = false;
        Boolean isLowStock = false;

        if (variantDTOs != null && !variantDTOs.isEmpty()) {
            lowestPrice = variantDTOs.stream()
                    .map(ProductVariantDTO::getEffectivePrice)
                    .min(Long::compareTo)
                    .orElse(item.getPrice());

            highestPrice = variantDTOs.stream()
                    .map(ProductVariantDTO::getEffectivePrice)
                    .max(Long::compareTo)
                    .orElse(item.getPrice());

            totalStock = variantDTOs.stream()
                    .filter(ProductVariantDTO::getTrackInventory)
                    .mapToInt(ProductVariantDTO::getStock)
                    .sum();

            isInStock = variantDTOs.stream()
                    .anyMatch(ProductVariantDTO::getIsInStock);

            isLowStock = variantDTOs.stream()
                    .anyMatch(ProductVariantDTO::getIsLowStock);

        } else {
            totalStock = item.getQuantity();
            isInStock = item.isInStock();
            isLowStock = item.isLowStock();
        }

        // 7. Legacy image URLs (for backward compatibility)
        List<String> legacyImageUrls = imageDTOs.stream()
                .map(ProductImageDTO::getImageUrl)
                .toList();
        if (legacyImageUrls.isEmpty() && item.getImageUrls() != null) {
            try {
                legacyImageUrls = Arrays.asList(objectMapper.readValue(item.getImageUrls(), String[].class));
            } catch (Exception e) {
                legacyImageUrls = Collections.emptyList();
            }
        }

        boolean isLiked = likedItemIds != null && likedItemIds.contains(item.getId());

        return ItemDTO.builder()
                // Basic info
                .id(item.getId())
                .sellerId(seller.getId())
                .sellerName(seller.getName())
                .sellerEmail(seller.getEmail())
                .sellerUsername(seller.getUsername())
                .title(item.getTitle())
                .description(item.getDescription())
                .price(item.getPrice())
                .category(item.getCategory())
                .condition(item.getCondition())
                .quantity(item.getQuantity())
                .expiryDate(item.getExpiryDate())
                .imageUrls(legacyImageUrls)
                .likeCount(item.getLikeCount())
                .viewCount(item.getViewCount())
                .status(item.getStatus())
                .isLikedByCurrentUser(isLiked)
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                // New fields
                .slug(item.getSlug())
                .sku(item.getSku())
                .compareAtPrice(item.getCompareAtPrice())
                .costPrice(item.getCostPrice())
                .isTaxable(item.getIsTaxable())
                .hasVariants(item.getHasVariants())
                .isDigital(item.getIsDigital())
                .downloadUrl(item.getDownloadUrl())
                .downloadLimit(item.getDownloadLimit())
                .trackInventory(item.getTrackInventory())
                .lowStockThreshold(item.getLowStockThreshold())
                .allowBackorders(item.getAllowBackorders())
                .weightInGrams(item.getWeightInGrams())
                .lengthInCm(item.getLengthInCm())
                .widthInCm(item.getWidthInCm())
                .heightInCm(item.getHeightInCm())
                .isFeatured(item.getIsFeatured())
                .metaTitle(item.getMetaTitle())
                .metaDescription(item.getMetaDescription())
                .vendor(item.getVendor())
                .productType(item.getProductType())
                // Relationships
                .variants(variantDTOs)
                .images(imageDTOs)
                .primaryImage(primaryImage)
                .collections(collectionDTOs)
                .tags(tagNames)
                .shippingProfile(shippingDTO)
                // Computed fields
                .isInStock(isInStock)
                .isLowStock(isLowStock)
                .totalStock(totalStock)
                .lowestPrice(lowestPrice)
                .highestPrice(highestPrice)
                .profitMargin(item.getProfitMargin())
                .profitPercentage(item.getProfitPercentage())
                .build();
    }

    private ProductVariantDTO convertVariantToDTO(ProductVariant variant) {
        Map<String, String> variantOptions = null;
        if (variant.getVariantOptions() != null) {
            try {
                variantOptions = objectMapper.readValue(variant.getVariantOptions(),
                        new TypeReference<Map<String, String>>() {});
            } catch (Exception e) {
                log.error("Error parsing variant options", e);
            }
        }

        return ProductVariantDTO.builder()
                .id(variant.getId())
                .itemId(variant.getItem().getId())
                .variantName(variant.getVariantName())
                .sku(variant.getSku())
                .price(variant.getPrice())
                .effectivePrice(variant.getEffectivePrice())
                .compareAtPrice(variant.getCompareAtPrice())
                .costPrice(variant.getCostPrice())
                .stock(variant.getStock())
                .lowStockThreshold(variant.getLowStockThreshold())
                .trackInventory(variant.getTrackInventory())
                .allowBackorders(variant.getAllowBackorders())
                .imageUrl(variant.getImageUrl())
                .isDefault(variant.getIsDefault())
                .position(variant.getPosition())
                .weightInGrams(variant.getWeightInGrams())
                .variantOptions(variantOptions)
                .isAvailable(variant.getIsAvailable())
                .isInStock(variant.isInStock())
                .isLowStock(variant.isLowStock())
                .profitMargin(variant.getProfitMargin())
                .profitPercentage(variant.getProfitPercentage())
                .createdAt(variant.getCreatedAt())
                .updatedAt(variant.getUpdatedAt())
                .build();
    }

    private ProductImageDTO convertImageToDTO(ProductImage image) {
        return ProductImageDTO.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .thumbnailUrl(image.getThumbnailUrl())
                .altText(image.getAltText())
                .position(image.getPosition())
                .isPrimary(image.getIsPrimary())
                .width(image.getWidth())
                .height(image.getHeight())
                .createdAt(image.getCreatedAt())
                .build();
    }

    // Legacy public method for backward compatibility
    public ItemDTO convertToDTOPublic(Item item, User seller, Set<Long> likedItemIds) {
        return convertToEnhancedDTO(item, seller, likedItemIds);
    }

    /**
     * Get item by slug (for SEO-friendly URLs)
     */
    @Transactional(readOnly = true)
    public ItemDTO getItemBySlug(String slug, Long viewerId) {
        log.info("Fetching item by slug: {}", slug);

        Item item = itemRepository.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Item not found"));

        // Increment view count if viewer is not the seller
        if (viewerId != null && !item.getSeller().getId().equals(viewerId)) {
            item.incrementViewCount();
            itemRepository.save(item);
        }

        User seller = userRepository.findById(item.getSeller().getId())
                .orElseThrow(() -> new NotFoundException("Seller not found"));

        Set<Long> likedItemIds = viewerId != null
                ? likeService.getUserLikedItemIdsAsSet(viewerId)
                : Collections.emptySet();

        return convertToEnhancedDTO(item, seller, likedItemIds);
    }

    /**
     * Get related items (similar products)
     * Algorithm:
     * 1. Same category
     * 2. Similar price range (±30%)
     * 3. Exclude current item
     * 4. Active status only
     * 5. Sort by views/likes
     */
    @Transactional(readOnly = true)
    public List<ItemDTO> getRelatedItems(Long itemId, int limit, Long currentUserId) {
        log.info("Fetching related items for item ID: {} (limit: {})", itemId, limit);

        // 1. Get the current item
        Item currentItem = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found"));

        // 2. Calculate price range (±30%)
        Long minPrice = (long) (currentItem.getPrice() * 0.7);
        Long maxPrice = (long) (currentItem.getPrice() * 1.3);

        // 3. Find related items
        List<Item> relatedItems = itemRepository.findRelatedItems(
                currentItem.getCategory(),
                minPrice,
                maxPrice,
                itemId,
                Item.Status.ACTIVE
        );

        // 4. Limit results
        List<Item> limitedItems = relatedItems.stream()
                .limit(limit)
                .toList();

        // 5. Convert to DTOs
        Set<Long> likedItemIds = currentUserId != null
                ? likeService.getUserLikedItemIdsAsSet(currentUserId)
                : Collections.emptySet();

        return limitedItems.stream()
                .map(item -> {
                    User seller = userRepository.findById(item.getSeller().getId()).orElse(null);
                    return convertToEnhancedDTO(item, seller, likedItemIds);
                })
                .toList();
    }

}