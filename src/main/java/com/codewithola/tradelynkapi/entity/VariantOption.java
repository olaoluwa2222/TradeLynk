package com.codewithola.tradelynkapi.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * VariantOption Entity - Defines variant option types and their values
 *
 * Example 1 - Clothing:
 * - Option Name: "Size"
 * - Values: ["XS", "S", "M", "L", "XL", "XXL"]
 *
 * Example 2 - Electronics:
 * - Option Name: "Storage"
 * - Values: ["64GB", "128GB", "256GB", "512GB"]
 *
 * Example 3 - Books:
 * - Option Name: "Format"
 * - Values: ["Hardcover", "Paperback", "eBook"]
 *
 * This entity helps sellers define consistent variant options
 * that can be reused across multiple products
 */
@Entity
@Table(name = "variant_options", indexes = {
        @Index(name = "idx_seller_id", columnList = "seller_id"),
        @Index(name = "idx_option_name", columnList = "option_name")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariantOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Seller who owns this variant option template
     * Null means it's a system-wide template available to all sellers
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    @JsonIgnore
    @ToString.Exclude
    private User seller;

    /**
     * Option name
     * Example: "Size", "Color", "Storage", "Material", "Format"
     */
    @Column(nullable = false, length = 50)
    private String optionName;

    /**
     * Option values as comma-separated string
     * Example: "XS,S,M,L,XL,XXL"
     * Example: "Red,Blue,Green,Black,White"
     * Example: "64GB,128GB,256GB,512GB"
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String optionValues;

    /**
     * Display order (lower numbers appear first in UI)
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    /**
     * Is this a system-wide template or seller-specific?
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isSystemTemplate = false;

    /**
     * Category this option is commonly used for
     * Example: "CLOTHING", "ELECTRONICS", "BOOKS"
     */
    @Column(length = 50)
    private String category;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Get option values as a list
     */
    public List<String> getValuesList() {
        if (optionValues == null || optionValues.isBlank()) {
            return new ArrayList<>();
        }
        return List.of(optionValues.split(","));
    }

    /**
     * Set option values from a list
     */
    public void setValuesList(List<String> values) {
        if (values == null || values.isEmpty()) {
            this.optionValues = "";
        } else {
            this.optionValues = String.join(",", values);
        }
    }

    /**
     * Add a value to the option
     */
    public void addValue(String value) {
        List<String> values = new ArrayList<>(getValuesList());
        if (!values.contains(value)) {
            values.add(value);
            setValuesList(values);
        }
    }

    /**
     * Remove a value from the option
     */
    public void removeValue(String value) {
        List<String> values = new ArrayList<>(getValuesList());
        values.remove(value);
        setValuesList(values);
    }

    /**
     * Check if a value exists in this option
     */
    public boolean hasValue(String value) {
        return getValuesList().contains(value);
    }

    /**
     * Get total number of values
     */
    public int getValueCount() {
        return getValuesList().size();
    }

    // ============================================
    // PREDEFINED SYSTEM TEMPLATES
    // ============================================

    /**
     * Create system template for clothing sizes
     */
    public static VariantOption createClothingSizeTemplate() {
        return VariantOption.builder()
                .optionName("Size")
                .optionValues("XS,S,M,L,XL,XXL")
                .isSystemTemplate(true)
                .category("CLOTHING")
                .displayOrder(0)
                .build();
    }

    /**
     * Create system template for colors
     */
    public static VariantOption createColorTemplate() {
        return VariantOption.builder()
                .optionName("Color")
                .optionValues("Black,White,Red,Blue,Green,Yellow,Orange,Pink,Purple,Brown,Gray")
                .isSystemTemplate(true)
                .displayOrder(1)
                .build();
    }

    /**
     * Create system template for electronics storage
     */
    public static VariantOption createStorageTemplate() {
        return VariantOption.builder()
                .optionName("Storage")
                .optionValues("64GB,128GB,256GB,512GB,1TB")
                .isSystemTemplate(true)
                .category("ELECTRONICS")
                .displayOrder(0)
                .build();
    }

    /**
     * Create system template for book formats
     */
    public static VariantOption createBookFormatTemplate() {
        return VariantOption.builder()
                .optionName("Format")
                .optionValues("Hardcover,Paperback,eBook")
                .isSystemTemplate(true)
                .category("BOOKS")
                .displayOrder(0)
                .build();
    }

    /**
     * Create system template for food weight
     */
    public static VariantOption createFoodWeightTemplate() {
        return VariantOption.builder()
                .optionName("Weight")
                .optionValues("250g,500g,1kg,2kg,5kg")
                .isSystemTemplate(true)
                .category("FOOD")
                .displayOrder(0)
                .build();
    }
}