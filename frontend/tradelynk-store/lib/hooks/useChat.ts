"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { database } from "@/config/firebase";
import {
  ref,
  onChildAdded,
  onValue,
  set,
  remove,
  onChildChanged,
  DataSnapshot,
} from "firebase/database";
import {
  fetchMessages,
  sendMessage as apiSendMessage,
  markChatAsRead,
  Message,
} from "@/lib/services/chatService";

export const useChat = (chatId: string | null, currentUserId: number) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [lastMessageDate, setLastMessageDate] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const typingUnsubscribeRef = useRef<(() => void) | null>(null);

  // Fetch initial messages from API
  const loadMessages = useCallback(async () => {
    if (!chatId) return;

    try {
      setLoading(true);
      setError("");
      console.log("📥 Loading messages from API for chat:", chatId);
      const data = await fetchMessages(chatId, 0, 50);
      console.log("✅ Loaded messages from API:", data.length, "messages");
      setMessages(data.sort((a, b) => a.timestamp - b.timestamp));
    } catch (err: any) {
      setError(err.message || "Failed to load messages");
      console.error("❌ Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  // Setup real-time listener for new messages
  useEffect(() => {
    if (!chatId) return;

    loadMessages();

    // Listen for new messages from Firebase
    const messagesRef = ref(database, `chats/${chatId}/messages`);

    console.log("🔊 Setting up Firebase listener for chat:", chatId);

    const unsubscribe = onChildAdded(messagesRef, (snapshot: DataSnapshot) => {
      const messageData = snapshot.val();
      const messageId = snapshot.key;

      console.log("📨 Received message from Firebase:", messageId, messageData);

      // Check if message already exists (avoid duplicates)
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === messageId);
        if (exists) {
          console.log("⚠️ Message already exists, skipping:", messageId);
          return prev;
        }

        const newMessage: Message = {
          id: messageId || "",
          senderId: messageData.senderId,
          senderName: messageData.senderName,
          content: messageData.content,
          imageUrls: messageData.imageUrls || [],
          timestamp: messageData.timestamp,
          read: messageData.read || false,
          readAt: messageData.readAt,
        };

        console.log("✅ Adding new message to UI:", newMessage);
        return [...prev, newMessage];
      });
    });

    // Also listen for message updates (read status)
    const updateUnsubscribe = onChildChanged(
      messagesRef,
      (snapshot: DataSnapshot) => {
        const messageData = snapshot.val();
        const messageId = snapshot.key;

        console.log("🔄 Message updated:", messageId);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  read: messageData.read || false,
                  readAt: messageData.readAt,
                }
              : m
          )
        );
      }
    );

    unsubscribeRef.current = () => {
      console.log("🔇 Unsubscribing from Firebase listeners");
      unsubscribe();
      updateUnsubscribe();
    };

    // Mark chat as read
    markChatAsRead(chatId);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [chatId, loadMessages]);

  // Listen for typing indicator
  useEffect(() => {
    if (!chatId) return;

    const typingRef = ref(database, `chats/${chatId}/typing`);

    const unsubscribe = onValue(typingRef, (snapshot: DataSnapshot) => {
      const typing = snapshot.val();
      const otherUserTyping = typing
        ? Object.keys(typing).some((id) => id !== String(currentUserId))
        : false;
      setIsOtherUserTyping(otherUserTyping);
    });

    typingUnsubscribeRef.current = unsubscribe;

    return () => {
      if (typingUnsubscribeRef.current) {
        typingUnsubscribeRef.current();
      }
    };
  }, [chatId, currentUserId]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(() => {
    if (!chatId) return;

    const typingRef = ref(database, `chats/${chatId}/typing/${currentUserId}`);
    set(typingRef, true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Remove typing indicator after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      remove(typingRef);
    }, 3000);
  }, [chatId, currentUserId]);

  // Send message
  const sendMessage = useCallback(
    async (content: string, imageUrls: string[] = []) => {
      if (!chatId || !content.trim()) {
        console.log(
          "❌ Cannot send message - chatId:",
          chatId,
          "content:",
          content
        );
        return;
      }

      try {
        setSending(true);
        setError("");

        console.log("📤 Sending message via API:", {
          chatId,
          content,
          imageUrls: imageUrls.length,
        });

        await apiSendMessage(chatId, content, imageUrls);

        console.log(
          "✅ Message sent via API, waiting for Firebase listener..."
        );
        // Message will appear via Firebase listener
      } catch (err: any) {
        setError(err.message || "Failed to send message");
        console.error("❌ Error sending message:", err);
      } finally {
        setSending(false);
        // Remove typing indicator
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        const typingRef = ref(
          database,
          `chats/${chatId}/typing/${currentUserId}`
        );
        remove(typingRef);
      }
    },
    [chatId, currentUserId]
  );

  return {
    messages,
    loading,
    sending,
    error,
    isOtherUserTyping,
    sendMessage,
    sendTypingIndicator,
  };
};

/**
 * Hook for online status
 */
export const useOnlineStatus = (userId: number) => {
  useEffect(() => {
    const statusRef = ref(database, `users/${userId}/status`);

    // Set online
    set(statusRef, {
      online: true,
      lastSeen: Date.now(),
    });

    // Set offline on unmount
    return () => {
      set(statusRef, {
        online: false,
        lastSeen: Date.now(),
      });
    };
  }, [userId]);
};

/**
 * Hook to listen for user online status
 */
export const useUserOnlineStatus = (userId: number) => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<number | null>(null);

  useEffect(() => {
    const statusRef = ref(database, `users/${userId}/status`);

    const unsubscribe = onValue(statusRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        setIsOnline(data.online || false);
        setLastSeen(data.lastSeen || null);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  return { isOnline, lastSeen };
};
