package com.codewithola.tradelynkapi.dtos.requests;

import lombok.Data;

/**
 * Update Profile Request DTO
 */
@Data
public class UpdateProfileRequest {
    private String name;
    private String profilePictureUrl;
}
