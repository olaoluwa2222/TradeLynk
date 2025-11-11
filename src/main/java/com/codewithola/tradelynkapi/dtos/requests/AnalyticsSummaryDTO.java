package com.codewithola.tradelynkapi.dtos.requests;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsSummaryDTO {

    private String period; // "last_7_days", "last_30_days", "all_time"
    private Integer newItems;
    private Integer newViews;
    private Integer newLikes;
    private Integer newSales;
    private Long newRevenue;
}
