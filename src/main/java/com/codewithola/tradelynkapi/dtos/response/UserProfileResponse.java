package com.codewithola.tradelynkapi.dtos.response;

import com.codewithola.tradelynkapi.entity.User;
import lombok.Data;

/**
 * User Profile Response DTO
 */
@Data
public class UserProfileResponse {
    private Long id;
    private String email;
    private String name;
    private String role;
    private String profilePictureUrl;
    private Boolean isActive;
    private Boolean isEmailVerified;
    private String createdAt;

    public static UserProfileResponse fromUser(User user) {
        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setRole(user.getRole().name());
        response.setProfilePictureUrl(user.getProfilePictureUrl());
        response.setIsActive(user.getIsActive());
        response.setIsEmailVerified(user.getIsEmailVerified());
        response.setCreatedAt(user.getCreatedAt().toString());
        return response;
    }
}