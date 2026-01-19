package com.codewithola.tradelynkapi.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for creating a collection
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectionCreateRequest {

    @NotBlank(message = "Collection name is required")
    @Size(max = 100, message = "Collection name must not exceed 100 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    private String imageUrl; // Collection cover image

    private Boolean isActive; // Default: true

    private Boolean isFeatured; // Default: false (show on homepage)

    private Integer displayOrder; // Default: 0 (for sorting)

    private String metaTitle; // SEO

    private String metaDescription; // SEO

    /**
     * List of item IDs to add to this collection
     * Optional - can be added later
     */
    private List<Long> itemIds;
}