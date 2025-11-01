package com.codewithola.tradelynkapi.dtos.requests;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BecomeSellerRequest {

    @NotBlank(message = "Bank name is required")
    private String bankName;

    @NotBlank(message = "Account name is required")
    @Size(min = 3, max = 100, message = "Account name must be between 3 and 100 characters")
    private String accountName;

    @NotBlank(message = "Account number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Account number must be exactly 10 digits")
    private String accountNumber;

    @Size(max = 100, message = "Business name must not exceed 100 characters")
    private String businessName;

    @Size(max = 200, message = "Address must not exceed 200 characters")
    private String address;
}