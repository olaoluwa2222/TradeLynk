package com.codewithola.tradelynkapi.dtos.requests;

import com.codewithola.tradelynkapi.entity.Item;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import com.codewithola.tradelynkapi.entity.Item.Condition;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemCreateRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 100, message = "Title must not exceed 100 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotNull(message = "Price is required")
    @Min(value = 1, message = "Price must be greater than 0")
    private Long price; // in kobo

    @NotNull(message = "Category is required")
    private Item.Category category;

    @NotNull(message = "Condition is required")
    private Condition condition;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private LocalDate expiryDate; // Required for FOOD category

    private List<String> imageUrls; // Cloudinary URLs
}