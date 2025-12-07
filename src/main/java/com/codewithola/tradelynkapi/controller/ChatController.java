package com.codewithola.tradelynkapi.controller;

import com.codewithola.tradelynkapi.dtos.requests.CreateChatRequest;
import com.codewithola.tradelynkapi.dtos.requests.SendMessageRequest;
import com.codewithola.tradelynkapi.dtos.response.ChatDTO;
import com.codewithola.tradelynkapi.dtos.response.CreateChatResponse;
import com.codewithola.tradelynkapi.dtos.response.MessageDTO;
import com.codewithola.tradelynkapi.dtos.response.SendMessageResponse;
import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.ChatService;
import com.codewithola.tradelynkapi.services.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chats")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;
    private final NotificationService notificationService;

    /**
     * POST /api/chats
     * Create a new chat (authenticated)
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createChat(
            @Valid @RequestBody CreateChatRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("POST /api/chats - User: {} creating chat for item: {}",
                userPrincipal.getEmail(), request.getItemId());

        String chatId = chatService.createChat(
                request.getItemId(),
                userPrincipal.getId(),
                request.getSellerId()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Chat created successfully");
        response.put("data", CreateChatResponse.builder()
                .chatId(chatId)
                .message("You can now start messaging")
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/chats
     * Get all user's chats (authenticated)
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getUserChats(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/chats - User: {} fetching chats", userPrincipal.getEmail());

        List<ChatDTO> chats = chatService.getUserChats(userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", chats);
        response.put("count", chats.size());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/chats/{chatId}
     * Get chat details (useful for item sidebar)
     */
    @GetMapping("/{chatId}")
    public ResponseEntity<Map<String, Object>> getChatDetails(
            @PathVariable String chatId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/chats/{} - User: {}", chatId, userPrincipal.getEmail());

        ChatDTO chat = chatService.getChatDetails(chatId, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", chat);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/chats/{chatId}/messages
     * Get messages for a chat (authenticated)
     */
    @GetMapping("/{chatId}/messages")
    public ResponseEntity<Map<String, Object>> getChatMessages(
            @PathVariable String chatId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/chats/{}/messages - User: {}", chatId, userPrincipal.getEmail());

        List<MessageDTO> messages = chatService.getChatMessages(chatId, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", messages);
        response.put("count", messages.size());

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/chats/messages
     * Send a message in a chat (authenticated)
     */
    @PostMapping("/messages")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("POST /api/chats/messages - User: {} sending message in chat: {}",
                userPrincipal.getEmail(), request.getChatId());

        // Get messageId and recipientId from service
        Map<String, Object> result = chatService.sendMessage(
                request.getChatId(),
                userPrincipal.getId(),
                request.getContent(),
                request.getImageUrls()
        );

        String messageId = (String) result.get("messageId");
        Long recipientId = (Long) result.get("recipientId");
        String senderName = (String) result.get("senderName");

        // ✅ FIX: Send push notification with correct parameters (5 total)
        try {
            notificationService.sendMessageNotification(
                    recipientId,              // Who receives the notification
                    userPrincipal.getId(),    // ✅ ADDED: Who sent the message (actual sender ID)
                    senderName,               // Sender's name
                    request.getContent(),     // Message content
                    request.getChatId()       // Chat ID for navigation
            );

            log.info("✅ Push notification sent to user: {} from sender: {} for chat: {}",
                    recipientId, userPrincipal.getId(), request.getChatId());

        } catch (Exception e) {
            log.error("❌ Failed to send push notification: {}", e.getMessage());
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Message sent successfully");
        response.put("data", SendMessageResponse.builder()
                .messageId(messageId)
                .timestamp(System.currentTimeMillis())
                .message("Message delivered")
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * PUT /api/chats/{chatId}/mark-read
     * Mark all messages in chat as read (CRITICAL)
     */
    @PutMapping("/{chatId}/mark-read")
    public ResponseEntity<Map<String, Object>> markChatAsRead(
            @PathVariable String chatId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("PUT /api/chats/{}/mark-read - User: {}", chatId, userPrincipal.getEmail());

        chatService.markChatAsRead(chatId, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Chat marked as read");

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/chats/unread-count
     * Get total unread message count (CRITICAL)
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/chats/unread-count - User: {}", userPrincipal.getEmail());

        int unreadCount = chatService.getUnreadCount(userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("unreadCount", unreadCount);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/chats/by-item/{itemId}
     * Check if chat exists for item
     */
    @GetMapping("/by-item/{itemId}")
    public ResponseEntity<Map<String, Object>> getChatByItem(
            @PathVariable Long itemId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/chats/by-item/{} - User: {}", itemId, userPrincipal.getEmail());

        String chatId = chatService.findChatByItem(itemId, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);

        if (chatId != null) {
            response.put("exists", true);
            response.put("chatId", chatId);
            response.put("message", "Chat already exists");
        } else {
            response.put("exists", false);
            response.put("chatId", null);
            response.put("message", "No chat found for this item");
        }

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/chats/upload-image
     * Upload image for chat
     */
    @PostMapping("/upload-image")
    public ResponseEntity<Map<String, Object>> uploadChatImage(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("POST /api/chats/upload-image - User: {}, File: {}",
                userPrincipal.getEmail(), file.getOriginalFilename());

        // Validate file
        if (file.isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "File is required");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Only image files are allowed");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        // Validate file size (max 5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "File size must be less than 5MB");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        String imageUrl = chatService.uploadChatImage(file, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("imageUrl", imageUrl);
        response.put("message", "Image uploaded successfully");

        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/chats/{chatId}
     * Delete a chat
     */
    @DeleteMapping("/{chatId}")
    public ResponseEntity<Map<String, Object>> deleteChat(
            @PathVariable String chatId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("DELETE /api/chats/{} - User: {}", chatId, userPrincipal.getEmail());

        chatService.deleteChat(chatId, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Chat deleted successfully");

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/chats/device-token
     * Save user's FCM device token (authenticated)
     */
    @PostMapping("/device-token")
    public ResponseEntity<Map<String, Object>> saveDeviceToken(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("POST /api/chats/device-token - User: {} saving device token",
                userPrincipal.getEmail());

        String deviceToken = request.get("deviceToken");
        String deviceType = request.getOrDefault("deviceType", "web");
        String deviceName = request.get("deviceName");

        if (deviceToken == null || deviceToken.isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Device token is required");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        notificationService.saveDeviceToken(
                userPrincipal.getId(),
                deviceToken,
                deviceType,
                deviceName
        );

        long activeDevices = notificationService.getActiveDeviceCount(userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Device token saved successfully");
        response.put("activeDevices", activeDevices);

        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/chats/device-token
     * Remove user's FCM device token (on logout)
     */
    @DeleteMapping("/device-token")
    public ResponseEntity<Map<String, Object>> removeDeviceToken(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("DELETE /api/chats/device-token - User: {} removing device token",
                userPrincipal.getEmail());

        String deviceToken = request.get("deviceToken");

        if (deviceToken != null && !deviceToken.isEmpty()) {
            notificationService.removeDeviceToken(deviceToken);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Device token removed successfully");

        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/chats/device-tokens/all
     * Remove all device tokens for user (logout from all devices)
     */
    @DeleteMapping("/device-tokens/all")
    public ResponseEntity<Map<String, Object>> removeAllDeviceTokens(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("DELETE /api/chats/device-tokens/all - User: {} logging out from all devices",
                userPrincipal.getEmail());

        notificationService.removeAllDeviceTokens(userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Logged out from all devices");

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/chats/device-tokens
     * Get active device count
     */
    @GetMapping("/device-tokens")
    public ResponseEntity<Map<String, Object>> getDeviceTokens(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        long activeDevices = notificationService.getActiveDeviceCount(userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("activeDevices", activeDevices);

        return ResponseEntity.ok(response);
    }
}