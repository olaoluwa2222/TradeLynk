package com.codewithola.tradelynkapi.dtos.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaystackInitializeResponse {

    private Boolean status;
    private String message;
    private InitializeData data;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InitializeData {
        @JsonProperty("authorization_url")
        private String authorizationUrl;

        @JsonProperty("access_code")
        private String accessCode;

        @JsonProperty("reference")
        private String reference;
    }

}
