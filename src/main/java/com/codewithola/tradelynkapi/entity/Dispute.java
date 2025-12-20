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
 * Dispute entity for handling order disputes
 * Tracks disputes raised by buyers when there are issues with orders
 */
@Entity
@Table(name = "disputes", indexes = {
        @Index(name = "idx_dispute_order_id", columnList = "order_id"),
        @Index(name = "idx_dispute_raised_by", columnList = "raised_by"),
        @Index(name = "idx_dispute_status", columnList = "status"),
        @Index(name = "idx_dispute_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Dispute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ Relationships
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "raised_by", nullable = false)
    private User raisedBy; // Always the buyer

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy; // Admin who resolved the dispute

    // ✅ Dispute details
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DisputeReason reason;

    @Column(nullable = false, length = 1000)
    private String description; // Buyer's detailed explanation

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DisputeStatus status = DisputeStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column
    private DisputeResolution resolution; // How dispute was resolved

    @Column(length = 1000)
    private String adminNotes; // Admin's notes about resolution

    // ✅ Timestamps
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    // ✅ Enums
    public enum DisputeReason {
        ITEM_NOT_RECEIVED("Item not received"),
        ITEM_NOT_AS_DESCRIBED("Item not as described"),
        ITEM_DAMAGED("Item damaged or defective"),
        WRONG_ITEM_SENT("Wrong item sent"),
        INCOMPLETE_ORDER("Incomplete order"),
        OTHER("Other reason");

        private final String displayName;

        DisputeReason(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public enum DisputeStatus {
        OPEN,              // Dispute just raised
        UNDER_REVIEW,      // Admin is reviewing
        RESOLVED,          // Resolved in favor of one party
        CLOSED             // Closed without resolution
    }

    public enum DisputeResolution {
        REFUND_BUYER,          // Full refund to buyer
        RELEASE_TO_SELLER,     // Payment released to seller
        PARTIAL_REFUND,        // Partial refund (future feature)
        NO_ACTION              // Closed without action
    }

    // ✅ Utility methods
    public void resolve(User admin, DisputeResolution resolution, String notes) {
        this.status = DisputeStatus.RESOLVED;
        this.resolution = resolution;
        this.resolvedBy = admin;
        this.adminNotes = notes;
        this.resolvedAt = LocalDateTime.now();
    }

    public void close(User admin, String notes) {
        this.status = DisputeStatus.CLOSED;
        this.resolution = DisputeResolution.NO_ACTION;
        this.resolvedBy = admin;
        this.adminNotes = notes;
        this.resolvedAt = LocalDateTime.now();
    }

    public void markUnderReview() {
        this.status = DisputeStatus.UNDER_REVIEW;
    }

    public boolean isOpen() {
        return this.status == DisputeStatus.OPEN;
    }

    public boolean isResolved() {
        return this.status == DisputeStatus.RESOLVED;
    }

    public boolean canBeResolved() {
        return this.status == DisputeStatus.OPEN || this.status == DisputeStatus.UNDER_REVIEW;
    }
}