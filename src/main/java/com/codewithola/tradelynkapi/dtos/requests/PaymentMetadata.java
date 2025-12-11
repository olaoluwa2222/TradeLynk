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
public class PaymentMetadata {

    @JsonProperty("item_id")
    private Long itemId;

    @JsonProperty("seller_id")
    private Long sellerId;

    @JsonProperty("buyer_id")
    private Long buyerId;

    @JsonProperty("item_title")
    private String itemTitle;

    // ✅ NEW: Add delivery address to metadata
    @JsonProperty("delivery_address")
    private String deliveryAddress;
}