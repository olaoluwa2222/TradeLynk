package com.codewithola.tradelynkapi.controller;

import com.codewithola.tradelynkapi.dtos.response.WhatsAppCallbackResponse;
import com.codewithola.tradelynkapi.dtos.response.WhatsAppSignupResponse;
import com.codewithola.tradelynkapi.entity.Item;
import com.codewithola.tradelynkapi.entity.SellerWhatsAppConfig;
import com.codewithola.tradelynkapi.entity.WhatsAppConversation;
import com.codewithola.tradelynkapi.repositories.ItemRepository;
import com.codewithola.tradelynkapi.repositories.SellerWhatsAppConfigRepository;
import com.codewithola.tradelynkapi.repositories.WhatsAppConversationRepository;
import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.OpenAIService;
import com.codewithola.tradelynkapi.services.WhatsAppEmbeddedSignupService;
import com.codewithola.tradelynkapi.services.WhatsAppService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/whatsapp")
@RequiredArgsConstructor
public class WhatsAppController {

    private final WhatsAppService whatsAppService;
    private final OpenAIService openAIService;
    private final ItemRepository itemRepository;
    private final SellerWhatsAppConfigRepository sellerWhatsAppConfigRepository;
    private final WhatsAppConversationRepository conversationRepository;
    private final WhatsAppEmbeddedSignupService embeddedSignupService;

    /**
     * GET /api/v1/whatsapp/webhook/{phoneNumberId} - Verification per store
     */
    @GetMapping("/webhook/{phoneNumberId}")
    public ResponseEntity<String> verifyWebhook(
            @PathVariable String phoneNumberId,
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String token,
            @RequestParam("hub.challenge") String challenge) {

        log.info("🔍 Webhook verification for phone: {}", phoneNumberId);

        // Find the WhatsApp config for this phone number
        SellerWhatsAppConfig config = sellerWhatsAppConfigRepository
                .findByPhoneNumberId(phoneNumberId)
                .orElse(null);

        if (config == null) {
            log.error("❌ No config found for phone number ID: {}", phoneNumberId);
            return ResponseEntity.status(404).body("Config not found");
        }

        if ("subscribe".equals(mode) && config.getWebhookVerifyToken().equals(token)) {
            log.info("✅ Webhook verified for seller: {}", config.getSeller().getId());
            return ResponseEntity.ok(challenge);
        }

        log.error("❌ Verification failed");
        return ResponseEntity.status(403).body("Failed");
    }

    /**
     * POST /api/v1/whatsapp/webhook/{phoneNumberId} - Receive messages per store
     */
    @PostMapping("/webhook/{phoneNumberId}")
    public ResponseEntity<String> receiveMessage(
            @PathVariable String phoneNumberId,
            @RequestBody Map<String, Object> payload) {

        log.info("📨 Webhook received for phone: {}", phoneNumberId);

        try {
            // Find which store this message is for
            SellerWhatsAppConfig config = sellerWhatsAppConfigRepository
                    .findByPhoneNumberId(phoneNumberId)
                    .orElse(null);

            if (config == null) {
                log.error("❌ No config for phone: {}", phoneNumberId);
                return ResponseEntity.ok("No config");
            }

            if (!config.getIsEnabled() || config.getStatus() != SellerWhatsAppConfig.Status.ACTIVE) {
                log.warn("⚠️ WhatsApp bot disabled for seller: {}", config.getSeller().getId());
                return ResponseEntity.ok("Bot disabled");
            }

            // Extract message details
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

            if (text == null) {
                log.warn("⚠️ Non-text message received, skipping");
                return ResponseEntity.ok("Non-text message");
            }

            String userMessage = (String) text.get("body");

            log.info("💬 From {}: {} (Store: {})", from, userMessage, config.getSeller().getId());

            // Get or create conversation
            WhatsAppConversation conversation = conversationRepository
                    .findBySellerIdAndCustomerPhone(config.getSeller().getId(), from)
                    .orElse(WhatsAppConversation.builder()
                            .seller(config.getSeller())
                            .customerPhone(from)
                            .build());

            conversation.setLastMessage(userMessage);
            conversation.incrementMessageCount();
            conversationRepository.save(conversation);

            // Build AI prompt with THIS STORE'S products only
            String systemPrompt = buildSystemPromptForStore(config.getSeller().getId());

            // Get AI response
            String aiResponse = openAIService.chat(userMessage, systemPrompt);

            // Send response using THIS STORE'S WhatsApp number
            whatsAppService.sendMessageWithConfig(from, aiResponse, config);

            // Update analytics
            config.incrementMessagesReceived();
            config.incrementMessagesSent();
            sellerWhatsAppConfigRepository.save(config);

            return ResponseEntity.ok("Processed");

        } catch (Exception e) {
            log.error("❌ Error processing webhook", e);
            return ResponseEntity.ok("Error");
        }
    }

