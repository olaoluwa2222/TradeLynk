package com.codewithola.tradelynkapi.services;


import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.exception.NotFoundException;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import com.google.firebase.messaging.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final UserRepository userRepository;
    private final EmailService emailService;

    /**
     * Send push notification for new message
     * Note: Requires user's FCM device token to be stored in database
     */
    public void sendMessageNotification(Long recipientId, Long senderId, String senderName, String messageContent) {
        log.info("Sending message notification to user: {}", recipientId);

        try {
            User recipient = userRepository.findById(recipientId).orElse(null);
            if (recipient == null) {
                log.warn("Recipient user not found: {}", recipientId);
                return;
            }

            // TODO: Get user's FCM device token from database
            // For now, log the notification
            String deviceToken = getUserDeviceToken(recipientId);

            if (deviceToken == null || deviceToken.isEmpty()) {
                log.warn("No device token found for user: {}", recipientId);
                // Fallback to email notification
                sendEmailNotification(recipient.getEmail(),
                        "New Message from " + senderName,
                        messageContent);
                return;
            }

            // Build notification
            Notification notification = Notification.builder()
                    .setTitle("New Message from " + senderName)
                    .setBody(truncateMessage(messageContent, 100))
                    .build();

            // Build data payload
            Map<String, String> data = new HashMap<>();
            data.put("type", "NEW_MESSAGE");
            data.put("senderId", String.valueOf(senderId));
            data.put("senderName", senderName);
            data.put("messageContent", messageContent);

            // Build message
            Message message = Message.builder()
                    .setToken(deviceToken)
                    .setNotification(notification)
                    .putAllData(data)
                    .build();

            // Send via FCM
            String response = FirebaseMessaging.getInstance().send(message);
            log.info("Message notification sent successfully: {}", response);

        } catch (Exception e) {
            log.error("Error sending message notification", e);
        }
    }

    /**
     * Send push notification for payment received
     */
    public void sendPaymentNotification(Long sellerId, Long amount, String itemTitle) {
        log.info("Sending payment notification to seller: {}", sellerId);

        try {
            User seller = userRepository.findById(sellerId).orElse(null);
            if (seller == null) {
                log.warn("Seller user not found: {}", sellerId);
                return;
            }

            String deviceToken = getUserDeviceToken(sellerId);

            if (deviceToken == null || deviceToken.isEmpty()) {
                log.warn("No device token found for seller: {}", sellerId);
                // Fallback to email notification
                sendEmailNotification(seller.getEmail(),
                        "Payment Received!",
                        String.format("You received ₦%.2f for %s", amount / 100.0, itemTitle));
                return;
            }

            // Build notification
            Notification notification = Notification.builder()
                    .setTitle("Payment Received!")
                    .setBody(String.format("You received ₦%.2f for %s", amount / 100.0, itemTitle))
                    .build();

            // Build data payload
            Map<String, String> data = new HashMap<>();
            data.put("type", "PAYMENT_RECEIVED");
            data.put("amount", String.valueOf(amount));
            data.put("itemTitle", itemTitle);

            // Build message
            Message message = Message.builder()
                    .setToken(deviceToken)
                    .setNotification(notification)
                    .putAllData(data)
                    .setAndroidConfig(AndroidConfig.builder()
                            .setPriority(AndroidConfig.Priority.HIGH)
                            .build())
                    .setApnsConfig(ApnsConfig.builder()
                            .setAps(Aps.builder()
                                    .setSound("default")
                                    .build())
                            .build())
                    .build();

            // Send via FCM
            String response = FirebaseMessaging.getInstance().send(message);
            log.info("Payment notification sent successfully: {}", response);

        } catch (Exception e) {
            log.error("Error sending payment notification", e);
        }
    }

    /**
     * Send notification for order status update
     */
    public void sendOrderStatusNotification(Long buyerId, String status, String itemTitle) {
        log.info("Sending order status notification to buyer: {}", buyerId);

        try {
            User buyer = userRepository.findById(buyerId).orElse(null);
            if (buyer == null) {
                return;
            }

            String deviceToken = getUserDeviceToken(buyerId);

            if (deviceToken == null || deviceToken.isEmpty()) {
                log.warn("No device token found for buyer: {}", buyerId);
                return;
            }

            String title = "Order Update";
            String body = String.format("Your order for %s is now %s", itemTitle, status);

            Notification notification = Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build();

            Map<String, String> data = new HashMap<>();
            data.put("type", "ORDER_STATUS");
            data.put("status", status);
            data.put("itemTitle", itemTitle);

            Message message = Message.builder()
                    .setToken(deviceToken)
                    .setNotification(notification)
                    .putAllData(data)
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            log.info("Order status notification sent successfully: {}", response);

        } catch (Exception e) {
            log.error("Error sending order status notification", e);
        }
    }

    /**
     * Send email notification (fallback when push notification fails)
     */
    private void sendEmailNotification(String recipientEmail, String subject, String body) {
        log.info("Sending email notification to: {}", recipientEmail);

        log.info("Email: To={}, Subject={}, Body={}", recipientEmail, subject, body);

        try {
            emailService.sendEmail(recipientEmail, subject, body);
        } catch (Exception e) {
            log.error("Failed to send notification email to {}", recipientEmail, e);
        }

        /*
         * SendGrid Integration Example:
         *
         * SendGrid sg = new SendGrid(SENDGRID_API_KEY);
         * Email from = new Email("noreply@marketplace.com");
         * Email to = new Email(recipientEmail);
         * Content content = new Content("text/plain", body);
         * Mail mail = new Mail(from, subject, to, content);
         *
         * Request request = new Request();
         * request.setMethod(Method.POST);
         * request.setEndpoint("mail/send");
         * request.setBody(mail.build());
         * Response response = sg.api(request);
         */
    }

    /**
     * Get user's FCM device token from database
     * TODO: Add fcm_token field to users table
     */
    private String getUserDeviceToken(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        return user != null ? user.getFcmToken() : null;
    }

    /**
     * Save user's FCM device token to database
     */
    public void saveDeviceToken(Long userId, String deviceToken) {
        log.info("Saving FCM device token for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        user.setFcmToken(deviceToken);
        userRepository.save(user);

        log.info("✅ Device token saved for user {}", userId);
    }

    private String truncateMessage(String message, int maxLength) {
        if (message == null) {
            return "";
        }

        if (message.length() <= maxLength) {
            return message;
        }

        return message.substring(0, maxLength) + "...";
    }
}
