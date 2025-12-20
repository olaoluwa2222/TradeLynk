package com.codewithola.tradelynkapi.dtos.response;

import com.codewithola.tradelynkapi.entity.Transfer;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for Transfer details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferDTO {

    private Long id;
    private Long amount; // Amount transferred (after platform fee)
    private Long originalAmount; // Original order amount
    private Long platformFee; // Platform commission
    private String paystackTransferCode;
    private String status;
    private String failureReason;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;

    // ✅ Nested Seller summary
    @JsonProperty("seller")
    private SellerSummary seller;

    // ✅ Nested Order summary
    @JsonProperty("order")
    private OrderSummary order;

    /**
     * Seller summary
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SellerSummary {
        private Long id;
        private String name;
        private String email;
    }

    /**
     * Order summary
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderSummary {
        private Long id;
        private String itemTitle;
        private Long amount;
        private String status;
    }

    /**
     * Factory method to convert Transfer entity to TransferDTO
     */
    public static TransferDTO fromEntity(Transfer transfer) {
        return TransferDTO.builder()
                .id(transfer.getId())
                .amount(transfer.getAmount())
                .originalAmount(transfer.getOriginalAmount())
                .platformFee(transfer.getPlatformFee())
                .paystackTransferCode(transfer.getPaystackTransferCode())
                .status(transfer.getStatus().name())
                .failureReason(transfer.getFailureReason())
                .createdAt(transfer.getCreatedAt())
                .completedAt(transfer.getCompletedAt())
                .seller(SellerSummary.builder()
                        .id(transfer.getSeller().getId())
                        .name(transfer.getSeller().getName())
                        .email(transfer.getSeller().getEmail())
                        .build())
                .order(OrderSummary.builder()
                        .id(transfer.getOrder().getId())
                        .itemTitle(transfer.getOrder().getItem().getTitle())
                        .amount(transfer.getOrder().getAmount())
                        .status(transfer.getOrder().getStatus().name())
                        .build())
                .build();
    }
}