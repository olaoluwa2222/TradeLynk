package com.codewithola.tradelynkapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Transfer entity for tracking payouts to sellers
 * Records all Paystack transfer transactions
 */
@Entity
@Table(name = "transfers", indexes = {
        @Index(name = "idx_transfer_seller_id", columnList = "seller_id"),
        @Index(name = "idx_transfer_order_id", columnList = "order_id"),
        @Index(name = "idx_transfer_status", columnList = "status"),
        @Index(name = "idx_transfer_paystack_code", columnList = "paystack_transfer_code"),
        @Index(name = "idx_transfer_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Transfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ Relationships
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // ✅ Transfer details
    @Column(nullable = false)
    private Long amount; // Amount transferred in kobo (after platform fee)

    @Column(name = "original_amount", nullable = false)
    private Long originalAmount; // Original order amount before fees

    @Column(name = "platform_fee", nullable = false)
    private Long platformFee; // Platform commission (3%)

    @Column(name = "paystack_transfer_code", unique = true, length = 100)
    private String paystackTransferCode; // Paystack's transfer reference

    @Column(name = "paystack_recipient_code", length = 100)
    private String paystackRecipientCode; // Paystack recipient code

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TransferStatus status = TransferStatus.PENDING;

    @Column(length = 500)
    private String failureReason; // Reason if transfer failed

    // ✅ Timestamps
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    // ✅ Enum
    public enum TransferStatus {
        PENDING,    // Transfer initiated but not yet processed
        SUCCESS,    // Transfer successful
        FAILED,     // Transfer failed
        REVERSED    // Transfer reversed (rare)
    }

    // ✅ Utility methods
    public void markAsSuccess(String transferCode) {
        this.status = TransferStatus.SUCCESS;
        this.paystackTransferCode = transferCode;
        this.completedAt = LocalDateTime.now();
    }

    public void markAsFailed(String reason) {
        this.status = TransferStatus.FAILED;
        this.failureReason = reason;
    }

    public void markAsReversed() {
        this.status = TransferStatus.REVERSED;
    }

    public boolean isPending() {
        return this.status == TransferStatus.PENDING;
    }

    public boolean isSuccessful() {
        return this.status == TransferStatus.SUCCESS;
    }

    public boolean hasFailed() {
        return this.status == TransferStatus.FAILED;
    }

    /**
     * Calculate platform fee (3% of order amount)
     */
    public static Long calculatePlatformFee(Long amount) {
        return (long) (amount * 0.03);
    }

    /**
     * Calculate seller payout (order amount - platform fee)
     */
    public static Long calculateSellerPayout(Long amount) {
        return amount - calculatePlatformFee(amount);
    }
}