package com.codewithola.tradelynkapi.controller;

import com.codewithola.tradelynkapi.config.WhatsAppConfig;
import com.codewithola.tradelynkapi.services.OpenAIService;
import com.codewithola.tradelynkapi.services.WhatsAppService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/whatsapp")
@RequiredArgsConstructor
public class WhatsAppController {

    private final WhatsAppService whatsAppService;
    private final OpenAIService openAIService;
    private final WhatsAppConfig whatsAppConfig;

    /**
     * GET /api/v1/whatsapp/webhook - For Meta verification
     */
    @GetMapping("/webhook")
    public ResponseEntity<String> verifyWebhook(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String token,
            @RequestParam("hub.challenge") String challenge) {

        log.info("🔍 Webhook verification request");

        if ("subscribe".equals(mode) &&
                whatsAppConfig.getWebhookVerifyToken().equals(token)) {
            log.info("✅ Webhook verified");
            return ResponseEntity.ok(challenge);
        }

        log.error("❌ Verification failed");
        return ResponseEntity.status(403).body("Failed");
    }

    /**
     * POST /api/v1/whatsapp/webhook - Receive messages from WhatsApp
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> receiveMessage(@RequestBody Map<String, Object> payload) {
        log.info("📨 Webhook received");

        try {
            List<Map<String, Object>> entry = (List<Map<String, Object>>) payload.get("entry");
            if (entry == null || entry.isEmpty()) {
                return ResponseEntity.ok("No entry");
            }

            Map<String, Object> changes = (Map<String, Object>)
                    ((List<?>) entry.get(0).get("changes")).get(0);
            Map<String, Object> value = (Map<String, Object>) changes.get("value");
            List<Map<String, Object>> messages = (List<Map<String, Object>>) value.get("messages");

            if (messages == null || messages.isEmpty()) {
                return ResponseEntity.ok("No messages");
            }

            Map<String, Object> message = messages.get(0);
            String from = (String) message.get("from");
            Map<String, Object> text = (Map<String, Object>) message.get("text");
            String userMessage = (String) text.get("body");

            log.info("💬 From {}: {}", from, userMessage);

            // Simple system prompt for now
            String systemPrompt = "You are a helpful sales assistant for TradeBlynk, " +
                    "an online marketplace in Nigeria. Be friendly, professional, and " +
                    "keep responses short (2-3 sentences). Use Nigerian English style.";

            String aiResponse = openAIService.chat(userMessage, systemPrompt);
            whatsAppService.sendMessage(from, aiResponse);

            return ResponseEntity.ok("Processed");

        } catch (Exception e) {
            log.error("❌ Error processing webhook", e);
            return ResponseEntity.ok("Error");
        }
    }
}