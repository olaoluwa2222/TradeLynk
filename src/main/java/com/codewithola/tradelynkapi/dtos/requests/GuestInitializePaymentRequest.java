package com.codewithola.tradelynkapi.dtos.requests;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for POST /api/v1/payments/guest/initialize.
 * No authentication required — used by the WhatsApp bot and direct payment links.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuestInitializePaymentRequest {

    @NotNull(message = "Item ID is required")
    private Long itemId;

    /** Optional — only for items with variants */
    private Long variantId;

    @NotNull(message = "Amount is required")
    @Min(value = 100, message = "Amount must be at least ₦100")
    private Long amount; // In Naira

    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;

    @NotBlank(message = "Buyer name is required")
    @Size(max = 150, message = "Name must not exceed 150 characters")
    private String buyerName;

    @NotBlank(message = "Buyer email is required")
    @Email(message = "A valid email is required")
    private String buyerEmail;

    /** Optional but recommended — used to contact buyer via WhatsApp */
    @Pattern(regexp = "^[+]?[0-9]{7,15}$", message = "Phone number must be 7-15 digits")
    private String buyerPhone;

    /**
     * Where Paystack redirects after payment.
     * Defaults to https://tradelynk.app/payment/success if omitted.
     */
    private String callbackUrl;
}

