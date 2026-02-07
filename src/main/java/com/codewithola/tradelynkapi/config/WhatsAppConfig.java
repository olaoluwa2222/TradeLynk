package com.codewithola.tradelynkapi.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Getter
@Configuration
public class WhatsAppConfig {

    @Value("${whatsapp.access-token}")
    private String accessToken;

    @Value("${whatsapp.phone-number-id}")
    private String phoneNumberId;

    @Value("${whatsapp.webhook-verify-token}")
    private String webhookVerifyToken;

    public String getBaseUrl() {
        return "https://graph.facebook.com/v18.0";
    }

    public String getSendMessageUrl() {
        return getBaseUrl() + "/" + phoneNumberId + "/messages";
    }

    public String getAuthorizationHeader() {
        return "Bearer " + accessToken;
    }
}