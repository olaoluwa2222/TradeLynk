package com.codewithola.tradelynkapi.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Response DTO for product variant
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantDTO {

    private Long id;
    private Long itemId;
    private String variantName;
    private String sku;
    private Long price; // Variant-specific price (null = uses item price)
    private Long effectivePrice; // Actual price (variant price or item price)
    private Long compareAtPrice;
    private Long costPrice;
    private Integer stock;
    private Integer lowStockThreshold;
    private Boolean trackInventory;
    private Boolean allowBackorders;
    private String imageUrl;
    private Boolean isDefault;
    private Integer position;
    private Integer weightInGrams;
    private Map<String, String> variantOptions; // {"Size": "L", "Color": "Red"}
    private Boolean isAvailable;
    private Boolean isInStock;
    private Boolean isLowStock;
    private Long profitMargin;
    private Double profitPercentage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}