package com.codewithola.tradelynkapi.dtos.response;

import com.codewithola.tradelynkapi.entity.Item;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemDTO {

    private Long id;
    private Long sellerId;
    private String sellerName;
    private String sellerEmail;
    private String title;
    private String description;
    private Long price;
    private Item.Category category;
    private Item.Condition condition;
    private Integer quantity;
    private LocalDate expiryDate;
    private List<String> imageUrls;
    private Integer likeCount;
    private Integer viewCount;
    private Item.Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}