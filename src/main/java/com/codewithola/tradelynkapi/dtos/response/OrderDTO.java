package com.codewithola.tradelynkapi.dtos.response;

import com.codewithola.tradelynkapi.entity.Order;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for Order details
 * Contains full order information with nested item, buyer, seller details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {

    private Long id;
    private Long amount; // Amount in kobo
    private String deliveryAddress;
    private String status;
    private String cancellationReason;
    private LocalDateTime createdAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime autoCompletedAt;

    // ✅ Nested Item details
    @JsonProperty("item")
    private ItemSummary item;

    // ✅ Nested Buyer details
    @JsonProperty("buyer")
    private UserSummary buyer;

    // ✅ Nested Seller details
    @JsonProperty("seller")
    private UserSummary seller;

    // ✅ Nested Payment details
    @JsonProperty("payment")
    private PaymentSummary payment;

    /**
     * Item summary (avoid returning full item object)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemSummary {
        private Long id;
        private String title;
        private String description;
        private Long price;
        private String category;
        private String condition;
        private String imageUrls;
    }

    /**
     * User summary (avoid returning sensitive user data)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
        private String profilePictureUrl;
    }

    /**
     * Payment summary
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentSummary {
        private Long id;
        private String paystackReference;
        private String status;
        private LocalDateTime paidAt;
    }

    /**
     * Factory method to convert Order entity to OrderDTO
     */
    public static OrderDTO fromEntity(Order order) {
        return OrderDTO.builder()
                .id(order.getId())
                .amount(order.getAmount())
                .deliveryAddress(order.getDeliveryAddress())
                .status(order.getStatus().name())
                .cancellationReason(order.getCancellationReason())
                .createdAt(order.getCreatedAt())
                .deliveredAt(order.getDeliveredAt())
                .autoCompletedAt(order.getAutoCompletedAt())
                .item(ItemSummary.builder()
                        .id(order.getItem().getId())
                        .title(order.getItem().getTitle())
                        .description(order.getItem().getDescription())
                        .price(order.getItem().getPrice())
                        .category(order.getItem().getCategory().name())
                        .condition(order.getItem().getCondition().name())
                        .imageUrls(order.getItem().getImageUrls())
                        .build())
                .buyer(UserSummary.builder()
                        .id(order.getBuyer().getId())
                        .name(order.getBuyer().getName())
                        .email(order.getBuyer().getEmail())
                        .profilePictureUrl(order.getBuyer().getProfilePictureUrl())
                        .build())
                .seller(UserSummary.builder()
                        .id(order.getSeller().getId())
                        .name(order.getSeller().getName())
                        .email(order.getSeller().getEmail())
                        .profilePictureUrl(order.getSeller().getProfilePictureUrl())
                        .build())
                .payment(PaymentSummary.builder()
                        .id(order.getPayment().getId())
                        .paystackReference(order.getPayment().getPaystackReference())
                        .status(order.getPayment().getStatus().name())
                        .paidAt(order.getPayment().getPaidAt())
                        .build())
                .build();
    }
}