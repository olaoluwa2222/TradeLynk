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
 * Stores guest buyer information for payments initiated without a TradeLynk account.
 * Used by the WhatsApp bot and any unauthenticated payment links.
 * Links 1:1 to a Payment record via paystackReference.
 */
@Entity
@Table(name = "guest_payments", indexes = {
        @Index(name = "idx_guest_reference", columnList = "paystack_reference", unique = true),
        @Index(name = "idx_guest_email", columnList = "buyer_email"),
        @Index(name = "idx_guest_seller_id", columnList = "seller_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuestPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Item/Seller info ──────────────────────────────────────────────────
    @Column(nullable = false)
    private Long itemId;

    @Column
    private Long variantId; // null for simple products

    @Column(nullable = false)
    private Long sellerId;

    // ── Guest buyer info (no User account required) ───────────────────────
    @Column(nullable = false, length = 150, name = "buyer_name")
    private String buyerName;

    @Column(nullable = false, length = 255, name = "buyer_email")
    private String buyerEmail;

    @Column(length = 30, name = "buyer_phone")
    private String buyerPhone;

    // ── Payment details ───────────────────────────────────────────────────
    @Column(nullable = false)
    private Long amount; // In Naira

    @Column(nullable = false, unique = true, length = 100, name = "paystack_reference")
    private String paystackReference;

    @Column(length = 500, name = "authorization_url")
    private String authorizationUrl;

    @Column(length = 500, name = "delivery_address")
    private String deliveryAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private GuestPaymentStatus status = GuestPaymentStatus.PENDING;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "order_created_at")
    private LocalDateTime orderCreatedAt;

    // ── Timestamps ────────────────────────────────────────────────────────
    @CreationTimestamp
    @Column(nullable = false, updatable = false, name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false, name = "updated_at")
    private LocalDateTime updatedAt;

    public enum GuestPaymentStatus {
        PENDING,   // Payment link created, not yet paid
        SUCCESS,   // Paystack confirmed payment
        FAILED,    // Payment failed
        CANCELLED  // Abandoned
    }

    public void markAsSuccess() {
        this.status = GuestPaymentStatus.SUCCESS;
        this.paidAt = LocalDateTime.now();
    }

    public void markAsFailed() {
        this.status = GuestPaymentStatus.FAILED;
    }

    public void markOrderCreated() {
        this.orderCreatedAt = LocalDateTime.now();
    }

    public boolean isPaid() {
        return this.status == GuestPaymentStatus.SUCCESS;
    }
}

