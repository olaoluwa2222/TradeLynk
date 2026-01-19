package com.codewithola.tradelynkapi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * ProductTag Entity - Searchable tags/keywords for products
 * Examples:
 * - "vintage", "handmade", "eco-friendly"
 * - "bestseller", "trending", "new"
 * - "campus", "student", "affordable"
 *
 * Tags improve:
 * - Search discoverability
 * - Product categorization
 * - Recommendations
 */
@Entity
@Table(name = "product_tags", indexes = {
        @Index(name = "idx_name", columnList = "name", unique = true),
        @Index(name = "idx_usage_count", columnList = "usage_count")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Tag name (unique, lowercase)
     * Example: "vintage", "eco-friendly", "bestseller"
     */
    @Column(nullable = false, unique = true, length = 50)
    private String name;

    /**
     * Display name (can have capitals, spaces)
     * Example: "Eco-Friendly", "Best Seller"
     */
    @Column(length = 50)
    private String displayName;

    /**
     * Tag description
     */
    @Column(length = 200)
    private String description;

    /**
     * How many times this tag has been used
     * Helps identify popular tags
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer usageCount = 0;

    /**
     * Items tagged with this tag
     * ManyToMany relationship
     */
    @ManyToMany(mappedBy = "tags")
    @Builder.Default
    @ToString.Exclude
    private List<Item> items = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Increment usage count when tag is applied to an item
     */
    public void incrementUsageCount() {
        this.usageCount++;
    }

    /**
     * Decrement usage count when tag is removed from an item
     */
    public void decrementUsageCount() {
        if (this.usageCount > 0) {
            this.usageCount--;
        }
    }

    /**
     * Normalize tag name (lowercase, trim, replace spaces with hyphens)
     */
    public static String normalizeName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Tag name cannot be empty");
        }

        return name.toLowerCase()
                .trim()
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9-]", "")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    /**
     * Get total items using this tag
     */
    public int getItemCount() {
        return items != null ? items.size() : 0;
    }
}