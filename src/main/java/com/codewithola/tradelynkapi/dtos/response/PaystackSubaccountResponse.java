package com.codewithola.tradelynkapi.dtos.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaystackSubaccountResponse {

    private Boolean status;
    private String message;
    private SubaccountData data;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubaccountData {
        @JsonProperty("subaccount_code")
        private String subaccountCode;

        @JsonProperty("business_name")
        private String businessName;

        @JsonProperty("account_number")
        private String accountNumber;

        @JsonProperty("settlement_bank")
        private String settlementBank;

        @JsonProperty("percentage_charge")
        private Double percentageCharge;
    }
}
