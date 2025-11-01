package com.codewithola.tradelynkapi.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class SellerActivationResponse {
    private Long sellerId;
    private String message;
    private SellerProfileDTO sellerProfile;
}
