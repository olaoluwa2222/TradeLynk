package com.codewithola.tradelynkapi.dtos.requests;


import com.codewithola.tradelynkapi.entity.Item;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchFilters {

    private String keyword;

    private Item.Category category;

    @Min(value = 0, message = "Minimum price must be greater than or equal to 0")
    private Long minPrice;

    @Min(value = 0, message = "Maximum price must be greater than or equal to 0")
    private Long maxPrice;

    private Item.Condition condition;

    @Builder.Default
    private String sortBy = "RELEVANCE"; // RELEVANCE, RECENT, POPULAR, PRICE_LOW, PRICE_HIGH

    @Builder.Default
    @Min(value = 0, message = "Page must be greater than or equal to 0")
    private Integer page = 0;

    @Builder.Default
    @Min(value = 1, message = "Size must be at least 1")
    private Integer size = 10;

    // Validate price range
    public boolean isValidPriceRange() {
        if (minPrice != null && maxPrice != null) {
            return minPrice <= maxPrice;
        }
        return true;
    }
}
