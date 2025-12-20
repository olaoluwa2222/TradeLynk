package com.codewithola.tradelynkapi.dtos.response;

import com.codewithola.tradelynkapi.entity.Dispute;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for Dispute details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisputeDTO {

    private Long id;
    private String reason;
    private String reasonDisplayName;
    private String description;
    private String status;
    private String resolution;
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    // ✅ Nested Order summary
    @JsonProperty("order")
    private OrderSummary order;

    // ✅ Nested User summaries
    @JsonProperty("raisedBy")
    private UserSummary raisedBy;

    @JsonProperty("resolvedBy")
    private UserSummary resolvedBy;

    /**
     * Order summary for dispute
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderSummary {
        private Long id;
        private Long amount;
        private String deliveryAddress;
        private String status;
        private String itemTitle;
        private Long sellerId;
        private String sellerName;
    }

    /**
     * User summary
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
    }

    /**
     * Factory method to convert Dispute entity to DisputeDTO
     */
    public static DisputeDTO fromEntity(Dispute dispute) {
        return DisputeDTO.builder()
                .id(dispute.getId())
                .reason(dispute.getReason().name())
                .reasonDisplayName(dispute.getReason().getDisplayName())
                .description(dispute.getDescription())
                .status(dispute.getStatus().name())
                .resolution(dispute.getResolution() != null ? dispute.getResolution().name() : null)
                .adminNotes(dispute.getAdminNotes())
                .createdAt(dispute.getCreatedAt())
                .resolvedAt(dispute.getResolvedAt())
                .order(OrderSummary.builder()
                        .id(dispute.getOrder().getId())
                        .amount(dispute.getOrder().getAmount())
                        .deliveryAddress(dispute.getOrder().getDeliveryAddress())
                        .status(dispute.getOrder().getStatus().name())
                        .itemTitle(dispute.getOrder().getItem().getTitle())
                        .sellerId(dispute.getOrder().getSeller().getId())
                        .sellerName(dispute.getOrder().getSeller().getName())
                        .build())
                .raisedBy(UserSummary.builder()
                        .id(dispute.getRaisedBy().getId())
                        .name(dispute.getRaisedBy().getName())
                        .email(dispute.getRaisedBy().getEmail())
                        .build())
                .resolvedBy(dispute.getResolvedBy() != null ?
                        UserSummary.builder()
                                .id(dispute.getResolvedBy().getId())
                                .name(dispute.getResolvedBy().getName())
                                .email(dispute.getResolvedBy().getEmail())
                                .build() : null)
                .build();
    }
}