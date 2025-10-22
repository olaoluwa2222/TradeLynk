package com.codewithola.tradelynkapi.dtos.response;

import com.codewithola.tradelynkapi.entity.Item;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemSummaryDTO {

    private Long id;
    private String title;
    private Long price;
    private Item.Category category;
    private Item.Condition condition;
    private String thumbnailUrl; // First image URL
    private Integer likeCount;
    private Integer viewCount;
    private Item.Status status;
    private LocalDateTime createdAt;
}