package com.codewithola.tradelynkapi.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Getter
@Configuration
public class MetaEmbeddedSignupConfig {

    @Value("${meta.app.id}")
    private String appId;

    @Value("${meta.app.secret}")
    private String appSecret;

    @Value("${meta.config.id:}")
    private String configId;

    @Value("${meta.redirect.uri}")
    private String redirectUri;

    public String getEmbeddedSignupUrl(String state) {
        // If configId is set, use it; otherwise use basic OAuth
        if (configId != null && !configId.isEmpty()) {
            return String.format(
                    "https://www.facebook.com/v18.0/dialog/oauth?" +
                            "client_id=%s&" +
                            "redirect_uri=%s&" +
                            "state=%s&" +
                            "config_id=%s&" +
                            "response_type=code&" +
                            "scope=whatsapp_business_management,whatsapp_business_messaging",
                    appId,
                    redirectUri,
                    state,
                    configId
            );
        } else {
            // Fallback to basic OAuth (for testing)
            return String.format(
                    "https://www.facebook.com/v18.0/dialog/oauth?" +
                            "client_id=%s&" +
                            "redirect_uri=%s&" +
                            "state=%s&" +
                            "response_type=code&" +
                            "scope=whatsapp_business_management,whatsapp_business_messaging",
                    appId,
                    redirectUri,
                    state
            );
        }
    }

    public String getTokenExchangeUrl() {
        return "https://graph.facebook.com/v18.0/oauth/access_token";
    }
}