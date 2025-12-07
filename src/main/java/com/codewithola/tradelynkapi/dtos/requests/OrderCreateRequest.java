package com.codewithola.tradelynkapi.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating an order
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreateRequest {

    @NotNull(message = "Item ID is required")
    private Long itemId;

    @NotNull(message = "Payment ID is required")
    private Long paymentId;

    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress; // Campus location
}