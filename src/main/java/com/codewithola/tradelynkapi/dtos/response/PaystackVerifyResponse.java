package com.codewithola.tradelynkapi.dtos.response;

import com.codewithola.tradelynkapi.dtos.requests.PaymentMetadata;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaystackVerifyResponse {

    private Boolean status;
    private String message;
    private VerifyData data;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerifyData {
        @JsonProperty("reference")
        private String reference;

        @JsonProperty("amount")
        private Long amount;

        @JsonProperty("status")
        private String status; // "success", "failed"

        @JsonProperty("paid_at")
        private String paidAt;

        @JsonProperty("customer")
        private Customer customer;

        @JsonProperty("metadata")
        private PaymentMetadata metadata;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Customer {
        private String email;
    }
}