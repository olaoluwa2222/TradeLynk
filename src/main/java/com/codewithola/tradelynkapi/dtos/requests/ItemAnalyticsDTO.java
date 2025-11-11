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
public class ItemAnalyticsDTO {

    private Long itemId;
    private String itemTitle;
    private String itemStatus;

    // Engagement Metrics
    private Integer likeCount;
    private Integer viewCount;
    private Integer chatCount; // Unique chat initiations
    private Integer interestedBuyers; // Unique buyers who initiated chat

    // Performance Metrics
    private Double engagementRate; // (likes + chats) / views
    private Long reportCount; // Number of reports

    // Sales Metrics
    private Boolean isSold;
    private Long soldPrice; // In kobo
    private LocalDateTime soldAt;

    // Timeline
    private LocalDateTime createdAt;
    private Integer daysActive;
}
