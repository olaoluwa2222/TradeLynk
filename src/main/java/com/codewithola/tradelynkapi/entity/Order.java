package com.codewithola.tradelynkapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * UPDATED Order entity with escrow payment flow
 * Now tracks payment hold, shipping, disputes, and completion states
 */
@Entity
@Table(name = "orders", indexes = {
        @Index(name = "idx_buyer_id", columnList = "buyer_id"),
        @Index(name = "idx_seller_id", columnList = "seller_id"),
        @Index(name = "idx_status", columnList = "status"),
        @Index(name = "idx_created_at", columnList = "created_at"),
        @Index(name = "idx_status_created_at", columnList = "status,created_at")
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
    private Long amount; // Final paid amount in Naira

    @Column(nullable = false, length = 500)
    private String deliveryAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.PAYMENT_HELD;

    @Column(length = 1000)
    private String cancellationReason;

    // ✅ Timestamps
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "shipped_at")
    private LocalDateTime shippedAt; // When seller marked as shipped

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt; // When buyer confirmed delivery

    @Column(name = "completed_at")
    private LocalDateTime completedAt; // When seller was paid

    @Column(name = "auto_completed_at")
    private LocalDateTime autoCompletedAt; // When system auto-completed

    @Column(name = "disputed_at")
    private LocalDateTime disputedAt; // When dispute was raised

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt; // When refund was issued

    // ✅ UPDATED Enum for Order Status (Escrow Flow)
    public enum OrderStatus {
        PAYMENT_HELD,       // Payment successful, money in escrow
        SHIPPED,            // Seller marked as shipped
        DELIVERED,          // Buyer confirmed delivery
        COMPLETED,          // Seller paid out
        DISPUTED,           // Buyer raised a dispute
        REFUNDED,           // Money refunded to buyer
        CANCELLED           // Order cancelled
    }

    // ✅ State transition methods
    public void markAsShipped() {
        if (this.status != OrderStatus.PAYMENT_HELD) {
            throw new IllegalStateException("Can only mark PAYMENT_HELD orders as shipped");
        }
        this.status = OrderStatus.SHIPPED;
        this.shippedAt = LocalDateTime.now();
    }

    public void markAsDelivered() {
        if (this.status != OrderStatus.SHIPPED && this.status != OrderStatus.PAYMENT_HELD) {
            throw new IllegalStateException("Can only mark SHIPPED orders as delivered");
        }
        this.status = OrderStatus.DELIVERED;
        this.deliveredAt = LocalDateTime.now();
    }

    public void markAsCompleted() {
        if (this.status != OrderStatus.DELIVERED) {
            throw new IllegalStateException("Can only complete DELIVERED orders");
        }
        this.status = OrderStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
    }

    public void markAsDisputed() {
        if (this.status != OrderStatus.SHIPPED && this.status != OrderStatus.PAYMENT_HELD) {
            throw new IllegalStateException("Can only dispute PAYMENT_HELD or SHIPPED orders");
        }
        this.status = OrderStatus.DISPUTED;
        this.disputedAt = LocalDateTime.now();
    }

    public void markAsRefunded() {
        this.status = OrderStatus.REFUNDED;
        this.refundedAt = LocalDateTime.now();
    }

    public void cancel(String reason) {
        if (this.status == OrderStatus.COMPLETED || this.status == OrderStatus.REFUNDED) {
            throw new IllegalStateException("Cannot cancel completed or refunded orders");
        }
        this.status = OrderStatus.CANCELLED;
        this.cancellationReason = reason;
    }

    public void autoComplete() {
        if (this.status != OrderStatus.SHIPPED && this.status != OrderStatus.PAYMENT_HELD) {
            throw new IllegalStateException("Can only auto-complete SHIPPED or PAYMENT_HELD orders");
        }
        this.status = OrderStatus.DELIVERED;
        this.autoCompletedAt = LocalDateTime.now();
        this.deliveredAt = LocalDateTime.now();
    }

    // ✅ State check methods
    public boolean isPaymentHeld() {
        return this.status == OrderStatus.PAYMENT_HELD;
    }

    public boolean isShipped() {
        return this.status == OrderStatus.SHIPPED;
    }

    public boolean isDelivered() {
        return this.status == OrderStatus.DELIVERED;
    }

    public boolean isCompleted() {
        return this.status == OrderStatus.COMPLETED;
    }

    public boolean isDisputed() {
        return this.status == OrderStatus.DISPUTED;
    }

    public boolean isRefunded() {
        return this.status == OrderStatus.REFUNDED;
    }

    public boolean isCancelled() {
        return this.status == OrderStatus.CANCELLED;
    }

    // ✅ Permission checks
    public boolean canBeShipped() {
        return this.status == OrderStatus.PAYMENT_HELD;
    }

    public boolean canBeMarkedAsDelivered() {
        return this.status == OrderStatus.SHIPPED || this.status == OrderStatus.PAYMENT_HELD;
    }

    public boolean canBeDisputed() {
        return this.status == OrderStatus.PAYMENT_HELD ||
                this.status == OrderStatus.SHIPPED;
    }

    public boolean canBeCancelled() {
        return this.status == OrderStatus.PAYMENT_HELD ||
                this.status == OrderStatus.SHIPPED;
    }

    public boolean canBeCompleted() {
        return this.status == OrderStatus.DELIVERED;
    }

    public boolean canBeRefunded() {
        return this.status == OrderStatus.DISPUTED ||
                this.status == OrderStatus.PAYMENT_HELD ||
                this.status == OrderStatus.SHIPPED;
    }

    // ✅ Check if order is in final state (no further actions possible)
    public boolean isFinalState() {
        return this.status == OrderStatus.COMPLETED ||
                this.status == OrderStatus.REFUNDED ||
                this.status == OrderStatus.CANCELLED;
    }

    // ✅ Check if money should still be in escrow
    public boolean isMoneyInEscrow() {
        return this.status == OrderStatus.PAYMENT_HELD ||
                this.status == OrderStatus.SHIPPED ||
                this.status == OrderStatus.DELIVERED ||
                this.status == OrderStatus.DISPUTED;
    }
}