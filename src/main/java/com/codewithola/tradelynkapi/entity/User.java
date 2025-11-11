package com.codewithola.tradelynkapi.entity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * User Entity - Represents a Landmark University student/user
 * Supports roles: BUYER, SELLER, or BOTH
 */
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_email", columnList = "email", unique = true),
        @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * User's email - must be @landmark.edu.ng format
     */
    @Column(nullable = false, unique = true, length = 255)
    @Email(message = "Email should be valid")
    @NotBlank(message = "Email is required")
    private String email;

    /**
     * User's full name
     */
    @Column(nullable = false, length = 255)
    @NotBlank(message = "Name is required")
    private String name;

    /**
     * User's profile picture URL (stored on Cloudinary)
     */
    @Column(length = 500)
    private String profilePictureUrl;

    /**
     * Firebase Cloud Messaging device token
     */
    @Column(length = 500)
    private String fcmToken;

    /**
     * Hashed password using bcrypt
     */
    @Column(nullable = false)
    @NotBlank(message = "Password is required")
    private String passwordHash;

    /**
     * User role enum: BUYER, SELLER, or BOTH
     */
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private UserRole role = UserRole.BUYER;

    /**
     * Account activation status
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Email verification status
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isEmailVerified = false;

    /**
     * Timestamp when the user was created
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the user was last updated
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * One-to-One relationship with SellerProfile
     * A user can have at most one seller profile
     */
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private SellerProfile sellerProfile;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private VerificationToken verificationToken;


    /**
     * Enum for User Roles
     */
    public enum UserRole {
        BUYER,      // Can only purchase items
        SELLER,     // Can only sell items
        BOTH,   // Can both buy and sell items
        ADMIN
    }

    /**
     * Validate email format for Landmark University
     * @return true if email ends with @landmark.edu.ng
     */
    @PrePersist
    @PreUpdate
    private void validateEmail() {
        if (this.email != null && !this.email.toLowerCase().endsWith("@lmu.edu.ng")) {
            throw new IllegalArgumentException("Email must be in @lmu.edu.ng format");
        }
    }

    public String getFullName() {
        return this.name;
    }

    public boolean isSeller() {
        return this.role == UserRole.SELLER || this.role == UserRole.ADMIN;
    }

    public boolean isAdmin() {
        return this.role == UserRole.ADMIN;
    }

    public void promoteToSeller() {
        if (this.role == UserRole.BUYER) {
            this.role = UserRole.SELLER;
        }
    }

    public void promoteToAdmin() {
        this.role = UserRole.ADMIN;
    }

}
