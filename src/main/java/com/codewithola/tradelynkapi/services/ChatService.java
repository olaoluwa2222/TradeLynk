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
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final FirebaseDatabase firebaseDatabase;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final ImageService imageService; // ✅ Fixed: Changed from CloudinaryService

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
            // Save to Firebase
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
     * Returns a map with messageId, recipientId, and senderName
     */
    public Map<String, Object> sendMessage(String chatId, Long senderId, String content, List<String> imageUrls) {
        log.info("Sending message in chat: {} from user: {}", chatId, senderId);

        // Validate sender exists
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new NotFoundException("Sender not found"));

        // Get chat details to find recipient
        CompletableFuture<Long> recipientFuture = new CompletableFuture<>();

        firebaseDatabase.getReference("chats")
                .child(chatId)
                .addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot snapshot) {
                        if (snapshot.exists()) {
                            Long buyerId = snapshot.child("buyerId").getValue(Long.class);
                            Long sellerId = snapshot.child("sellerId").getValue(Long.class);

                            // Determine recipient
                            Long recipientId = senderId.equals(buyerId) ? sellerId : buyerId;
                            recipientFuture.complete(recipientId);
                        } else {
                            recipientFuture.completeExceptionally(new NotFoundException("Chat not found"));
                        }
                    }

                    @Override
                    public void onCancelled(DatabaseError error) {
                        recipientFuture.completeExceptionally(new RuntimeException(error.getMessage()));
                    }
                });

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

        CompletableFuture<Void> saveFuture = new CompletableFuture<>();

        messageRef.setValueAsync(messageData).addListener(() -> {
            // Update lastMessageAt and lastMessage in chat
            Map<String, Object> updates = new HashMap<>();
            updates.put("lastMessageAt", System.currentTimeMillis());
            updates.put("lastMessage", content);

            firebaseDatabase.getReference("chats")
                    .child(chatId)
                    .updateChildrenAsync(updates);

            saveFuture.complete(null);
            log.info("Message sent successfully: {}", messageId);
        }, Runnable::run);

        try {
            saveFuture.get(); // Wait for message to be saved
            Long recipientId = recipientFuture.get(); // Get recipient ID

            // Return messageId, recipientId, and senderName
            Map<String, Object> result = new HashMap<>();
            result.put("messageId", messageId);
            result.put("recipientId", recipientId);
            result.put("senderName", sender.getName());

            return result;

        } catch (InterruptedException | ExecutionException e) {
            log.error("Error sending message", e);
            throw new RuntimeException("Failed to send message");
        }
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
     * ✅ Verifies user has access to this chat
     */
    /**
     * Get messages for a chat
     * ✅ FIXED: Now includes readAt field
     */
    public List<MessageDTO> getChatMessages(String chatId, Long userId) {
        log.info("Fetching messages for chat: {}", chatId);

        // ✅ Verify user has access to this chat
        CompletableFuture<Boolean> accessFuture = new CompletableFuture<>();

        firebaseDatabase.getReference("chats")
                .child(chatId)
                .addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot snapshot) {
                        if (!snapshot.exists()) {
                            accessFuture.completeExceptionally(
                                    new NotFoundException("Chat not found")
                            );
                            return;
                        }

                        Long buyerId = snapshot.child("buyerId").getValue(Long.class);
                        Long sellerId = snapshot.child("sellerId").getValue(Long.class);

                        // Check if user is part of this chat
                        if (!userId.equals(buyerId) && !userId.equals(sellerId)) {
                            accessFuture.completeExceptionally(
                                    new BadRequestException("You don't have access to this chat")
                            );
                        } else {
                            accessFuture.complete(true);
                        }
                    }

                    @Override
                    public void onCancelled(DatabaseError error) {
                        accessFuture.completeExceptionally(new RuntimeException(error.getMessage()));
                    }
                });

        try {
            accessFuture.get(5, TimeUnit.SECONDS); // Wait for access check
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Error verifying chat access", e);
            throw new BadRequestException("You don't have access to this chat");
        }

        // If access verified, fetch messages
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
                    String messageId = messageSnapshot.getKey(); // ✅ Get Firebase key as ID

                    // ✅ Get imageUrls as List
                    List<String> imageUrls = new ArrayList<>();
                    DataSnapshot imageUrlsSnapshot = messageSnapshot.child("imageUrls");
                    if (imageUrlsSnapshot.exists()) {
                        for (DataSnapshot urlSnapshot : imageUrlsSnapshot.getChildren()) {
                            String url = urlSnapshot.getValue(String.class);
                            if (url != null) {
                                imageUrls.add(url);
                            }
                        }
                    }

                    MessageDTO message = MessageDTO.builder()
                            .messageId(messageId) // ✅ This will be serialized as "id"
                            .senderId(messageSnapshot.child("senderId").getValue(Long.class))
                            .senderName(messageSnapshot.child("senderName").getValue(String.class))
                            .content(messageSnapshot.child("content").getValue(String.class))
                            .imageUrls(imageUrls) // ✅ Add imageUrls
                            .timestamp(messageSnapshot.child("timestamp").getValue(Long.class))
                            .read(messageSnapshot.child("read").getValue(Boolean.class))
                            .readAt(messageSnapshot.child("readAt").getValue(Long.class)) // ✅ Add readAt
                            .build();

                    messages.add(message);

                    log.debug("✅ Loaded message: id={}, senderId={}, content={}",
                            messageId, message.getSenderId(),
                            message.getContent() != null ? message.getContent().substring(0, Math.min(20, message.getContent().length())) : "null");
                }

                log.info("✅ Loaded {} messages for chat: {}", messages.size(), chatId);
                future.complete(messages);
            }

            @Override
            public void onCancelled(DatabaseError error) {
                log.error("❌ Error fetching messages: {}", error.getMessage());
                future.completeExceptionally(new RuntimeException(error.getMessage()));
            }
        });

        try {
            return future.get();
        } catch (InterruptedException | ExecutionException e) {
            log.error("❌ Error getting chat messages", e);
            throw new RuntimeException("Failed to fetch messages");
        }
    }

    /**
     * Mark all messages in chat as read
     */
    public void markChatAsRead(String chatId, Long userId) {
        log.info("Marking chat {} as read for user: {}", chatId, userId);

        DatabaseReference messagesRef = firebaseDatabase.getReference("chats")
                .child(chatId)
                .child("messages");

        CompletableFuture<Void> future = new CompletableFuture<>();

        messagesRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot snapshot) {
                Map<String, Object> updates = new HashMap<>();

                for (DataSnapshot messageSnapshot : snapshot.getChildren()) {
                    Long senderId = messageSnapshot.child("senderId").getValue(Long.class);
                    Boolean read = messageSnapshot.child("read").getValue(Boolean.class);

                    // Mark as read if message is from other user and not already read
                    if (senderId != null && !senderId.equals(userId) &&
                            (read == null || !read)) {
                        updates.put(messageSnapshot.getKey() + "/read", true);
                        updates.put(messageSnapshot.getKey() + "/readAt", System.currentTimeMillis());
                    }
                }

                if (!updates.isEmpty()) {
                    messagesRef.updateChildrenAsync(updates).addListener(() -> {
                        log.info("Marked {} messages as read in chat: {}", updates.size() / 2, chatId);
                        future.complete(null);
                    }, Runnable::run);
                } else {
                    log.info("No unread messages in chat: {}", chatId);
                    future.complete(null);
                }
            }

            @Override
            public void onCancelled(DatabaseError error) {
                log.error("Error marking chat as read: {}", error.getMessage());
                future.completeExceptionally(new RuntimeException(error.getMessage()));
            }
        });

        try {
            future.get(10, TimeUnit.SECONDS);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Error waiting for mark as read", e);
            throw new RuntimeException("Failed to mark chat as read");
        }
    }

    /**
     * Get unread message count for user
     */
    public int getUnreadCount(Long userId) {
        log.info("Getting unread count for user: {}", userId);

        CompletableFuture<Integer> future = new CompletableFuture<>();
        AtomicInteger unreadCount = new AtomicInteger(0);

        // Get user's chat IDs
        DatabaseReference userChatsRef = firebaseDatabase.getReference("userChats")
                .child(String.valueOf(userId));

        userChatsRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot snapshot) {
                if (!snapshot.exists()) {
                    future.complete(0);
                    return;
                }

                int totalChats = (int) snapshot.getChildrenCount();
                if (totalChats == 0) {
                    future.complete(0);
                    return;
                }

                AtomicInteger processedChats = new AtomicInteger(0);

                // Check each chat for unread messages
                for (DataSnapshot chatSnapshot : snapshot.getChildren()) {
                    String chatId = chatSnapshot.getKey();

                    firebaseDatabase.getReference("chats")
                            .child(chatId)
                            .child("messages")
                            .addListenerForSingleValueEvent(new ValueEventListener() {
                                @Override
                                public void onDataChange(DataSnapshot messagesSnapshot) {
                                    for (DataSnapshot messageSnapshot : messagesSnapshot.getChildren()) {
                                        Long senderId = messageSnapshot.child("senderId").getValue(Long.class);
                                        Boolean read = messageSnapshot.child("read").getValue(Boolean.class);

                                        // Count if message is from other user and not read
                                        if (senderId != null && !senderId.equals(userId) &&
                                                (read == null || !read)) {
                                            unreadCount.incrementAndGet();
                                        }
                                    }

                                    if (processedChats.incrementAndGet() == totalChats) {
                                        future.complete(unreadCount.get());
                                    }
                                }

                                @Override
                                public void onCancelled(DatabaseError error) {
                                    log.error("Error fetching chat messages: {}", error.getMessage());
                                    if (processedChats.incrementAndGet() == totalChats) {
                                        future.complete(unreadCount.get());
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
            return future.get(15, TimeUnit.SECONDS);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Error getting unread count", e);
            return 0; // Return 0 on error rather than failing
        }
    }

    /**
     * Find chat by item ID for current user
     */
    public String findChatByItem(Long itemId, Long userId) {
        log.info("Finding chat for item: {} and user: {}", itemId, userId);

        // Get item to determine seller
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found"));

        Long sellerId = item.getSeller().getId();

        // Determine if user is buyer or seller
        if (userId.equals(sellerId)) {
            // User is the seller, can't have chat with themselves
            return null;
        }

        Long buyerId = userId;

        // Generate expected chat ID
        String expectedChatId = generateChatId(itemId, buyerId, sellerId);

        CompletableFuture<String> future = new CompletableFuture<>();

        // Check if chat exists
        firebaseDatabase.getReference("chats")
                .child(expectedChatId)
                .addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot snapshot) {
                        if (snapshot.exists()) {
                            future.complete(expectedChatId);
                        } else {
                            future.complete(null);
                        }
                    }

                    @Override
                    public void onCancelled(DatabaseError error) {
                        log.error("Error finding chat: {}", error.getMessage());
                        future.complete(null);
                    }
                });

        try {
            return future.get(5, TimeUnit.SECONDS);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Error finding chat by item", e);
            return null;
        }
    }

    /**
     * Upload chat image to Cloudinary
     * ✅ Fixed: Extract URL from Map returned by ImageService
     */
    public String uploadChatImage(MultipartFile file, Long userId) {
        log.info("Uploading chat image for user: {}", userId);

        try {
            // ImageService returns Map<String, String> with "url" and "publicId"
            Map<String, String> uploadResult = imageService.uploadImage(file);
            String imageUrl = uploadResult.get("url"); // ✅ Extract URL

            log.info("Chat image uploaded successfully: {}", imageUrl);
            return imageUrl;
        } catch (Exception e) {
            log.error("Error uploading chat image", e);
            throw new RuntimeException("Failed to upload image: " + e.getMessage());
        }
    }

    /**
     * Delete chat for user
     */
    public void deleteChat(String chatId, Long userId) {
        log.info("Deleting chat: {} for user: {}", chatId, userId);

        CompletableFuture<Void> future = new CompletableFuture<>();

        // Remove chat from user's chat list
        firebaseDatabase.getReference("userChats")
                .child(String.valueOf(userId))
                .child(chatId)
                .removeValueAsync()
                .addListener(() -> {
                    log.info("Chat {} removed from user {}'s list", chatId, userId);
                    future.complete(null);
                }, Runnable::run);

        try {
            future.get(5, TimeUnit.SECONDS);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Error deleting chat", e);
            throw new RuntimeException("Failed to delete chat");
        }
    }

    /**
     * Get chat details (for item sidebar)
     */
    public ChatDTO getChatDetails(String chatId, Long userId) {
        log.info("Getting chat details for: {}", chatId);

        CompletableFuture<ChatDTO> future = new CompletableFuture<>();

        firebaseDatabase.getReference("chats")
                .child(chatId)
                .addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot chatData) {
                        if (!chatData.exists()) {
                            future.completeExceptionally(new NotFoundException("Chat not found"));
                            return;
                        }

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

                        future.complete(chat);
                    }

                    @Override
                    public void onCancelled(DatabaseError error) {
                        log.error("Error fetching chat details: {}", error.getMessage());
                        future.completeExceptionally(new RuntimeException(error.getMessage()));
                    }
                });

        try {
            return future.get(5, TimeUnit.SECONDS);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Error getting chat details", e);
            throw new RuntimeException("Failed to fetch chat details");
        }
    }

    // Helper methods

    private String findExistingChat(Long itemId, Long buyerId, Long sellerId) {
        // Check if chat already exists with same IDs
        String expectedChatId = generateChatId(itemId, buyerId, sellerId);

        try {
            CompletableFuture<Boolean> future = new CompletableFuture<>();

            firebaseDatabase.getReference("chats")
                    .child(expectedChatId)
                    .addListenerForSingleValueEvent(new ValueEventListener() {
                        @Override
                        public void onDataChange(DataSnapshot snapshot) {
                            future.complete(snapshot.exists());
                        }

                        @Override
                        public void onCancelled(DatabaseError error) {
                            future.complete(false);
                        }
                    });

            Boolean exists = future.get(3, TimeUnit.SECONDS);
            return exists ? expectedChatId : null;

        } catch (Exception e) {
            log.error("Error checking existing chat", e);
            return null;
        }
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