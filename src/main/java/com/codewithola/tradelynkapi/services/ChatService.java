package com.codewithola.tradelynkapi.services;


import com.codewithola.tradelynkapi.dtos.response.ChatDTO;
import com.codewithola.tradelynkapi.dtos.response.MessageDTO;
import com.codewithola.tradelynkapi.entity.Item;
import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.exception.BadRequestException;
import com.codewithola.tradelynkapi.exception.NotFoundException;
import com.codewithola.tradelynkapi.repositories.ItemRepository;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import com.google.firebase.database.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final FirebaseDatabase firebaseDatabase;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;

    /**
     * Create a new chat between buyer and seller
     */
    public String createChat(Long itemId, Long buyerId, Long sellerId) {
        log.info("Creating chat for item: {}, buyer: {}, seller: {}", itemId, buyerId, sellerId);

        // Validate item exists
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found"));

        // Validate buyer exists
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new NotFoundException("Buyer not found"));

        // Validate seller exists
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new NotFoundException("Seller not found"));

        // Check if buyer is trying to chat with themselves
        if (buyerId.equals(sellerId)) {
            throw new BadRequestException("You cannot chat with yourself");
        }

        // Check if chat already exists
        String existingChatId = findExistingChat(itemId, buyerId, sellerId);
        if (existingChatId != null) {
            log.info("Chat already exists: {}", existingChatId);
            return existingChatId;
        }

        // Ensure seller is actually the owner of the item
        if (!item.getSeller().getId().equals(sellerId)) {
            throw new BadRequestException("This seller does not own the item");
        }

        // Generate unique chat ID
        String chatId = generateChatId(itemId, buyerId, sellerId);

        // Create chat data
        Map<String, Object> chatData = new HashMap<>();
        chatData.put("itemId", itemId);
        chatData.put("itemTitle", item.getTitle());
        chatData.put("itemImageUrl", getFirstImageUrl(item));
        chatData.put("buyerId", buyerId);
        chatData.put("buyerName", buyer.getName());
        chatData.put("sellerId", sellerId);
        chatData.put("sellerName", seller.getName());
        chatData.put("createdAt", System.currentTimeMillis());
        chatData.put("lastMessageAt", System.currentTimeMillis());
        chatData.put("lastMessage", "Chat created");

        try {
            // Save to Firebase - use get() directly on ApiFuture
            DatabaseReference chatRef = firebaseDatabase.getReference("chats").child(chatId);
            chatRef.setValueAsync(chatData).get(10, TimeUnit.SECONDS);

            log.info("Chat data saved to Firebase");

            // Add chat to buyer's chat list
            firebaseDatabase.getReference("userChats")
                    .child(String.valueOf(buyerId))
                    .child(chatId)
                    .setValueAsync(true)
                    .get(5, TimeUnit.SECONDS);

            log.info("Chat added to buyer's list");

            // Add chat to seller's chat list
            firebaseDatabase.getReference("userChats")
                    .child(String.valueOf(sellerId))
                    .child(chatId)
                    .setValueAsync(true)
                    .get(5, TimeUnit.SECONDS);

            log.info("Chat added to seller's list");
            log.info("Chat created successfully: {}", chatId);

        } catch (TimeoutException e) {
            log.error("Firebase operation timed out while creating chat", e);
            throw new RuntimeException("Failed to create chat: Operation timed out");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Thread interrupted while creating chat", e);
            throw new RuntimeException("Failed to create chat: Operation interrupted");
        } catch (ExecutionException e) {
            log.error("Error creating chat in Firebase", e);
            throw new RuntimeException("Failed to create chat: " + e.getMessage());
        }

        return chatId;
    }

    /**
     * Send a message in a chat
     */
    public String sendMessage(String chatId, Long senderId, String content, List<String> imageUrls) {
        log.info("Sending message in chat: {} from user: {}", chatId, senderId);

        // Validate sender exists
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new NotFoundException("Sender not found"));

        // Generate unique message ID
        String messageId = firebaseDatabase.getReference("chats")
                .child(chatId)
                .child("messages")
                .push()
                .getKey();

        // Create message data
        Map<String, Object> messageData = new HashMap<>();
        messageData.put("senderId", senderId);
        messageData.put("senderName", sender.getName());
        messageData.put("content", content);
        messageData.put("imageUrls", imageUrls != null ? imageUrls : new ArrayList<>());
        messageData.put("timestamp", System.currentTimeMillis());
        messageData.put("read", false);

        // Save message to Firebase
        DatabaseReference messageRef = firebaseDatabase.getReference("chats")
                .child(chatId)
                .child("messages")
                .child(messageId);

        CompletableFuture<Void> future = new CompletableFuture<>();

        messageRef.setValueAsync(messageData).addListener(() -> {
            // Update lastMessageAt and lastMessage in chat
            Map<String, Object> updates = new HashMap<>();
            updates.put("lastMessageAt", System.currentTimeMillis());
            updates.put("lastMessage", content);

            firebaseDatabase.getReference("chats")
                    .child(chatId)
                    .updateChildrenAsync(updates);

            future.complete(null);
            log.info("Message sent successfully: {}", messageId);
        }, Runnable::run);

        try {
            future.get(); // Wait for completion
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error sending message", e);
            throw new RuntimeException("Failed to send message");
        }

        return messageId;
    }

    /**
     * Get all chats for a user
     */
    public List<ChatDTO> getUserChats(Long userId) {
        log.info("Fetching chats for user: {}", userId);

        CompletableFuture<List<ChatDTO>> future = new CompletableFuture<>();
        List<ChatDTO> chats = new ArrayList<>();

        // Get user's chat IDs
        DatabaseReference userChatsRef = firebaseDatabase.getReference("userChats")
                .child(String.valueOf(userId));

        userChatsRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot snapshot) {
                if (!snapshot.exists()) {
                    future.complete(chats);
                    return;
                }

                int totalChats = (int) snapshot.getChildrenCount();
                if (totalChats == 0) {
                    future.complete(chats);
                    return;
                }

                final int[] fetchedChats = {0};

                // Fetch each chat's details
                for (DataSnapshot chatSnapshot : snapshot.getChildren()) {
                    String chatId = chatSnapshot.getKey();

                    firebaseDatabase.getReference("chats")
                            .child(chatId)
                            .addListenerForSingleValueEvent(new ValueEventListener() {
                                @Override
                                public void onDataChange(DataSnapshot chatData) {
                                    if (chatData.exists()) {
                                        ChatDTO chat = ChatDTO.builder()
                                                .chatId(chatId)
                                                .itemId(chatData.child("itemId").getValue(Long.class))
                                                .itemTitle(chatData.child("itemTitle").getValue(String.class))
                                                .itemImageUrl(chatData.child("itemImageUrl").getValue(String.class))
                                                .buyerId(chatData.child("buyerId").getValue(Long.class))
                                                .buyerName(chatData.child("buyerName").getValue(String.class))
                                                .sellerId(chatData.child("sellerId").getValue(Long.class))
                                                .sellerName(chatData.child("sellerName").getValue(String.class))
                                                .createdAt(chatData.child("createdAt").getValue(Long.class))
                                                .lastMessageAt(chatData.child("lastMessageAt").getValue(Long.class))
                                                .lastMessage(chatData.child("lastMessage").getValue(String.class))
                                                .build();

                                        chats.add(chat);
                                    }

                                    fetchedChats[0]++;
                                    if (fetchedChats[0] == totalChats) {
                                        // Sort by lastMessageAt (most recent first)
                                        chats.sort((a, b) ->
                                                Long.compare(b.getLastMessageAt(), a.getLastMessageAt()));
                                        future.complete(chats);
                                    }
                                }

                                @Override
                                public void onCancelled(DatabaseError error) {
                                    log.error("Error fetching chat: {}", error.getMessage());
                                    fetchedChats[0]++;
                                    if (fetchedChats[0] == totalChats) {
                                        future.complete(chats);
                                    }
                                }
                            });
                }
            }

            @Override
            public void onCancelled(DatabaseError error) {
                log.error("Error fetching user chats: {}", error.getMessage());
                future.completeExceptionally(new RuntimeException(error.getMessage()));
            }
        });

        try {
            return future.get();
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error getting user chats", e);
            throw new RuntimeException("Failed to fetch chats");
        }
    }

    /**
     * Get messages for a chat
     */
    public List<MessageDTO> getChatMessages(String chatId, Long userId) {
        log.info("Fetching messages for chat: {}", chatId);

        // TODO: Verify user has access to this chat

        CompletableFuture<List<MessageDTO>> future = new CompletableFuture<>();
        List<MessageDTO> messages = new ArrayList<>();

        Query messagesRef = firebaseDatabase.getReference("chats")
                .child(chatId)
                .child("messages")
                .orderByChild("timestamp");

        messagesRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot snapshot) {
                for (DataSnapshot messageSnapshot : snapshot.getChildren()) {
                    MessageDTO message = MessageDTO.builder()
                            .messageId(messageSnapshot.getKey())
                            .senderId(messageSnapshot.child("senderId").getValue(Long.class))
                            .senderName(messageSnapshot.child("senderName").getValue(String.class))
                            .content(messageSnapshot.child("content").getValue(String.class))
                            .timestamp(messageSnapshot.child("timestamp").getValue(Long.class))
                            .read(messageSnapshot.child("read").getValue(Boolean.class))
                            .build();

                    messages.add(message);
                }

                future.complete(messages);
            }

            @Override
            public void onCancelled(DatabaseError error) {
                log.error("Error fetching messages: {}", error.getMessage());
                future.completeExceptionally(new RuntimeException(error.getMessage()));
            }
        });

        try {
            return future.get();
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error getting chat messages", e);
            throw new RuntimeException("Failed to fetch messages");
        }
    }

    private String findExistingChat(Long itemId, Long buyerId, Long sellerId) {
        // TODO: Query Firebase to find existing chat
        // For now, return null (new chat will be created)
        return null;
    }

    private String generateChatId(Long itemId, Long buyerId, Long sellerId) {
        return "chat_" + itemId + "_" + buyerId + "_" + sellerId;
    }

    private String getFirstImageUrl(Item item) {
        try {
            if (item.getImageUrls() != null && !item.getImageUrls().isEmpty()) {
                // Parse JSON array and get first URL
                String imageUrls = item.getImageUrls();
                if (imageUrls.startsWith("[")) {
                    return imageUrls.substring(2, imageUrls.indexOf("\"", 2));
                }
            }
        } catch (Exception e) {
            log.error("Error parsing image URLs", e);
        }
        return null;
    }
}
