package com.codewithola.tradelynkapi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    @Column(nullable = false, unique = true, length = 255)
    @Email(message = "Email should be valid")
    @NotBlank(message = "Email is required")
    private String email;

    @Column(nullable = false, length = 255)
    @NotBlank(message = "Name is required")
    private String name;

    @Column(length = 500)
    private String profilePictureUrl;

    // ❌ REMOVE THIS FIELD (we're using DeviceToken table now)
    // @Column(length = 500)
    // private String fcmToken;

    @Column(nullable = false)
    @NotBlank(message = "Password is required")
    private String passwordHash;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private UserRole role = UserRole.BUYER;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isEmailVerified = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private SellerProfile sellerProfile;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private VerificationToken verificationToken;

    // ✅ ADD THIS: Relationship with DeviceToken
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<DeviceToken> deviceTokens = new ArrayList<>();

    public enum UserRole {
        BUYER,
        SELLER,
        BOTH,
        ADMIN
    }

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