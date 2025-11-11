package com.codewithola.tradelynkapi.dtos.requests;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopItemDTO {

    private Long itemId;
    private String title;
    private String imageUrl;
    private Long price;
    private Integer likeCount;
    private Integer viewCount;
    private Integer chatCount;
    private Long revenue;
    private String status;
}
