package com.codewithola.tradelynkapi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_email", columnList = "email", unique = true),
        @Index(name = "idx_username", columnList = "username", unique = true), // ✅ NEW
        @Index(name = "idx_created_at", columnList = "created_at")
})
@Getter
@Setter
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

    // ✅ NEW: Username for public storefront URL
    @Column(unique = true, length = 50)
    @Pattern(regexp = "^[a-z0-9-]{3,50}$",
            message = "Username must be 3-50 characters, lowercase letters, numbers, and hyphens only")
    private String username;

    @Column(nullable = false, length = 255)
    @NotBlank(message = "Name is required")
    private String name;

    @Column(length = 500)
    private String profilePictureUrl;

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
        // Allow all valid email formats - validation happens in UserService
        if (this.email == null || this.email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }
    }

    // ✅ NEW: Generate username from name if not provided
    public static String generateUsernameFromName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }

        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "") // Remove special chars except space and hyphen
                .replaceAll("\\s+", "-") // Replace spaces with hyphens
                .replaceAll("-+", "-") // Remove duplicate hyphens
                .replaceAll("^-|-$", ""); // Remove leading/trailing hyphens
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