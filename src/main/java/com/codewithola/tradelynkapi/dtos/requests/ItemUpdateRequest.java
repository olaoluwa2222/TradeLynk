package com.codewithola.tradelynkapi.dtos.requests;

import com.codewithola.tradelynkapi.entity.Item;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemUpdateRequest {

    @Size(max = 100, message = "Title must not exceed 100 characters")
    private String title;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @Min(value = 1, message = "Price must be greater than 0")
    private Long price;

    private Item.Category category;

    private Item.Condition condition;

    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private LocalDate expiryDate;

    private List<String> imageUrls;

    private Item.Status status; // Allow seller to mark as SOLD or HIDDEN
}