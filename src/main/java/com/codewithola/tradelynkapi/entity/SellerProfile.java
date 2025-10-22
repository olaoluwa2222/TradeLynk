package com.codewithola.tradelynkapi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * SellerProfile Entity - Represents seller-specific information
 * Links to User entity with a One-to-One relationship
 * Contains bank account and Paystack integration details
 */
@Entity
@Table(name = "seller_profiles", indexes = {
        @Index(name = "idx_user_id", columnList = "user_id", unique = true),
        @Index(name = "idx_verified", columnList = "verified"),
        @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SellerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Foreign key to User entity
     * One-to-One relationship: each user can have at most one seller profile
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /**
     * Seller's business name
     */
    @Column(nullable = false, length = 255)
    @NotBlank(message = "Business name is required")
    private String businessName;

    /**
     * Seller's business address
     */
    @Column(length = 500)
    private String address;

    /**
     * Bank name where seller's account is registered
     */
    @Column(nullable = false, length = 100)
    @NotBlank(message = "Bank name is required")
    private String bankName;

    /**
     * Account holder's name (must match bank records)
     */
    @Column(nullable = false, length = 255)
    @NotBlank(message = "Account name is required")
    private String accountName;

    /**
     * Bank account number for payouts
     */
    @Column(nullable = false, length = 20)
    @NotBlank(message = "Account number is required")
    private String accountNumber;

    /**
     * Paystack subaccount ID for payment settlement
     * Generated after successful verification with Paystack
     */
    @Column(length = 255)
    private String payStackSubaccountId;

    /**
     * KYC/verification status of the seller
     * true: seller has been verified and can receive payments
     * false: seller is pending verification
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean verified = false;

    /**
     * Timestamp when the seller profile was created
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Verification timestamp (when the seller was approved)
     */
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    /**
     * Pre-update validation to ensure PayStack subaccount ID is set before marking verified
     */
    @PreUpdate
    private void validateVerification() {
        if (Boolean.TRUE.equals(this.verified) && this.payStackSubaccountId == null) {
            throw new IllegalArgumentException("PayStack subaccount ID must be set before verification");
        }
    }
}
