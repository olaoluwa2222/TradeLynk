package com.codewithola.tradelynkapi.dtos.requests;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaystackInitializeRequest {

    @JsonProperty("amount")
    private String amount; // Amount in kobo

    @JsonProperty("email")
    private String email; // Buyer's email

    @JsonProperty("subaccount")
    private String subaccount; // Seller's subaccount code

    @JsonProperty("metadata")
    private PaymentMetadata metadata;
}
