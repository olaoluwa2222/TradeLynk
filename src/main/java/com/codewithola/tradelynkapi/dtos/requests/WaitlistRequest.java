package com.codewithola.tradelynkapi.dtos.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Waitlist Signup Request DTO
 * Validates and captures email for marketing waitlist
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaitlistRequest {

    /**
     * Email address - required and must be valid format
     * Will be normalized to lowercase and trimmed
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    private String email;

    /**
     * Source of signup - optional, defaults to "go.tradelynk.app"
     * Can be used to track different marketing campaigns
     */
    private String source;
}

