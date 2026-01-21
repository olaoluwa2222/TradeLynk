package com.codewithola.tradelynkapi.dtos.requests;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payment metadata sent to Paystack
 * Used for tracking order details in Paystack dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMetadata {

    @JsonProperty("item_id")
    private Long itemId;

    /**
     * ✅ NEW: Variant ID for variable products
     */
    @JsonProperty("variant_id")
    private Long variantId;

    @JsonProperty("seller_id")
    private Long sellerId;

    @JsonProperty("buyer_id")
    private Long buyerId;

    @JsonProperty("item_title")
    private String itemTitle;

    /**
     * ✅ NEW: Variant name (e.g., "Large - Red")
     */
    @JsonProperty("variant_name")
    private String variantName;

    @JsonProperty("delivery_address")
    private String deliveryAddress;
}