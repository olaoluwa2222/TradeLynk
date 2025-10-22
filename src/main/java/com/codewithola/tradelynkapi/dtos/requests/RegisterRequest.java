package com.codewithola.tradelynkapi.dtos.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Registration Request DTO
 * Validates user input for registration endpoint
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RegisterRequest {

    /**
     * User's email - must be @landmark.edu.ng format
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Pattern(regexp = ".*@lmu\\.edu\\.ng$",
            message = "Email must be a valid Landmark University email (@lmu.edu.ng)")
    private String email;

    /**
     * User's full name
     */
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 255, message = "Name must be between 2 and 255 characters")
    private String name;

    /**
     * User's password - minimum 8 characters with complexity requirements
     */
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
            message = "Password must contain at least one uppercase letter, one lowercase letter, and one number")
    private String password;
}