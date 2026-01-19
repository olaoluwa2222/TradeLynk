package com.codewithola.tradelynkapi.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * UPDATED Item Entity - Enhanced for e-commerce with variants, images, collections, tags, and shipping
 */
@Entity
@Table(name = "items", indexes = {
        @Index(name = "idx_seller_id", columnList = "seller_id"),
        @Index(name = "idx_category", columnList = "category"),
        @Index(name = "idx_status", columnList = "status"),
        @Index(name = "idx_slug", columnList = "slug", unique = true),
        @Index(name = "idx_sku", columnList = "sku", unique = true),
        @Index(name = "idx_created_at", columnList = "created_at"),
        @Index(name = "idx_is_featured", columnList = "is_featured")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ============================================
    // EXISTING FIELDS (KEEP AS-IS)
    // ============================================

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private User seller;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false)
    private Long price; // Base price in kobo

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Condition condition;

    @Column(nullable = false)
    private Integer quantity;

    @Column
    private LocalDate expiryDate;

    @Column(columnDefinition = "TEXT")
    private String imageUrls; // LEGACY - will be replaced by ProductImage entities

    @Builder.Default
    @Column(nullable = false)
    private Integer likeCount = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer viewCount = 0;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ============================================
    // NEW FIELDS FOR ENHANCED E-COMMERCE
    // ============================================

    /**
     * URL-friendly slug for SEO
     * Example: "macbook-air-m1-2024"
     */
    @Column(unique = true, length = 150)
    private String slug;

    /**
     * SKU (Stock Keeping Unit) - unique product identifier
     * Example: "ELEC-MAC-001"
     */
    @Column(unique = true, length = 100)
    private String sku;

    /**
     * Compare at price (original price before discount) - in kobo
     * Shows "Was ₦50,000, Now ₦40,000"
     */
    @Column
    private Long compareAtPrice;

    /**
     * Cost price (what seller paid) - in kobo
     * Used for profit calculation
     */
    @Column
    private Long costPrice;

    /**
     * Is this product taxable?
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isTaxable = true;

    /**
     * Does this product have variants (size, color, etc.)?
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean hasVariants = false;

    /**
     * Is this a digital product? (eBook, software, course, etc.)
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isDigital = false;

    /**
     * Download URL for digital products
     */
    @Column(length = 500)
    private String downloadUrl;

    /**
     * Download limit for digital products (null = unlimited)
     */
    @Column
    private Integer downloadLimit;

    /**
     * Track inventory?
     * If false, product has unlimited stock
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean trackInventory = true;

    /**
     * Low stock threshold - alert seller when stock falls below this
     */
    @Column
    @Builder.Default
    private Integer lowStockThreshold = 5;

    /**
     * Allow backorders? (can sell even when out of stock)
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean allowBackorders = false;

    /**
     * Product weight in grams (for shipping calculation)
     */
    @Column
    private Integer weightInGrams;

    /**
     * Product dimensions - length in cm
     */
    @Column
    private Integer lengthInCm;

    /**
     * Product dimensions - width in cm
     */
    @Column
    private Integer widthInCm;

    /**
     * Product dimensions - height in cm
     */
    @Column
    private Integer heightInCm;

    /**
     * Is this product featured? (shows on homepage/top of category)
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isFeatured = false;

    /**
     * SEO meta title
     */
    @Column(length = 200)
    private String metaTitle;

    /**
     * SEO meta description
     */
    @Column(length = 500)
    private String metaDescription;

    /**
     * Vendor/brand name
     */
    @Column(length = 100)
    private String vendor;

    /**
     * Product type (for filtering/organization)
     * Example: "T-Shirt", "Laptop", "Novel"
     */
    @Column(length = 100)
    private String productType;

    // ============================================
    // RELATIONSHIPS
    // ============================================

    /**
     * Product variants (sizes, colors, etc.)
     */
    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    private List<ProductVariant> variants = new ArrayList<>();

    /**
     * Product images
     */
    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    private List<ProductImage> images = new ArrayList<>();

    /**
     * Collections this product belongs to
     */
    @ManyToMany(mappedBy = "items")
    @Builder.Default
    @ToString.Exclude
    private List<Collection> collections = new ArrayList<>();

    /**
     * Tags for this product
     */
    @ManyToMany
    @JoinTable(
            name = "item_tags",
            joinColumns = @JoinColumn(name = "item_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    @ToString.Exclude
    private List<ProductTag> tags = new ArrayList<>();

    /**
     * Shipping profile for this product
     * If null, uses seller's default shipping profile
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipping_profile_id")
    @JsonIgnore
    @ToString.Exclude
    private ShippingProfile shippingProfile;

    // ============================================
    // ENUMS (KEEP EXISTING)
    // ============================================

    public enum Category {
        BOOKS,
        CLOTHING,
        ELECTRONICS,
        FOOD,
        LIGHT,
        TRANSPORTATION
    }

    public enum Condition {
        NEW,
        LIKE_NEW,
        USED,
        REFURBISHED
    }

    public enum Status {
        ACTIVE,
        SOLD,
        HIDDEN,
        OUT_OF_STOCK,
        DRAFT
    }

    // ============================================
    // EXISTING UTILITY METHODS (KEEP AS-IS)
    // ============================================

    public void incrementViewCount() {
        this.viewCount++;
    }

    public void incrementLikeCount() {
        this.likeCount++;
    }

    public void decrementLikeCount() {
        if (this.likeCount > 0) {
            this.likeCount--;
        }
    }

    // ============================================
    // NEW UTILITY METHODS
    // ============================================

    /**
     * Add a variant to this product
     */
    public void addVariant(ProductVariant variant) {
        variants.add(variant);
        variant.setItem(this);
        this.hasVariants = true;
    }

    /**
     * Remove a variant from this product
     */
    public void removeVariant(ProductVariant variant) {
        variants.remove(variant);
        variant.setItem(null);
        if (variants.isEmpty()) {
            this.hasVariants = false;
        }
    }

    /**
     * Add an image to this product
     */
    public void addImage(ProductImage image) {
        images.add(image);
        image.setItem(this);
    }

    /**
     * Remove an image from this product
     */
    public void removeImage(ProductImage image) {
        images.remove(image);
        image.setItem(null);
    }

    /**
     * Get primary image
     */
    public ProductImage getPrimaryImage() {
        return images.stream()
                .filter(ProductImage::getIsPrimary)
                .findFirst()
                .orElse(images.isEmpty() ? null : images.get(0));
    }

    /**
     * Add a tag to this product
     */
    public void addTag(ProductTag tag) {
        if (!tags.contains(tag)) {
            tags.add(tag);
            tag.incrementUsageCount();
        }
    }

    /**
     * Remove a tag from this product
     */
    public void removeTag(ProductTag tag) {
        if (tags.remove(tag)) {
            tag.decrementUsageCount();
        }
    }

    /**
     * Check if product is in stock
     */
    public boolean isInStock() {
        if (hasVariants) {
            // If has variants, check if any variant is in stock
            return variants.stream().anyMatch(ProductVariant::isInStock);
        }

        if (!trackInventory) {
            return true; // Unlimited stock
        }

        return quantity > 0 || allowBackorders;
    }

    /**
     * Check if product stock is low
     */
    public boolean isLowStock() {
        if (hasVariants) {
            return variants.stream().anyMatch(ProductVariant::isLowStock);
        }

        if (!trackInventory) {
            return false;
        }

        return quantity <= lowStockThreshold && quantity > 0;
    }

    /**
     * Get total stock across all variants
     */
    public Integer getTotalStock() {
        if (hasVariants) {
            return variants.stream()
                    .filter(ProductVariant::getTrackInventory)
                    .mapToInt(ProductVariant::getStock)
                    .sum(); // ← This should work
        }
        return quantity;
    }

    /**
     * Calculate profit margin
     */
    public Long getProfitMargin() {
        if (costPrice == null) return null;
        return price - costPrice;
    }

    /**
     * Calculate profit percentage
     */
    public Double getProfitPercentage() {
        if (costPrice == null || costPrice == 0) return null;
        Long margin = getProfitMargin();
        if (margin == null) return null;
        return (margin.doubleValue() / costPrice) * 100;
    }

    /**
     * Generate slug from title
     */
    public static String generateSlug(String title, Long itemId) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Title cannot be empty");
        }

        String baseSlug = title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");

        // Add item ID to ensure uniqueness
        return itemId != null ? baseSlug + "-" + itemId : baseSlug;
    }

    /**
     * Generate SKU
     */
    public static String generateSKU(Category category, Long itemId) {
        String categoryCode = category.name().substring(0, Math.min(4, category.name().length()));
        return categoryCode.toUpperCase() + "-" + String.format("%06d", itemId);
    }
}