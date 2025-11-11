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

        String messageId = chatService.sendMessage(
                request.getChatId(),
                userPrincipal.getId(),
                request.getContent(),
                request.getImageUrls()
        );

        // TODO: Send push notification to recipient
        // notificationService.sendMessageNotification(recipientId, senderId, senderName, content);

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

        if (deviceToken == null || deviceToken.isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Device token is required");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        notificationService.saveDeviceToken(userPrincipal.getId(), deviceToken);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Device token saved successfully");

        return ResponseEntity.ok(response);
    }
}
