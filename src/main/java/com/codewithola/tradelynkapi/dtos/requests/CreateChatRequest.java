package com.codewithola.tradelynkapi.dtos.requests;


import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// ==================== REQUEST DTOs ====================

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateChatRequest {

    @NotNull(message = "Item ID is required")
    private Long itemId;

    @NotNull(message = "Seller ID is required")
    private Long sellerId;
}