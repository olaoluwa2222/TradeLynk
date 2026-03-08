package com.codewithola.tradelynkapi.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitializePaymentResponse {
    private String paymentUrl;
    private String reference;
    private String paymentReference; // same as reference, for frontend compatibility
    private Long amount;
    private String message;
}
