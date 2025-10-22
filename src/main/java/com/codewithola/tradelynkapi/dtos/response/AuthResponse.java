package com.codewithola.tradelynkapi.dtos.response;


import com.codewithola.tradelynkapi.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Authentication Response DTO
 * Returned after successful registration or login
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuthResponse {

    private Long userId;
    private String email;
    private String name;
    private String role;
    private String profilePictureUrl;
    private String token;

    @Builder.Default
    private String tokenType = "Bearer";

    private Long expiresIn;
    private LocalDateTime createdAt;
    private Boolean isEmailVerified;
    private String message;

    /**
     * Factory method to map a User entity and token into a DTO
     */
    public static AuthResponse fromUser(User user, String token, Long expiresIn, String message) {
        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .profilePictureUrl(user.getProfilePictureUrl())
                .token(token)
                .tokenType("Bearer")
                .expiresIn(expiresIn)
                .createdAt(user.getCreatedAt())
                .isEmailVerified(user.getIsEmailVerified())
                .message(message)
                .build();
    }
}
