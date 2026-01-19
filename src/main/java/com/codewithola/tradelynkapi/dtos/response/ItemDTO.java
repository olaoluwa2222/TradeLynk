package com.codewithola.tradelynkapi.dtos.response;

import com.codewithola.tradelynkapi.entity.Item;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * UPDATED ItemDTO - Enhanced with variants, images, collections, tags, and shipping
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemDTO {

    // ============================================
    // BASIC INFO (EXISTING)
    // ============================================

    private Long id;
    private Long sellerId;
    private String sellerName;
    private String sellerEmail;
    private String sellerUsername; // NEW
    private String title;
    private String description;
    private Long price; // Base price
    private Item.Category category;
    private Item.Condition condition;
    private Integer quantity; // For simple products
    private LocalDate expiryDate;
    private List<String> imageUrls; // LEGACY - will be replaced by images
    private Integer likeCount;
    private Integer viewCount;
    private Item.Status status;
    private boolean isLikedByCurrentUser;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ============================================
    // NEW FIELDS
    // ============================================

    private String slug;
    private String sku;
    private Long compareAtPrice;
    private Long costPrice;
    private Boolean isTaxable;
    private Boolean hasVariants;
    private Boolean isDigital;
    private String downloadUrl;
    private Integer downloadLimit;
    private Boolean trackInventory;
    private Integer lowStockThreshold;
    private Boolean allowBackorders;
    private Integer weightInGrams;
    private Integer lengthInCm;
    private Integer widthInCm;
    private Integer heightInCm;
    private Boolean isFeatured;
    private String metaTitle;
    private String metaDescription;
    private String vendor;
    private String productType;

    // ============================================
    // RELATIONSHIPS (NEW)
    // ============================================

    /**
     * Product variants (if hasVariants = true)
     */
    private List<ProductVariantDTO> variants;

    /**
     * Product images (replaces imageUrls)
     */
    private List<ProductImageDTO> images;

    /**
     * Primary/featured image
     */
    private ProductImageDTO primaryImage;

    /**
     * Collections this product belongs to
     */
    private List<CollectionSummaryDTO> collections;

    /**
     * Tags for this product
     */
    private List<String> tags;

    /**
     * Shipping profile
     */
    private ShippingProfileSummaryDTO shippingProfile;

    // ============================================
    // COMPUTED FIELDS (NEW)
    // ============================================

    private Boolean isInStock;
    private Boolean isLowStock;
    private Integer totalStock; // Total across all variants
    private Long lowestPrice; // Lowest variant price
    private Long highestPrice; // Highest variant price
    private Long profitMargin;
    private Double profitPercentage;

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Get display price (for frontend)
     * - If no variants: base price
     * - If variants: lowest variant price
     */
    public String getDisplayPrice() {
        if (hasVariants != null && hasVariants && lowestPrice != null) {
            if (lowestPrice.equals(highestPrice)) {
                return formatPrice(lowestPrice);
            }
            return formatPrice(lowestPrice) + " - " + formatPrice(highestPrice);
        }
        return formatPrice(price);
    }

    private String formatPrice(Long priceInKobo) {
        if (priceInKobo == null) return "₦0";
        double priceInNaira = priceInKobo / 100.0;
        return String.format("₦%,.0f", priceInNaira);
    }
}