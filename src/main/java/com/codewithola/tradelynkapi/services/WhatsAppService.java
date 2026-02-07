package com.codewithola.tradelynkapi.services;

import com.codewithola.tradelynkapi.config.WhatsAppConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppService {

    private final WhatsAppConfig whatsAppConfig;
    private final RestTemplate restTemplate;

    public void sendMessage(String recipientPhone, String message) {
        log.info("📱 Sending WhatsApp to: {}", recipientPhone);

        try {
            String cleanPhone = recipientPhone.replace("+", "");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("messaging_product", "whatsapp");
            requestBody.put("recipient_type", "individual");
            requestBody.put("to", cleanPhone);
            requestBody.put("type", "text");
            requestBody.put("text", Map.of("body", message));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", whatsAppConfig.getAuthorizationHeader());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    whatsAppConfig.getSendMessageUrl(),
                    entity,
                    Map.class
            );

            log.info("✅ WhatsApp sent: {}", response.getStatusCode());

        } catch (Exception e) {
            log.error("❌ WhatsApp error", e);
        }
    }
}