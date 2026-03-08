package com.codewithola.tradelynkapi.dtos.response;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WhatsAppCallbackResponse {
    private boolean success;
    private String message;
    private String phoneNumber;
    private String phoneNumberId;
}