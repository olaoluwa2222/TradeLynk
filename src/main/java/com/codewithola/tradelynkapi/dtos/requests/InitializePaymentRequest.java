package com.codewithola.tradelynkapi.dtos.requests;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for initializing a payment
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitializePaymentRequest {

    @NotNull(message = "Item ID is required")
    private Long itemId;

    /**
     * ✅ NEW: Product variant ID (optional - null for simple products)
     */
    private Long variantId;

    @NotNull(message = "Amount is required")
    @Min(value = 100, message = "Amount must be at least ₦100")
    private Long amount;

    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;

    /**
     * ✅ NEW: Callback URL where Paystack redirects after payment
     * If null/empty, defaults to "https://tradelynk.app/payment/success"
     */
    private String callbackUrl;
}