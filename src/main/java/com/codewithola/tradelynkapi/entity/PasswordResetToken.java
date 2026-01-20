package com.codewithola.tradelynkapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Password Reset Token Entity
 * Stores temporary tokens for password reset requests
 * Tokens expire after 1 hour for security
 */
@Entity
@Table(name = "password_reset_tokens", indexes = {
        @Index(name = "idx_token", columnList = "token", unique = true),
        @Index(name = "idx_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Unique reset token (UUID)
     */
    @Column(unique = true, nullable = false, length = 255)
    private String token;

    /**
     * User who requested password reset
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Token expiry time (1 hour from creation)
     */
    @Column(nullable = false)
    private LocalDateTime expiryDate;

    /**
     * When the token was created
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Whether the token has been used (prevents reuse)
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isUsed = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    /**
     * Check if token is expired
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiryDate);
    }

    /**
     * Check if token is valid (not expired and not used)
     */
    public boolean isValid() {
        return !isExpired() && !isUsed;
    }
}