    /**
     * Build AI prompt with store-specific products
     */
    private String buildSystemPromptForStore(Long sellerId) {
        try {
            // Get only THIS STORE'S products
            List<Item> items = itemRepository.findBySellerId(sellerId)
                    .stream()
                    .filter(item -> item.getStatus() == Item.Status.ACTIVE)
                    .filter(item -> item.getQuantity() > 0)
                    .limit(20)
                    .collect(Collectors.toList());

            StringBuilder prompt = new StringBuilder();
            prompt.append("You are a helpful sales assistant for this specific store on TradeBlynk.\n\n");

            if (!items.isEmpty()) {
                prompt.append("THIS STORE'S AVAILABLE PRODUCTS:\n");
                for (Item item : items) {
                    prompt.append(String.format(
                            "- %s | ₦%,d | %s | Category: %s\n",
                            item.getTitle(),
                            item.getPrice() / 100, // Convert kobo to Naira
                            item.getCondition(),
                            item.getCategory()
                    ));
                }
                prompt.append("\n");
            } else {
                prompt.append("This store currently has no products listed.\n\n");
            }

            prompt.append("YOUR ROLE:\n");
            prompt.append("1. Help customers find products from THIS STORE'S list above\n");
            prompt.append("2. Answer questions about prices, condition, and availability\n");
            prompt.append("3. When they want to buy, tell them to visit: https://tradelynk.app\n");
            prompt.append("4. Be friendly, use Nigerian English style\n");
            prompt.append("5. Keep responses SHORT (2-3 sentences max)\n");
            prompt.append("6. IMPORTANT: Only mention products from THIS STORE'S list\n");
            prompt.append("7. If asked about products not in the list, say 'We don't have that right now'\n");

            return prompt.toString();

        } catch (Exception e) {
            log.error("Error building prompt for seller {}", sellerId, e);
            return "You are a helpful sales assistant. Be friendly and professional.";
        }
    }

    /**
     * GET /api/v1/whatsapp/embedded-signup
     * Generate signup URL for seller to connect their WhatsApp
     */
    @GetMapping("/embedded-signup")
    public ResponseEntity<Map<String, Object>> getEmbeddedSignupUrl(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("🔗 Generating embedded signup URL for seller: {}", userPrincipal.getId());

        try {
            WhatsAppSignupResponse response = embeddedSignupService.generateSignupUrl(userPrincipal.getId());

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("signupUrl", response.getSignupUrl());
            result.put("state", response.getState());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error generating signup URL", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to generate signup URL: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * GET /api/v1/whatsapp/callback
     * Handle OAuth callback from Meta after seller completes signup
     */
    @GetMapping("/callback")
    public ResponseEntity<Map<String, Object>> handleOAuthCallback(
            @RequestParam("code") String code,
            @RequestParam("state") String state) {

        log.info("📞 Received OAuth callback. State: {}", state);

        try {
            WhatsAppCallbackResponse response = embeddedSignupService.handleCallback(code, state);

            Map<String, Object> result = new HashMap<>();
            result.put("success", response.isSuccess());
            result.put("message", response.getMessage());
            result.put("phoneNumber", response.getPhoneNumber());
            result.put("phoneNumberId", response.getPhoneNumberId());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error handling callback", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to process callback: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * GET /api/v1/whatsapp/status
     * Get seller's WhatsApp bot status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getWhatsAppStatus(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        try {
            SellerWhatsAppConfig config = sellerWhatsAppConfigRepository
                    .findBySellerId(userPrincipal.getId())
                    .orElse(null);

            Map<String, Object> result = new HashMap<>();

            if (config == null) {
                result.put("connected", false);
                result.put("message", "WhatsApp not connected");
            } else {
                result.put("connected", true);
                result.put("phoneNumber", config.getPhoneNumber());
                result.put("phoneNumberId", config.getPhoneNumberId());
                result.put("status", config.getStatus());
                result.put("isEnabled", config.getIsEnabled());
                result.put("totalConversations", config.getTotalConversations());
                result.put("totalMessagesSent", config.getTotalMessagesSent());
                result.put("totalMessagesReceived", config.getTotalMessagesReceived());
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting status", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get status: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * POST /api/v1/whatsapp/toggle
     * Enable/disable WhatsApp bot
     */
    @PostMapping("/toggle")
    public ResponseEntity<Map<String, Object>> toggleWhatsAppBot(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Boolean> request) {

        try {
            Boolean enabled = request.get("enabled");

            SellerWhatsAppConfig config = sellerWhatsAppConfigRepository
                    .findBySellerId(userPrincipal.getId())
                    .orElseThrow(() -> new RuntimeException("WhatsApp not connected"));

            config.setIsEnabled(enabled);
            sellerWhatsAppConfigRepository.save(config);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", enabled ? "Bot enabled" : "Bot disabled");
            result.put("isEnabled", enabled);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error toggling bot", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}
