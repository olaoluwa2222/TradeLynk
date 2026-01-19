package com.codewithola.tradelynkapi.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for collection with full details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectionDTO {

    private Long id;
    private Long sellerId;
    private String sellerName;
    private String name;
    private String slug;
    private String description;
    private String imageUrl;
    private Boolean isActive;
    private Boolean isFeatured;
    private Integer displayOrder;
    private String metaTitle;
    private String metaDescription;

    /**
     * List of items in this collection
     */
    private List<ItemDTO> items;

    /**
     * Total number of items in collection
     */
    private Integer itemCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}