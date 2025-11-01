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
public class PaystackSubaccountRequest {

    @JsonProperty("business_name")
    private String businessName;

    @JsonProperty("settlement_bank")
    private String settlementBank; // Bank code

    @JsonProperty("account_number")
    private String accountNumber;

    @JsonProperty("percentage_charge")
    private Double percentageCharge; // Platform fee (e.g., 10.0 for 10%)
}
