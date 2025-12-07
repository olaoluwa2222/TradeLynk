package com.codewithola.tradelynkapi.services;

import com.codewithola.tradelynkapi.entity.DeviceToken;
import com.codewithola.tradelynkapi.exception.NotFoundException;
import com.codewithola.tradelynkapi.repositories.DeviceTokenRepository;
import com.google.firebase.messaging.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final DeviceTokenRepository deviceTokenRepository;
    private final FirebaseMessaging firebaseMessaging;

    /**
     * Save FCM device token
     */
    @Transactional
    public void saveDeviceToken(Long userId, String deviceToken) {
        saveDeviceToken(userId, deviceToken, "web", null);
    }

    /**
     * Save FCM device token with device type and name
     */
    @Transactional
    public void saveDeviceToken(Long userId, String deviceToken, String deviceType, String deviceName) {
        log.info("Saving device token for user: {}, type: {}", userId, deviceType);

        // Check if token already exists
        Optional<DeviceToken> existing = deviceTokenRepository.findByDeviceToken(deviceToken);

        if (existing.isPresent()) {
            // Update existing token
            DeviceToken token = existing.get();
            token.setLastUsedAt(LocalDateTime.now());
            token.setIsActive(true);
            token.setDeviceType(deviceType != null ? deviceType : token.getDeviceType());
            token.setDeviceName(deviceName != null ? deviceName : token.getDeviceName());
            deviceTokenRepository.save(token);
            log.info("Updated existing device token for user: {}", userId);
        } else {
            // Create new token
            DeviceToken newToken = DeviceToken.builder()
                    .userId(userId)
                    .deviceToken(deviceToken)
                    .deviceType(deviceType != null ? deviceType : "web")
                    .deviceName(deviceName)
                    .isActive(true)
                    .build();

            deviceTokenRepository.save(newToken);
            log.info("Saved new device token for user: {}", userId);
        }
    }

    /**
     * Remove device token (on logout)
     */
    @Transactional
    public void removeDeviceToken(String deviceToken) {
        log.info("Removing device token: {}", deviceToken);

        Optional<DeviceToken> token = deviceTokenRepository.findByDeviceToken(deviceToken);

        if (token.isPresent()) {
            token.get().setIsActive(false);
            deviceTokenRepository.save(token.get());
            log.info("Device token marked as inactive");
        } else {
            log.warn("Device token not found: {}", deviceToken);
        }
    }

    /**
     * Remove all device tokens for a user
     */
    @Transactional
    public void removeAllDeviceTokens(Long userId) {
        log.info("Removing all device tokens for user: {}", userId);

        List<DeviceToken> tokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(userId);

        for (DeviceToken token : tokens) {
            token.setIsActive(false);
        }

        deviceTokenRepository.saveAll(tokens);
        log.info("Removed {} device tokens for user: {}", tokens.size(), userId);
    }

    /**
     * Send message notification to user
     * ✅ FIXED: Corrected senderId parameter
     */
    public void sendMessageNotification(Long recipientId, Long actualSenderId, String senderName, String messageContent, String chatId) {
        log.info("Sending message notification to user: {} for chat: {}", recipientId, chatId);

        // Get all active device tokens for recipient
        List<DeviceToken> tokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(recipientId);

        if (tokens.isEmpty()) {
            log.warn("No active device tokens found for user: {}", recipientId);
            return;
        }

        log.info("Found {} active device(s) for user: {}", tokens.size(), recipientId);

        // Send to all devices
        int successCount = 0;
        for (DeviceToken token : tokens) {
            try {
                Message message = Message.builder()
                        .setToken(token.getDeviceToken())
                        .setNotification(Notification.builder()
                                .setTitle(senderName)
                                .setBody(messageContent)
                                .build())
                        .putData("type", "message")
                        .putData("senderId", String.valueOf(actualSenderId)) // ✅ FIXED: Use actual sender's ID
                        .putData("senderName", senderName)
                        .putData("chatId", chatId) // ✅ CRITICAL: Include chatId!
                        .build();

                String response = firebaseMessaging.send(message);
                log.info("✅ Successfully sent FCM notification: {}", response);
                successCount++;

                // Update last used time
                token.setLastUsedAt(LocalDateTime.now());
                deviceTokenRepository.save(token);

            } catch (FirebaseMessagingException e) {
                handleFirebaseError(token, e);
            }
        }

        log.info("Sent notifications to {}/{} devices for chat: {}", successCount, tokens.size(), chatId);
    }

    /**
     * Send payment notification to seller
     */
    public void sendPaymentNotification(Long sellerId, Long amount, String itemTitle) {
        log.info("Sending payment notification to seller: {}", sellerId);

        List<DeviceToken> tokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(sellerId);

        if (tokens.isEmpty()) {
            log.warn("No active device tokens found for seller: {}", sellerId);
            return;
        }

        String amountFormatted = String.format("₦%,d", amount);

        for (DeviceToken token : tokens) {
            try {
                Message message = Message.builder()
                        .setToken(token.getDeviceToken())
                        .setNotification(Notification.builder()
                                .setTitle("💰 You made a sale!")
                                .setBody(itemTitle + " sold for " + amountFormatted)
                                .build())
                        .putData("type", "payment")
                        .putData("amount", String.valueOf(amount))
                        .putData("itemTitle", itemTitle)
                        .build();

                String response = firebaseMessaging.send(message);
                log.info("Successfully sent payment notification: {}", response);

                token.setLastUsedAt(LocalDateTime.now());
                deviceTokenRepository.save(token);

            } catch (FirebaseMessagingException e) {
                handleFirebaseError(token, e);
            }
        }
    }

    /**
     * Handle Firebase messaging errors
     */
    private void handleFirebaseError(DeviceToken token, FirebaseMessagingException e) {
        log.error("Error sending notification to device {}: {}",
                token.getDeviceToken(), e.getMessage());

        MessagingErrorCode errorCode = e.getMessagingErrorCode();

        if (errorCode == MessagingErrorCode.UNREGISTERED ||
                errorCode == MessagingErrorCode.INVALID_ARGUMENT) {
            // Token is invalid, mark as inactive
            token.setIsActive(false);
            deviceTokenRepository.save(token);
            log.warn("Invalid token for user {}, marked inactive", token.getUserId());
        }
    }

    /**
     * Cleanup old inactive tokens (runs daily at 3 AM)
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupOldTokens() {
        log.info("Starting cleanup of old device tokens");

        // Deactivate tokens not used in 90 days
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(90);
        deviceTokenRepository.deactivateOldTokens(cutoffDate);

        log.info("Completed cleanup of old device tokens");
    }

    /**
     * Get active device count for user
     */
    public long getActiveDeviceCount(Long userId) {
        return deviceTokenRepository.countByUserIdAndIsActiveTrue(userId);
    }
}