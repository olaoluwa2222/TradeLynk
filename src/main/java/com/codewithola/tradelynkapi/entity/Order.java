package com.codewithola.tradelynkapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "orders", indexes = {
        @Index(name = "idx_buyer_id", columnList = "buyer_id"),
        @Index(name = "idx_seller_id", columnList = "seller_id"),
        @Index(name = "idx_status", columnList = "status"),
        @Index(name = "idx_created_at", columnList = "created_at"),
        @Index(name = "idx_status_created_at", columnList = "status,created_at") // For auto-complete query
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ Relationships with entities
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_id", nullable = false, unique = true)
    private Payment payment;

    // ✅ Order details
    @Column(nullable = false)
    private Long amount; // Final paid amount in kobo

    @Column(nullable = false, length = 500)
    private String deliveryAddress; // Campus location (e.g., "Block A, Room 205")

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING_DELIVERY;

    @Column(length = 1000)
    private String cancellationReason; // Reason for cancellation (if cancelled)

    // ✅ Timestamps
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt; // When buyer marked as delivered

    @Column(name = "auto_completed_at")
    private LocalDateTime autoCompletedAt; // When system auto-completed delivery

    // ✅ Enum for Order Status
    public enum OrderStatus {
        PENDING_DELIVERY,  // Order placed, awaiting delivery
        DELIVERED,         // Buyer confirmed delivery
        CANCELLED          // Order cancelled by buyer/seller
    }

    // ✅ Utility methods
    public void markAsDelivered() {
        this.status = OrderStatus.DELIVERED;
        this.deliveredAt = LocalDateTime.now();
    }

    public void autoComplete() {
        this.status = OrderStatus.DELIVERED;
        this.autoCompletedAt = LocalDateTime.now();
    }

    public void cancel(String reason) {
        this.status = OrderStatus.CANCELLED;
        this.cancellationReason = reason;
    }

    public boolean isPendingDelivery() {
        return this.status == OrderStatus.PENDING_DELIVERY;
    }

    public boolean isDelivered() {
        return this.status == OrderStatus.DELIVERED;
    }

    public boolean isCancelled() {
        return this.status == OrderStatus.CANCELLED;
    }

    // ✅ Check if order can be cancelled (only pending orders)
    public boolean canBeCancelled() {
        return this.status == OrderStatus.PENDING_DELIVERY;
    }

    // ✅ Check if order can be marked as delivered (only pending orders)
    public boolean canBeMarkedAsDelivered() {
        return this.status == OrderStatus.PENDING_DELIVERY;
    }
}