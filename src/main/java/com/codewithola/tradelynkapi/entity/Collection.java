package com.codewithola.tradelynkapi.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Collection Entity - Custom product collections/groups created by sellers
 * Examples:
 * - "Winter Sale"
 * - "Featured Products"
 * - "New Arrivals"
 * - "Best Sellers"
 * - "Back to School"
 */
@Entity
@Table(name = "collections", indexes = {
        @Index(name = "idx_seller_id", columnList = "seller_id"),
        @Index(name = "idx_slug", columnList = "slug", unique = true),
        @Index(name = "idx_is_active", columnList = "is_active"),
        @Index(name = "idx_is_featured", columnList = "is_featured")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Collection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Seller who owns this collection
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private User seller;

    /**
     * Collection name
     * Example: "Winter Sale", "New Arrivals"
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * URL-friendly slug
     * Example: "winter-sale", "new-arrivals"
     */
    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    /**
     * Description of the collection
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Collection image/banner URL
     */
    @Column(length = 500)
    private String imageUrl;

    /**
     * Is this collection currently active/visible?
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Is this a featured collection? (shows on homepage/storefront)
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isFeatured = false;

    /**
     * Display order (lower numbers appear first)
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    /**
     * Items in this collection
     * ManyToMany relationship - items can belong to multiple collections
     */
    @ManyToMany
    @JoinTable(
            name = "collection_items",
            joinColumns = @JoinColumn(name = "collection_id"),
            inverseJoinColumns = @JoinColumn(name = "item_id")
    )
    @Builder.Default
    @ToString.Exclude
    private List<Item> items = new ArrayList<>();

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
     * Add item to collection
     */
    public void addItem(Item item) {
        if (!this.items.contains(item)) {
            this.items.add(item);
        }
    }

    /**
     * Remove item from collection
     */
    public void removeItem(Item item) {
        this.items.remove(item);
    }

    /**
     * Get total number of items in collection
     */
    public int getItemCount() {
        return items != null ? items.size() : 0;
    }

    /**
     * Get number of active items in collection
     */
    public int getActiveItemCount() {
        if (items == null) return 0;
        return (int) items.stream()
                .filter(item -> item.getStatus() == Item.Status.ACTIVE)
                .count();
    }

    /**
     * Generate slug from name
     */
    public static String generateSlug(String name, Long sellerId) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Collection name cannot be empty");
        }

        String baseSlug = name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");

        // Add seller ID to ensure uniqueness across sellers
        return sellerId + "-" + baseSlug;
    }
}