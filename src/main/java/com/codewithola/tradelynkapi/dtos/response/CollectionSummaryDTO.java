package com.codewithola.tradelynkapi.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Summary DTO for collection (used in item listings)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectionSummaryDTO {
    private Long id;
    private String name;
    private String slug;
    private Boolean isFeatured;
}