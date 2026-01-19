package com.codewithola.tradelynkapi.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Summary DTO for shipping profile (used in item listings)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingProfileSummaryDTO {
    private Long id;
    private String name;
    private String shippingMethod;
    private Long flatRateCost;
    private Integer minDeliveryDays;
    private Integer maxDeliveryDays;
    private Boolean isFreeShipping;
}