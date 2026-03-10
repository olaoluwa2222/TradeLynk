package com.codewithola.tradelynkapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Order entity — direct payment flow.
 * Payment goes directly to seller; no escrow/hold period.
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
    private OrderStatus status = OrderStatus.PAID;

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

    // Order Status — Direct Payment Flow (no escrow)
    public enum OrderStatus {
        PAID,           // Payment successful, seller receives funds directly
        SHIPPED,        // Seller marked as shipped
        DELIVERED,      // Buyer confirmed delivery
        COMPLETED,      // Order fully completed
        DISPUTED,       // Buyer raised a dispute
        REFUNDED,       // Money refunded to buyer
        CANCELLED       // Order cancelled
    }

    // State transition methods
    public void markAsShipped() {
        if (this.status != OrderStatus.PAID) {
            throw new IllegalStateException("Can only mark PAID orders as shipped");
        }
        this.status = OrderStatus.SHIPPED;
        this.shippedAt = LocalDateTime.now();
    }

    /**
     * @deprecated Buyer confirmation is no longer required. Use markAsCompleted() instead.
     * Kept for backwards compatibility with admin dispute resolution.
     */
    @Deprecated
    public void markAsDelivered() {
        // Treat as COMPLETED directly — no buyer confirmation step
        this.status = OrderStatus.COMPLETED;
        this.deliveredAt = LocalDateTime.now();
        this.completedAt = LocalDateTime.now();
    }

    public void markAsCompleted() {
        if (this.status == OrderStatus.COMPLETED) {
            return; // already completed — idempotent
        }
        if (this.status == OrderStatus.CANCELLED || this.status == OrderStatus.REFUNDED) {
            throw new IllegalStateException("Cannot complete a cancelled or refunded order");
        }
        this.status = OrderStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
    }

    public void markAsDisputed() {
        if (this.status != OrderStatus.SHIPPED && this.status != OrderStatus.PAID) {
            throw new IllegalStateException("Can only dispute PAID or SHIPPED orders");
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

    /**
     * Auto-complete: mark as COMPLETED directly (no DELIVERED step required).
     * Triggered by the scheduled job after 5-7 days in SHIPPED status.
     */
    public void autoComplete() {
        if (this.status != OrderStatus.SHIPPED && this.status != OrderStatus.PAID) {
            throw new IllegalStateException("Can only auto-complete SHIPPED or PAID orders");
        }
        this.status = OrderStatus.COMPLETED;
        this.autoCompletedAt = LocalDateTime.now();
        this.completedAt = LocalDateTime.now();
    }

    // State check methods
    public boolean isPaid() { return this.status == OrderStatus.PAID; }
    public boolean isShipped() { return this.status == OrderStatus.SHIPPED; }
    /** @deprecated No longer a separate step — mapped to COMPLETED */
    @Deprecated public boolean isDelivered() { return this.status == OrderStatus.DELIVERED || this.status == OrderStatus.COMPLETED; }
    public boolean isCompleted() { return this.status == OrderStatus.COMPLETED; }
    public boolean isDisputed() { return this.status == OrderStatus.DISPUTED; }
    public boolean isRefunded() { return this.status == OrderStatus.REFUNDED; }
    public boolean isCancelled() { return this.status == OrderStatus.CANCELLED; }

    // Permission checks
    public boolean canBeShipped() { return this.status == OrderStatus.PAID; }
    /** @deprecated Buyer confirmation is no longer required */
    @Deprecated public boolean canBeMarkedAsDelivered() { return this.status == OrderStatus.SHIPPED || this.status == OrderStatus.PAID; }
    public boolean canBeDisputed() { return this.status == OrderStatus.PAID || this.status == OrderStatus.SHIPPED; }
    public boolean canBeCancelled() { return this.status == OrderStatus.PAID || this.status == OrderStatus.SHIPPED; }
    /** Transfer is allowed from SHIPPED or PAID states (no DELIVERED step) */
    public boolean canBeCompleted() { return this.status == OrderStatus.SHIPPED || this.status == OrderStatus.PAID || this.status == OrderStatus.DELIVERED; }
    public boolean canBeRefunded() { return this.status == OrderStatus.DISPUTED || this.status == OrderStatus.PAID || this.status == OrderStatus.SHIPPED; }
    public boolean isFinalState() { return this.status == OrderStatus.COMPLETED || this.status == OrderStatus.REFUNDED || this.status == OrderStatus.CANCELLED; }
}