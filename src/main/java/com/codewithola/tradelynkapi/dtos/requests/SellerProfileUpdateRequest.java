package com.codewithola.tradelynkapi.dtos.requests;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerProfileUpdateRequest {

    @Size(max = 100, message = "Business name must not exceed 100 characters")
    private String businessName;

    @Size(max = 200, message = "Address must not exceed 200 characters")
    private String address;

    private String profilePictureUrl;
}

