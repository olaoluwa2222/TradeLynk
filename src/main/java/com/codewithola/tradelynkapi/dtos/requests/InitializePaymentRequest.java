package com.codewithola.tradelynkapi.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitializePaymentRequest {

    @NotNull(message = "Item ID is required")
    private Long itemId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private Long amount;

    // ✅ NEW: Add delivery address
    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;
}