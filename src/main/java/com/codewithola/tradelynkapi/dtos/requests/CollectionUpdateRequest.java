package com.codewithola.tradelynkapi.dtos.requests;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for updating a collection
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectionUpdateRequest {

    @Size(max = 100, message = "Collection name must not exceed 100 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    private String imageUrl;

    private Boolean isActive;

    private Boolean isFeatured;

    private Integer displayOrder;

    private String metaTitle;

    private String metaDescription;

    /**
     * Replace all items in collection with these item IDs
     * If null, items won't be modified
     */
    private List<Long> itemIds;
}