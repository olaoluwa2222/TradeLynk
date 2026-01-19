package com.codewithola.tradelynkapi.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * ProductVariant Entity - Represents different variations of a product
 * Examples:
 * - Clothing: Size (S, M, L, XL), Color (Red, Blue, Green)
 * - Electronics: Storage (64GB, 128GB, 256GB), Color (Black, White)
 * - Books: Format (Hardcover, Paperback, eBook)
 * - Food: Weight (500g, 1kg, 2kg)
 */
@Entity
@Table(name = "product_variants", indexes = {
        @Index(name = "idx_item_id", columnList = "item_id"),
        @Index(name = "idx_sku", columnList = "sku", unique = true),
        @Index(name = "idx_is_default", columnList = "is_default")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Parent item/product
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Item item;

    /**
     * Variant name - describes this specific variant
     * Example: "Large - Red", "256GB - Black", "Hardcover"
     */
    @Column(nullable = false, length = 100)
    private String variantName;

    /**
     * SKU (Stock Keeping Unit) - unique identifier for this variant
     * Example: "SHIRT-L-RED", "IPHONE-256-BLK"
     */
    @Column(unique = true, length = 100)
    private String sku;

    /**
     * Variant-specific price (in kobo)
     * If null, uses the base item price
     * Allows different variants to have different prices
     */
    @Column
    private Long price;

    /**
     * Compare at price (original price before discount) - in kobo
     * Used to show discounts like "Was ₦50,000, Now ₦40,000"
     */
    @Column
    private Long compareAtPrice;

    /**
     * Cost price (what seller paid) - in kobo
     * Used for profit calculation, not shown to customers
     */
    @Column
    private Long costPrice;

    /**
     * Stock/inventory for this specific variant
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 0;

    /**
     * Low stock threshold - alert seller when stock falls below this
     */
    @Column
    @Builder.Default
    private Integer lowStockThreshold = 5;

    /**
     * Whether to track inventory for this variant
     * If false, stock is unlimited (useful for digital products or services)
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean trackInventory = true;

    /**
     * Allow backorders (can sell even when out of stock)
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean allowBackorders = false;

    /**
     * Variant-specific image URL
     * Shows different image for each variant (e.g., red shirt shows red color)
     */
    @Column(length = 500)
    private String imageUrl;

    /**
     * Is this the default variant?
     * The default variant is selected by default when viewing the product
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isDefault = false;

    /**
     * Position/order for display (lower numbers appear first)
     */
    @Column
    @Builder.Default
    private Integer position = 0;

    /**
     * Weight in grams (for shipping calculation)
     */
    @Column
    private Integer weightInGrams;

    /**
     * Variant options as JSON string
     * Example: {"Size": "Large", "Color": "Red"}
     * Stored as JSON for flexibility
     */
    @Column(columnDefinition = "TEXT")
    private String variantOptions; // JSON string: {"Size": "L", "Color": "Red"}

    /**
     * Is this variant currently available for sale?
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isAvailable = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Check if variant is in stock
     */
    public boolean isInStock() {
        if (!trackInventory) {
            return true; // Unlimited stock
        }
        return stock > 0 || allowBackorders;
    }

    /**
     * Check if stock is low
     */
    public boolean isLowStock() {
        if (!trackInventory) {
            return false;
        }
        return stock <= lowStockThreshold && stock > 0;
    }

    /**
     * Decrease stock by quantity
     */
    public void decreaseStock(int quantity) {
        if (trackInventory) {
            this.stock = Math.max(0, this.stock - quantity);
        }
    }

    /**
     * Increase stock by quantity
     */
    public void increaseStock(int quantity) {
        if (trackInventory) {
            this.stock += quantity;
        }
    }

    /**
     * Get effective price (variant price or item price)
     */
    public Long getEffectivePrice() {
        return price != null ? price : (item != null ? item.getPrice() : 0L);
    }

    /**
     * Calculate profit margin
     */
    public Long getProfitMargin() {
        if (costPrice == null) return null;
        Long effectivePrice = getEffectivePrice();
        return effectivePrice - costPrice;
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
}