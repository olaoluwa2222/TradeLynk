package com.codewithola.tradelynkapi.dtos.requests;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerStatsDTO {

    private Long userId;
    private Integer totalActiveItems;
    private Integer totalSoldItems;
    private Integer totalLikes;
    private Integer totalViews;
    private LocalDateTime lastItemPosted;
}
