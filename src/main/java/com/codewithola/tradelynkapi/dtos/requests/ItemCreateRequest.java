package com.codewithola.tradelynkapi.dtos.requests;

import com.codewithola.tradelynkapi.entity.Item;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * UPDATED ItemCreateRequest - Enhanced with variants, images, collections, tags, and shipping
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemCreateRequest {

    // ============================================
    // BASIC PRODUCT INFO (REQUIRED)
    // ============================================

    @NotBlank(message = "Title is required")
    @Size(max = 100, message = "Title must not exceed 100 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotNull(message = "Price is required")
    @Min(value = 1, message = "Price must be greater than 0")
    private Long price; // Base price in kobo

    @NotNull(message = "Category is required")
    private Item.Category category;

    @NotNull(message = "Condition is required")
    private Item.Condition condition;

    // ============================================
    // INVENTORY (REQUIRED if not using variants)
    // ============================================

    @Min(value = 0, message = "Quantity must be at least 0")
    private Integer quantity; // Can be null if hasVariants = true

    private LocalDate expiryDate; // Required for FOOD category

    // ============================================
    // PRICING (OPTIONAL)
    // ============================================

    private Long compareAtPrice; // "Was ₦50,000, Now ₦40,000"
    private Long costPrice; // For profit calculation
    private Boolean isTaxable; // Default: true

    // ============================================
    // PRODUCT TYPE FLAGS (OPTIONAL)
    // ============================================

    private Boolean hasVariants; // Default: false
    private Boolean isDigital; // Default: false
    private String downloadUrl; // Required if isDigital = true
    private Integer downloadLimit; // Null = unlimited

    // ============================================
    // INVENTORY MANAGEMENT (OPTIONAL)
    // ============================================

    private Boolean trackInventory; // Default: true
    private Integer lowStockThreshold; // Default: 5
    private Boolean allowBackorders; // Default: false

    // ============================================
    // PHYSICAL DIMENSIONS (OPTIONAL, for shipping)
    // ============================================

    private Integer weightInGrams;
    private Integer lengthInCm;
    private Integer widthInCm;
    private Integer heightInCm;

    // ============================================
    // MARKETING & SEO (OPTIONAL)
    // ============================================

    private Boolean isFeatured; // Default: false
    private String metaTitle; // For SEO
    private String metaDescription; // For SEO
    private String vendor; // Brand name
    private String productType; // e.g., "T-Shirt", "Laptop"

    // ============================================
    // IMAGES (OPTIONAL but recommended)
    // ============================================

    /**
     * List of image URLs (Cloudinary)
     * Will be converted to ProductImage entities
     */
    private List<String> imageUrls;

    /**
     * Alt text for each image (same order as imageUrls)
     */
    private List<String> imageAltTexts;

    /**
     * Index of primary image (0-based)
     * If null, first image is primary
     */
    private Integer primaryImageIndex;

    // ============================================
    // VARIANTS (OPTIONAL)
    // ============================================

    /**
     * Product variants (if hasVariants = true)
     * Each variant has its own price, stock, SKU, etc.
     */
    private List<ProductVariantCreateRequest> variants;

    // ============================================
    // COLLECTIONS (OPTIONAL)
    // ============================================

    /**
     * Collection IDs to add this product to
     * Example: [1, 5, 8] = Add to collections with IDs 1, 5, and 8
     */
    private List<Long> collectionIds;

    // ============================================
    // TAGS (OPTIONAL)
    // ============================================

    /**
     * Tag names (will be created if they don't exist)
     * Example: ["vintage", "eco-friendly", "campus"]
     */
    private List<String> tags;

    // ============================================
    // SHIPPING (OPTIONAL)
    // ============================================

    /**
     * Shipping profile ID
     * If null, uses seller's default shipping profile
     */
    private Long shippingProfileId;

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Check if this is a simple product (no variants)
     */
    public boolean isSimpleProduct() {
        return hasVariants == null || !hasVariants;
    }

    /**
     * Check if this is a variable product (has variants)
     */
    public boolean isVariableProduct() {
        return hasVariants != null && hasVariants;
    }

    /**
     * Validate that quantity is provided for simple products
     */
    public boolean isQuantityValid() {
        if (isSimpleProduct()) {
            return quantity != null && quantity >= 0;
        }
        return true; // Variants will have their own stock
    }

    /**
     * Validate that variants are provided for variable products
     */
    public boolean areVariantsValid() {
        if (isVariableProduct()) {
            return variants != null && !variants.isEmpty();
        }
        return true;
    }

    /**
     * Validate digital product has download URL
     */
    public boolean isDigitalProductValid() {
        if (isDigital != null && isDigital) {
            return downloadUrl != null && !downloadUrl.isBlank();
        }
        return true;
    }
}