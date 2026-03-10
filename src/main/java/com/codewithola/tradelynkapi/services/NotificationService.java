package com.codewithola.tradelynkapi.services;

import com.codewithola.tradelynkapi.entity.DeviceToken;
import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.exception.NotFoundException;
import com.codewithola.tradelynkapi.repositories.DeviceTokenRepository;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import com.google.firebase.messaging.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
    private final UserRepository userRepository; // ✅ ADDED
    private final EmailService emailService; // ✅ ADDED

    @Value("${app.frontend.url:https://tradelynk.com}") // ✅ ADDED with default
    private String frontendUrl;

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
                        .putData("senderId", String.valueOf(actualSenderId))
                        .putData("senderName", senderName)
                        .putData("chatId", chatId)
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
     * Send payment received notification to seller (called during payment verification).
     * A lightweight push-only alert; the full order notification is sent after order creation.
     */
    public void sendPaymentReceivedNotification(Long sellerId, Long amount, String itemTitle) {
        log.info("Sending payment received notification to seller: {}", sellerId);

        try {
            List<DeviceToken> tokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(sellerId);
            String amountFormatted = String.format("₦%,d", amount);

            for (DeviceToken token : tokens) {
                try {
                    Message message = Message.builder()
                            .setToken(token.getDeviceToken())
                            .setNotification(Notification.builder()
                                    .setTitle("💰 Payment Received!")
                                    .setBody("Payment of " + amountFormatted + " for '" + itemTitle + "' confirmed!")
                                    .build())
                            .putData("type", "payment_received")
                            .putData("amount", String.valueOf(amount))
                            .putData("itemTitle", itemTitle)
                            .build();

                    firebaseMessaging.send(message);
                    token.setLastUsedAt(LocalDateTime.now());
                    deviceTokenRepository.save(token);

                } catch (FirebaseMessagingException e) {
                    handleFirebaseError(token, e);
                }
            }
        } catch (Exception e) {
            log.error("❌ Failed to send payment received notification to seller {}", sellerId, e);
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

    /**
     * ✅ UPDATED: Send notification to seller about a new order
     * Now includes EMAIL notification
     */
    public void sendNewOrderNotification(Long sellerId, String itemTitle, Long amount) {
        log.info("Sending new order notification to seller: {}", sellerId);

        try {
            // Fetch seller details
            User seller = userRepository.findById(sellerId)
                    .orElseThrow(() -> new NotFoundException("Seller not found"));

            // 1. Send push notifications
            List<DeviceToken> tokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(sellerId);

            if (tokens.isEmpty()) {
                log.warn("No active device tokens found for seller: {}", sellerId);
            } else {
                String amountFormatted = String.format("₦%,d", amount);

                for (DeviceToken token : tokens) {
                    try {
                        Message message = Message.builder()
                                .setToken(token.getDeviceToken())
                                .setNotification(Notification.builder()
                                        .setTitle("🎉 New Order Received!")
                                        .setBody("Order for '" + itemTitle + "' - " + amountFormatted)
                                        .build())
                                .putData("type", "new_order")
                                .putData("itemTitle", itemTitle)
                                .putData("amount", String.valueOf(amount))
                                .build();

                        String response = firebaseMessaging.send(message);
                        log.info("Successfully sent new order push notification: {}", response);

                        token.setLastUsedAt(LocalDateTime.now());
                        deviceTokenRepository.save(token);

                    } catch (FirebaseMessagingException e) {
                        handleFirebaseError(token, e);
                    }
                }
            }

            // 2. ✅ NEW: Send email notification
            String subject = "New Order Received - " + itemTitle;
            String body = String.format("""
                    Hello %s,
                    
                    Great news! You have received a new order on TradeLynk.
                    
                    📦 Item: %s
                    💰 Amount: ₦%,d
                    
                    Please log in to your TradeLynk account to view the order details and arrange delivery with the buyer.
                    
                    Login here: %s/dashboard/sales
                    
                    Thank you for being a valued seller on our platform!
                    
                    Best regards,
                    The TradeLynk Team
                    """,
                    seller.getFullName(),
                    itemTitle,
                    amount,
                    frontendUrl
            );

            emailService.sendEmail(seller.getEmail(), subject, body);
            log.info("✅ Order email sent to seller: {}", seller.getEmail());

        } catch (Exception e) {
            log.error("❌ Failed to send new order notification to seller {}", sellerId, e);
            // Don't throw - we don't want order creation to fail if notification fails
        }
    }

    /**
     * ✅ NEW: Send notification to buyer when their order is placed.
     * "Your order has been placed and is being prepared for delivery."
     */
    public void sendBuyerOrderPlacedNotification(Long buyerId, String itemTitle, Long amount) {
        log.info("Sending order placed notification to buyer: {}", buyerId);

        try {
            User buyer = userRepository.findById(buyerId)
                    .orElseThrow(() -> new NotFoundException("Buyer not found"));

            // 1. Push notification
            List<DeviceToken> tokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(buyerId);
            for (DeviceToken token : tokens) {
                try {
                    Message message = Message.builder()
                            .setToken(token.getDeviceToken())
                            .setNotification(Notification.builder()
                                    .setTitle("✅ Order Placed!")
                                    .setBody("Your order for '" + itemTitle + "' has been placed successfully!")
                                    .build())
                            .putData("type", "order_placed")
                            .putData("itemTitle", itemTitle)
                            .build();
                    firebaseMessaging.send(message);
                    token.setLastUsedAt(LocalDateTime.now());
                    deviceTokenRepository.save(token);
                } catch (FirebaseMessagingException e) {
                    handleFirebaseError(token, e);
                }
            }

            // 2. Email — no escrow/hold language, no "confirm delivery" instruction
            String subject = "Order Confirmed - " + itemTitle;
            String body = String.format("""
                    Hello %s,
                    
                    Your order has been placed successfully on TradeLynk!
                    
                    📦 Item: %s
                    💰 Amount: ₦%,d
                    
                    Your order is being prepared for delivery. The seller will dispatch it and update the \
status to Shipped.
                    
                    Track your order: %s/dashboard/purchases
                    
                    Thank you for shopping on TradeLynk!
                    
                    Best regards,
                    The TradeLynk Team
                    """,
                    buyer.getFullName(),
                    itemTitle,
                    amount,
                    frontendUrl
            );
            emailService.sendEmail(buyer.getEmail(), subject, body);
            log.info("✅ Order placed email sent to buyer: {}", buyer.getEmail());

        } catch (Exception e) {
            log.error("❌ Failed to send buyer order placed notification to {}", buyerId, e);
        }
    }

    /**
     * ✅ UPDATED: Send notification to seller when buyer confirms delivery
     * Now includes EMAIL notification
     */
    public void sendDeliveryConfirmationNotification(Long sellerId, String itemTitle) {
        log.info("Sending delivery confirmation notification to seller: {}", sellerId);

        try {
            // Fetch seller details
            User seller = userRepository.findById(sellerId)
                    .orElseThrow(() -> new NotFoundException("Seller not found"));

            // 1. Send push notifications
            List<DeviceToken> tokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(sellerId);

            if (tokens.isEmpty()) {
                log.warn("No active device tokens found for seller: {}", sellerId);
            } else {
                for (DeviceToken token : tokens) {
                    try {
                        Message message = Message.builder()
                                .setToken(token.getDeviceToken())
                                .setNotification(Notification.builder()
                                        .setTitle("✅ Order Delivered!")
                                        .setBody("Buyer confirmed delivery of '" + itemTitle + "'")
                                        .build())
                                .putData("type", "delivery_confirmed")
                                .putData("itemTitle", itemTitle)
                                .build();

                        String response = firebaseMessaging.send(message);
                        log.info("Successfully sent delivery confirmation push notification: {}", response);

                        token.setLastUsedAt(LocalDateTime.now());
                        deviceTokenRepository.save(token);

                    } catch (FirebaseMessagingException e) {
                        handleFirebaseError(token, e);
                    }
                }
            }

            // 2. ✅ Send email notification
            String subject = "Order Completed - " + itemTitle;
            String body = String.format("""
                    Hello %s,
                    
                    Your order has been completed!
                    
                    📦 Item: %s
                    ✅ Status: Completed
                    
                    A payout has been initiated to your registered bank account and should arrive within 1-2 business days.
                    
                    View your sales: %s/dashboard/sales
                    
                    Thank you for using TradeLynk!

                    Best regards,
                    The TradeLynk Team
                    """,
                    seller.getFullName(),
                    itemTitle,
                    frontendUrl
            );

            emailService.sendEmail(seller.getEmail(), subject, body);
            log.info("✅ Order completion email sent to seller: {}", seller.getEmail());

        } catch (Exception e) {
            log.error("❌ Failed to send delivery confirmation to seller {}", sellerId, e);
        }
    }

    /**
     * ✅ UPDATED: Send notification about order cancellation
     * Now includes EMAIL notification
     */
    public void sendOrderCancellationNotification(Long userId, String itemTitle, String reason) {
        log.info("Sending order cancellation notification to user: {}", userId);

        try {
            // Fetch user details
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new NotFoundException("User not found"));

            // 1. Send push notifications
            List<DeviceToken> tokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(userId);

            if (tokens.isEmpty()) {
                log.warn("No active device tokens found for user: {}", userId);
            } else {
                for (DeviceToken token : tokens) {
                    try {
                        Message message = Message.builder()
                                .setToken(token.getDeviceToken())
                                .setNotification(Notification.builder()
                                        .setTitle("❌ Order Cancelled")
                                        .setBody("Order for '" + itemTitle + "' was cancelled. Reason: " + reason)
                                        .build())
                                .putData("type", "order_cancelled")
                                .putData("itemTitle", itemTitle)
                                .putData("reason", reason)
                                .build();

                        String response = firebaseMessaging.send(message);
                        log.info("Successfully sent order cancellation push notification: {}", response);

                        token.setLastUsedAt(LocalDateTime.now());
                        deviceTokenRepository.save(token);

                    } catch (FirebaseMessagingException e) {
                        handleFirebaseError(token, e);
                    }
                }
            }

            // 2. ✅ NEW: Send email notification
            String subject = "Order Cancelled - " + itemTitle;
            String body = String.format("""
                    Hello %s,
                    
                    An order has been cancelled.
                    
                    📦 Item: %s
                    ❌ Status: Cancelled
                    📝 Reason: %s
                    
                    If this cancellation is unexpected or you have any questions, please contact our support team.
                    
                    View your orders: %s/dashboard
                    
                    Best regards,
                    The TradeLynk Team
                    """,
                    user.getFullName(),
                    itemTitle,
                    reason,
                    frontendUrl
            );

            emailService.sendEmail(user.getEmail(), subject, body);
            log.info("✅ Cancellation email sent to user: {}", user.getEmail());

        } catch (Exception e) {
            log.error("❌ Failed to send cancellation notification to user {}", userId, e);
        }
    }

    /**
     * ✅ UPDATED: Send notification about auto-completion to both buyer and seller
     * Now includes EMAIL notifications
     */
    public void sendAutoCompletionNotification(Long buyerId, Long sellerId, String itemTitle) {
        log.info("Sending auto-completion notifications for item: {}", itemTitle);

        try {
            // Fetch buyer and seller details
            User buyer = userRepository.findById(buyerId)
                    .orElseThrow(() -> new NotFoundException("Buyer not found"));
            User seller = userRepository.findById(sellerId)
                    .orElseThrow(() -> new NotFoundException("Seller not found"));

            // ========== NOTIFY BUYER ==========
            List<DeviceToken> buyerTokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(buyerId);
            for (DeviceToken token : buyerTokens) {
                try {
                    Message message = Message.builder()
                            .setToken(token.getDeviceToken())
                            .setNotification(Notification.builder()
                                    .setTitle("📦 Order Auto-Completed")
                                    .setBody("Your order for '" + itemTitle + "' has been automatically marked as delivered")
                                    .build())
                            .putData("type", "order_auto_completed")
                            .putData("itemTitle", itemTitle)
                            .putData("userRole", "buyer")
                            .build();

                    String response = firebaseMessaging.send(message);
                    log.info("Successfully sent auto-completion push notification to buyer: {}", response);

                    token.setLastUsedAt(LocalDateTime.now());
                    deviceTokenRepository.save(token);

                } catch (FirebaseMessagingException e) {
                    handleFirebaseError(token, e);
                }
            }

            // ✅ NEW: Send email to buyer
            String buyerSubject = "Order Auto-Completed - " + itemTitle;
            String buyerBody = String.format("""
                    Hello %s,
                    
                    Your order has been automatically marked as completed.
                    
                    📦 Item: %s
                    ✅ Status: Delivered (Auto-completed after 48 hours)
                    
                    This order was automatically completed as we didn't receive a delivery confirmation within 48 hours.
                    If there are any issues with this order, please contact our support team immediately.
                    
                    View your orders: %s/dashboard/purchases
                    
                    Best regards,
                    The TradeLynk Team
                    """,
                    buyer.getFullName(),
                    itemTitle,
                    frontendUrl
            );
            emailService.sendEmail(buyer.getEmail(), buyerSubject, buyerBody);
            log.info("✅ Auto-completion email sent to buyer: {}", buyer.getEmail());

            // ========== NOTIFY SELLER ==========
            List<DeviceToken> sellerTokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(sellerId);
            for (DeviceToken token : sellerTokens) {
                try {
                    Message message = Message.builder()
                            .setToken(token.getDeviceToken())
                            .setNotification(Notification.builder()
                                    .setTitle("✅ Order Completed")
                                    .setBody("Order for '" + itemTitle + "' has been automatically completed")
                                    .build())
                            .putData("type", "order_auto_completed")
                            .putData("itemTitle", itemTitle)
                            .putData("userRole", "seller")
                            .build();

                    String response = firebaseMessaging.send(message);
                    log.info("Successfully sent auto-completion push notification to seller: {}", response);

                    token.setLastUsedAt(LocalDateTime.now());
                    deviceTokenRepository.save(token);

                } catch (FirebaseMessagingException e) {
                    handleFirebaseError(token, e);
                }
            }

            // ✅ NEW: Send email to seller
            String sellerSubject = "Order Completed - " + itemTitle;
            String sellerBody = String.format("""
                    Hello %s,
                    
                    Your order has been automatically marked as completed.
                    
                    📦 Item: %s
                    ✅ Status: Completed (Auto-completed after 48 hours)

                    Your payment will be processed according to our settlement schedule.
                    
                    View your sales: %s/dashboard/sales
                    
                    Best regards,
                    The TradeLynk Team
                    """,
                    seller.getFullName(),
                    itemTitle,
                    frontendUrl
            );
            emailService.sendEmail(seller.getEmail(), sellerSubject, sellerBody);
            log.info("✅ Auto-completion email sent to seller: {}", seller.getEmail());

        } catch (Exception e) {
            log.error("❌ Failed to send auto-completion notifications", e);
        }
    }

    /**
     * Send notification when seller marks order as shipped
     */
    public void sendShippedNotification(Long buyerId, String itemTitle, String deliveryAddress) {
        log.info("Sending shipped notification to buyer: {}", buyerId);

        try {
            User buyer = userRepository.findById(buyerId)
                    .orElseThrow(() -> new NotFoundException("Buyer not found"));

            // 1. Send push notifications
            List<DeviceToken> tokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(buyerId);

            for (DeviceToken token : tokens) {
                try {
                    Message message = Message.builder()
                            .setToken(token.getDeviceToken())
                            .setNotification(Notification.builder()
                                    .setTitle("📦 Order Shipped!")
                                    .setBody("Your order for '" + itemTitle + "' is on its way")
                                    .build())
                            .putData("type", "order_shipped")
                            .putData("itemTitle", itemTitle)
                            .build();

                    firebaseMessaging.send(message);
                    token.setLastUsedAt(LocalDateTime.now());
                    deviceTokenRepository.save(token);

                } catch (FirebaseMessagingException e) {
                    handleFirebaseError(token, e);
                }
            }

            // 2. Send email notification
            String subject = "Order Shipped - " + itemTitle;
            String body = String.format("""
                Hello %s,
                
                Your order has been shipped!
                
                📦 Item: %s
                📍 Delivery Location: %s
                
                The seller has marked your order as shipped. You should receive it soon.
                
                Important: Once you receive the item, please confirm delivery in your dashboard.
                This will release the payment to the seller.

                If you don't receive the item or there's any issue, you can report a problem within 5 days.
                
                Track your order: %s/dashboard/purchases
                
                Best regards,
                The TradeLynk Team
                """,
                    buyer.getFullName(),
                    itemTitle,
                    deliveryAddress,
                    frontendUrl
            );

            emailService.sendEmail(buyer.getEmail(), subject, body);
            log.info("✅ Shipped email sent to buyer: {}", buyer.getEmail());

        } catch (Exception e) {
            log.error("❌ Failed to send shipped notification", e);
        }
    }

    /**
     * ✅ NEW: Send notification when seller receives payout.
     * Seller receives 100% — no platform fee deducted.
     */
    public void sendPayoutNotification(Long sellerId, Long amount, String itemTitle) {
        log.info("Sending payout notification to seller: {}", sellerId);

        try {
            User seller = userRepository.findById(sellerId)
                    .orElseThrow(() -> new NotFoundException("Seller not found"));

            String amountFormatted = String.format("₦%,d", amount);

            // 1. Send push notifications
            List<DeviceToken> tokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(sellerId);

            for (DeviceToken token : tokens) {
                try {
                    Message message = Message.builder()
                            .setToken(token.getDeviceToken())
                            .setNotification(Notification.builder()
                                    .setTitle("💸 Payment Released!")
                                    .setBody("You've received " + amountFormatted + " for '" + itemTitle + "'")
                                    .build())
                            .putData("type", "payout")
                            .putData("amount", String.valueOf(amount))
                            .putData("itemTitle", itemTitle)
                            .build();

                    firebaseMessaging.send(message);
                    token.setLastUsedAt(LocalDateTime.now());
                    deviceTokenRepository.save(token);

                } catch (FirebaseMessagingException e) {
                    handleFirebaseError(token, e);
                }
            }

            // 2. Send email notification — no platform fee deduction
            String subject = "Payment Received - " + itemTitle;
            String body = String.format("""
                Hello %s,
                
                Congratulations! Your payment has been released.
                
                📦 Item: %s
                ✅ Your Payout: %s
                
                The funds have been transferred to your registered bank account and should arrive within 1-2 business days.
                
                Thank you for selling on TradeLynk!
                
                View your earnings: %s/dashboard/sales
                
                Best regards,
                The TradeLynk Team
                """,
                    seller.getFullName(),
                    itemTitle,
                    amountFormatted,
                    frontendUrl
            );

            emailService.sendEmail(seller.getEmail(), subject, body);
            log.info("✅ Payout email sent to seller: {}", seller.getEmail());

        } catch (Exception e) {
            log.error("❌ Failed to send payout notification", e);
        }
    }

    /**
     * ✅ NEW: Send notification about refund
     */
    public void sendRefundNotification(Long buyerId, Long amount) {
        log.info("Sending refund notification to buyer: {}", buyerId);

        try {
            User buyer = userRepository.findById(buyerId)
                    .orElseThrow(() -> new NotFoundException("Buyer not found"));

            String amountFormatted = String.format("₦%,d", amount);

            // 1. Send push notifications
            List<DeviceToken> tokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(buyerId);

            for (DeviceToken token : tokens) {
                try {
                    Message message = Message.builder()
                            .setToken(token.getDeviceToken())
                            .setNotification(Notification.builder()
                                    .setTitle("💵 Refund Processed")
                                    .setBody("Your refund of " + amountFormatted + " has been processed")
                                    .build())
                            .putData("type", "refund")
                            .putData("amount", String.valueOf(amount))
                            .build();

                    firebaseMessaging.send(message);
                    token.setLastUsedAt(LocalDateTime.now());
                    deviceTokenRepository.save(token);

                } catch (FirebaseMessagingException e) {
                    handleFirebaseError(token, e);
                }
            }

            // 2. Send email notification
            String subject = "Refund Processed - " + amountFormatted;
            String body = String.format("""
                Hello %s,
                
                Your refund has been processed.
                
                💵 Refund Amount: %s
                
                The funds will be returned to your original payment method within 5-10 business days.
                
                If you have any questions, please contact our support team.
                
                Best regards,
                The TradeLynk Team
                """,
                    buyer.getFullName(),
                    amountFormatted
            );

            emailService.sendEmail(buyer.getEmail(), subject, body);
            log.info("✅ Refund email sent to buyer: {}", buyer.getEmail());

        } catch (Exception e) {
            log.error("❌ Failed to send refund notification", e);
        }
    }

    /**
     * ✅ NEW: Send notification when dispute is raised
     */
    public void sendDisputeNotification(Long sellerId, String itemTitle, String reason) {
        log.info("Sending dispute notification to seller: {}", sellerId);

        try {
            User seller = userRepository.findById(sellerId)
                    .orElseThrow(() -> new NotFoundException("Seller not found"));

            // 1. Send push notifications
            List<DeviceToken> tokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(sellerId);

            for (DeviceToken token : tokens) {
                try {
                    Message message = Message.builder()
                            .setToken(token.getDeviceToken())
                            .setNotification(Notification.builder()
                                    .setTitle("⚠️ Dispute Raised")
                                    .setBody("Buyer raised a dispute for '" + itemTitle + "'")
                                    .build())
                            .putData("type", "dispute")
                            .putData("itemTitle", itemTitle)
                            .putData("reason", reason)
                            .build();

                    firebaseMessaging.send(message);
                    token.setLastUsedAt(LocalDateTime.now());
                    deviceTokenRepository.save(token);

                } catch (FirebaseMessagingException e) {
                    handleFirebaseError(token, e);
                }
            }

            // 2. Send email notification
            String subject = "Dispute Raised - " + itemTitle;
            String body = String.format("""
                Hello %s,
                
                A buyer has raised a dispute for one of your orders.
                
                📦 Item: %s
                ⚠️ Reason: %s
                
                The payment is currently on hold while we review this dispute. Our team will investigate and reach out if we need more information.
                
                Please check your dashboard for details and be ready to provide any relevant information.
                
                View dispute details: %s/dashboard/sales
                
                Best regards,
                The TradeLynk Team
                """,
                    seller.getFullName(),
                    itemTitle,
                    reason,
                    frontendUrl
            );

            emailService.sendEmail(seller.getEmail(), subject, body);
            log.info("✅ Dispute email sent to seller: {}", seller.getEmail());

        } catch (Exception e) {
            log.error("❌ Failed to send dispute notification", e);
        }
    }

    /**
     * ✅ NEW: Send notification about dispute resolution
     */
    public void sendDisputeResolutionNotification(Long userId, String itemTitle, String resolution, String userRole) {
        log.info("Sending dispute resolution notification to {}: {}", userRole, userId);

        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new NotFoundException("User not found"));

            String title = "Dispute Resolved - " + itemTitle;
            String resultMessage;

            switch (resolution) {
                case "REFUND_BUYER":
                    resultMessage = userRole.equals("buyer") ?
                            "The dispute was resolved in your favor. You'll receive a full refund." :
                            "The dispute was resolved in the buyer's favor. The payment will be refunded.";
                    break;
                case "RELEASE_TO_SELLER":
                    resultMessage = userRole.equals("seller") ?
                            "The dispute was resolved in your favor. The payment will be released to you." :
                            "The dispute was resolved in the seller's favor. The payment will be released to them.";
                    break;
                default:
                    resultMessage = "The dispute has been closed.";
            }

            // 1. Send push notifications
            List<DeviceToken> tokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(userId);

            for (DeviceToken token : tokens) {
                try {
                    Message message = Message.builder()
                            .setToken(token.getDeviceToken())
                            .setNotification(Notification.builder()
                                    .setTitle("✅ Dispute Resolved")
                                    .setBody(resultMessage)
                                    .build())
                            .putData("type", "dispute_resolved")
                            .putData("itemTitle", itemTitle)
                            .putData("resolution", resolution)
                            .build();

                    firebaseMessaging.send(message);
                    token.setLastUsedAt(LocalDateTime.now());
                    deviceTokenRepository.save(token);

                } catch (FirebaseMessagingException e) {
                    handleFirebaseError(token, e);
                }
            }

            // 2. Send email notification
            String subject = "Dispute Resolved - " + itemTitle;
            String body = String.format("""
                Hello %s,
                
                The dispute for your order has been resolved.
                
                📦 Item: %s
                ✅ Resolution: %s
                
                %s
                
                If you have any questions about this decision, please contact our support team.
                
                View order details: %s/dashboard
                
                Best regards,
                The TradeLynk Team
                """,
                    user.getFullName(),
                    itemTitle,
                    resolution.replace("_", " "),
                    resultMessage,
                    frontendUrl
            );

            emailService.sendEmail(user.getEmail(), subject, body);
            log.info("✅ Dispute resolution email sent to {}: {}", userRole, user.getEmail());

        } catch (Exception e) {
            log.error("❌ Failed to send dispute resolution notification", e);
        }
    }
}