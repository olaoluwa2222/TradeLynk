package com.codewithola.tradelynkapi.services;

import com.codewithola.tradelynkapi.config.MetaEmbeddedSignupConfig;
import com.codewithola.tradelynkapi.dtos.response.WhatsAppCallbackResponse;
import com.codewithola.tradelynkapi.dtos.response.WhatsAppSignupResponse;
import com.codewithola.tradelynkapi.entity.SellerWhatsAppConfig;
import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.repositories.SellerWhatsAppConfigRepository;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppEmbeddedSignupService {

    private final MetaEmbeddedSignupConfig config;
    private final RestTemplate restTemplate;
    private final SellerWhatsAppConfigRepository whatsAppConfigRepository;
    private final UserRepository userRepository;

    /**
     * Generate embedded signup URL for seller
     */
    public WhatsAppSignupResponse generateSignupUrl(Long sellerId) {
        log.info("🔗 Generating embedded signup URL for seller: {}", sellerId);

        // Generate unique state token (to prevent CSRF)
        String state = UUID.randomUUID().toString() + "_" + sellerId;

        String signupUrl = config.getEmbeddedSignupUrl(state);

        log.info("✅ Signup URL generated: {}", signupUrl);

        return WhatsAppSignupResponse.builder()
                .signupUrl(signupUrl)
                .state(state)
                .build();
    }

    /**
     * Handle callback from Meta after seller completes signup
     */
    public WhatsAppCallbackResponse handleCallback(String code, String state) {
        log.info("📞 Handling WhatsApp signup callback. State: {}", state);

        try {
            // 1. Extract seller ID from state
            String[] parts = state.split("_");
            if (parts.length < 2) {
                throw new RuntimeException("Invalid state parameter");
            }
            Long sellerId = Long.parseLong(parts[parts.length - 1]);

            log.info("👤 Extracted seller ID: {}", sellerId);

            // 2. Exchange code for access token
            log.info("🔄 Exchanging code for access token...");
            Map<String, Object> tokenData = exchangeCodeForToken(code);

            String accessToken = (String) tokenData.get("access_token");
            log.info("✅ Access token received");

            // 3. Get WhatsApp Business Account ID
            log.info("🔍 Fetching WhatsApp Business Account...");
            String wabId = getWhatsAppBusinessAccountId(accessToken);
            log.info("✅ WABA ID: {}", wabId);

            // 4. Get phone number details
            log.info("📱 Fetching phone number details...");
            Map<String, Object> phoneData = getPhoneNumberDetails(accessToken, wabId);

            String phoneNumberId = (String) phoneData.get("id");
            String phoneNumber = (String) phoneData.get("display_phone_number");
            log.info("✅ Phone: {} (ID: {})", phoneNumber, phoneNumberId);

            // 5. Save to database
            User seller = userRepository.findById(sellerId)
                    .orElseThrow(() -> new RuntimeException("Seller not found"));

            // Check if config already exists
            SellerWhatsAppConfig existingConfig = whatsAppConfigRepository
                    .findBySellerId(sellerId)
                    .orElse(null);

            SellerWhatsAppConfig whatsAppConfig;
            if (existingConfig != null) {
                // Update existing
                existingConfig.setPhoneNumberId(phoneNumberId);
                existingConfig.setPhoneNumber(phoneNumber);
                existingConfig.setAccessToken(accessToken);
                existingConfig.setStatus(SellerWhatsAppConfig.Status.ACTIVE);
                existingConfig.setIsEnabled(true);
                whatsAppConfig = existingConfig;
            } else {
                // Create new
                whatsAppConfig = SellerWhatsAppConfig.builder()
                        .seller(seller)
                        .phoneNumberId(phoneNumberId)
                        .phoneNumber(phoneNumber)
                        .accessToken(accessToken)
                        .webhookVerifyToken("tradelynk_verify_" + sellerId)
                        .status(SellerWhatsAppConfig.Status.ACTIVE)
                        .isEnabled(true)
                        .build();
            }

            whatsAppConfigRepository.save(whatsAppConfig);
            log.info("💾 WhatsApp config saved to database");

            // 6. Register webhook (Meta does this automatically with Embedded Signup)
            log.info("🔔 Webhook will be auto-configured by Meta");

            log.info("✅ WhatsApp connected successfully for seller: {}", sellerId);

            return WhatsAppCallbackResponse.builder()
                    .success(true)
                    .message("WhatsApp connected successfully!")
                    .phoneNumber(phoneNumber)
                    .phoneNumberId(phoneNumberId)
                    .build();

        } catch (Exception e) {
            log.error("❌ Error handling callback", e);
            return WhatsAppCallbackResponse.builder()
                    .success(false)
                    .message("Failed to connect WhatsApp: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Exchange authorization code for access token
     */
    private Map<String, Object> exchangeCodeForToken(String code) {
        String url = String.format(
                "%s?client_id=%s&client_secret=%s&code=%s&redirect_uri=%s",
                config.getTokenExchangeUrl(),
                config.getAppId(),
                config.getAppSecret(),
                code,
                config.getRedirectUri()
        );

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                throw new RuntimeException("Failed to exchange code for token: " + response.getStatusCode());
            }

            return response.getBody();
        } catch (Exception e) {
            log.error("Error exchanging code for token", e);
            throw new RuntimeException("Failed to exchange code for token: " + e.getMessage());
        }
    }

    /**
     * Get WhatsApp Business Account ID from access token
     */
    private String getWhatsAppBusinessAccountId(String accessToken) {
        String url = String.format(
                "https://graph.facebook.com/v18.0/me?fields=whatsapp_business_accounts&access_token=%s",
                accessToken
        );

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

            if (response.getBody() == null) {
                throw new RuntimeException("Failed to get WhatsApp Business Account");
            }

            Map<String, Object> data = response.getBody();
            Map<String, Object> wabaData = (Map<String, Object>) data.get("whatsapp_business_accounts");

            if (wabaData == null) {
                throw new RuntimeException("No whatsapp_business_accounts in response");
            }

            java.util.List<Map<String, Object>> accounts =
                    (java.util.List<Map<String, Object>>) wabaData.get("data");

            if (accounts == null || accounts.isEmpty()) {
                throw new RuntimeException("No WhatsApp Business Account found");
            }

            return (String) accounts.get(0).get("id");
        } catch (Exception e) {
            log.error("Error getting WABA ID", e);
            throw new RuntimeException("Failed to get WhatsApp Business Account: " + e.getMessage());
        }
    }

    /**
     * Get phone number details
     */
    private Map<String, Object> getPhoneNumberDetails(String accessToken, String wabId) {
        String url = String.format(
                "https://graph.facebook.com/v18.0/%s/phone_numbers?access_token=%s",
                wabId,
                accessToken
        );

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

            if (response.getBody() == null) {
                throw new RuntimeException("Failed to get phone number");
            }

            java.util.List<Map<String, Object>> phoneNumbers =
                    (java.util.List<Map<String, Object>>) response.getBody().get("data");

            if (phoneNumbers == null || phoneNumbers.isEmpty()) {
                throw new RuntimeException("No phone number found");
            }

            return phoneNumbers.get(0);
        } catch (Exception e) {
            log.error("Error getting phone number", e);
            throw new RuntimeException("Failed to get phone number: " + e.getMessage());
        }
    }
}