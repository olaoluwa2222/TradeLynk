package com.codewithola.tradelynkapi.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for cancelling an order
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCancelRequest {

    @NotBlank(message = "Cancellation reason is required")
    private String reason;
}