package com.codewithola.tradelynkapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments", indexes = {
        @Index(name = "idx_paystack_reference", columnList = "paystackReference", unique = true),
        @Index(name = "idx_buyer_id", columnList = "buyerId"),
        @Index(name = "idx_seller_id", columnList = "sellerId")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long itemId;

    /**
     * ✅ NEW: Product variant ID (null for simple products)
     */
    @Column
    private Long variantId;

    @Column(nullable = false)
    private Long sellerId;

    @Column(nullable = false)
    private Long buyerId;

    @Column(nullable = false)
    private Long amount; // Amount in Naira (not kobo)

    @Column(nullable = false, unique = true, length = 100)
    private String paystackReference;

    @Column(length = 100)
    private String paystackAccessCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(length = 500)
    private String authorizationUrl;

    @Column(columnDefinition = "TEXT")
    private String metadata; // Store additional payment data as JSON

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column
    private LocalDateTime paidAt;

    public enum PaymentStatus {
        PENDING,
        SUCCESS,
        FAILED,
        CANCELLED
    }

    public void markAsSuccess() {
        this.status = PaymentStatus.SUCCESS;
        this.paidAt = LocalDateTime.now();
    }

    public void markAsFailed() {
        this.status = PaymentStatus.FAILED;
    }
}