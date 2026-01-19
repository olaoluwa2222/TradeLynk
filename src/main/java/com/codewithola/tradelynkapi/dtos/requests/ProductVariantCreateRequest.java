package com.codewithola.tradelynkapi.dtos.requests;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Request DTO for creating a product variant
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantCreateRequest {

    @NotBlank(message = "Variant name is required")
    @Size(max = 100, message = "Variant name must not exceed 100 characters")
    private String variantName; // Example: "Large - Red", "256GB - Black"

    private String sku; // Optional, will be auto-generated if not provided

    @Min(value = 0, message = "Price must be 0 or greater")
    private Long price; // If null, uses base item price

    private Long compareAtPrice;

    private Long costPrice;

    @NotNull(message = "Stock is required")
    @Min(value = 0, message = "Stock must be 0 or greater")
    private Integer stock;

    private Integer lowStockThreshold; // Default: 5

    private Boolean trackInventory; // Default: true

    private Boolean allowBackorders; // Default: false

    private String imageUrl; // Variant-specific image

    private Boolean isDefault; // Default: false (first variant will be default)

    private Integer position; // Display order

    private Integer weightInGrams;

    /**
     * Variant options as key-value pairs
     * Example: {"Size": "Large", "Color": "Red"}
     */
    private Map<String, String> variantOptions;

    private Boolean isAvailable; // Default: true
}