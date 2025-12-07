package com.codewithola.tradelynkapi.dtos.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Response from Paystack Bank Account Validation API
 * Endpoint: GET /bank/resolve
 */
@Data
public class PaystackAccountValidationResponse {

    private Boolean status;
    private String message;
    private ValidationData data;

    @Data
    public static class ValidationData {

        @JsonProperty("account_number")
        private String accountNumber;

        @JsonProperty("account_name")
        private String accountName;

        @JsonProperty("bank_id")
        private Integer bankId;
    }
}