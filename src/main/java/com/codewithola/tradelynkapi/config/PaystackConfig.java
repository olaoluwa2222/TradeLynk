package com.codewithola.tradelynkapi.config;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class PaystackConfig {

    @Value("${paystack.secret-key}")
    private String secretKey;

    @Value("${paystack.public-key:}")
    private String publicKey;

    @Value("${paystack.api-url:https://api.paystack.co}")
    private String baseUrl;

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    public String getSecretKey() {
        return secretKey;
    }

    public String getPublicKey() {
        return publicKey;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public String getAuthorizationHeader() {
        return "Bearer " + secretKey;
    }
}
