package com.codewithola.tradelynkapi.services;

import com.codewithola.tradelynkapi.config.WhatsAppConfig;
import com.codewithola.tradelynkapi.entity.SellerWhatsAppConfig;
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

    /**
     * Send message using global config (for testing)
     */
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

    /**
     * Send message using store-specific config (for multi-store)
     */
    public void sendMessageWithConfig(String recipientPhone, String message, SellerWhatsAppConfig config) {
        log.info("📱 Sending WhatsApp to: {} (Seller: {})", recipientPhone, config.getSeller().getId());

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
            headers.set("Authorization", "Bearer " + config.getAccessToken());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            String url = "https://graph.facebook.com/v18.0/" + config.getPhoneNumberId() + "/messages";

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            log.info("✅ WhatsApp sent: {} (Seller: {})", response.getStatusCode(), config.getSeller().getId());

        } catch (Exception e) {
            log.error("❌ WhatsApp error for seller {}", config.getSeller().getId(), e);
        }
    }

    /**
     * Send image message with store-specific config
     */
    public void sendImageWithConfig(String recipientPhone, String imageUrl, String caption, SellerWhatsAppConfig config) {
        log.info("📷 Sending WhatsApp image to: {} (Seller: {})", recipientPhone, config.getSeller().getId());

        try {
            String cleanPhone = recipientPhone.replace("+", "");

            Map<String, Object> imageData = new HashMap<>();
            imageData.put("link", imageUrl);
            if (caption != null && !caption.isEmpty()) {
                imageData.put("caption", caption);
            }

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("messaging_product", "whatsapp");
            requestBody.put("recipient_type", "individual");
            requestBody.put("to", cleanPhone);
            requestBody.put("type", "image");
            requestBody.put("image", imageData);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + config.getAccessToken());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            String url = "https://graph.facebook.com/v18.0/" + config.getPhoneNumberId() + "/messages";

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            log.info("✅ WhatsApp image sent: {}", response.getStatusCode());

        } catch (Exception e) {
            log.error("❌ WhatsApp image error", e);
        }
    }
}