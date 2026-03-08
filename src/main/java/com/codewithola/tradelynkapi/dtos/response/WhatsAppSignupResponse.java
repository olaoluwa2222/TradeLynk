package com.codewithola.tradelynkapi.dtos.response;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WhatsAppSignupResponse {
    private String signupUrl;
    private String state;
}