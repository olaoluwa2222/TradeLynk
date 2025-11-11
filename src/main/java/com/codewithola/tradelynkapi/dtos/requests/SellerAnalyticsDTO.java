package com.codewithola.tradelynkapi.dtos.requests;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

// ==================== SELLER ANALYTICS ====================

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerAnalyticsDTO {

    // Overview Statistics
    private Integer totalItemsPosted;
    private Integer activeItems;
    private Integer soldItems;
    private Integer hiddenItems;

    // Engagement Metrics
    private Integer totalLikes;
    private Integer totalViews;
    private Integer totalChats;

    // Sales Metrics
    private Integer totalSales;
    private Long totalRevenue; // In kobo
    private Double averageItemPrice; // In kobo
    private Double conversionRate; // Percentage of views that led to sales

    // Recent Activity
    private LocalDateTime lastItemPosted;
    private LocalDateTime lastSale;

    // Top Performing Items
    private List<TopItemDTO> topLikedItems;
    private List<TopItemDTO> topViewedItems;
    private List<TopItemDTO> topRevenueItems;
}