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
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const typingUnsubscribeRef = useRef<(() => void) | null>(null);
  const syncCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const lastSyncTimeRef = useRef<number>(0);

  // Fetch initial messages from API
  const loadMessages = useCallback(async () => {
    if (!chatId) {
      console.warn("⚠️ loadMessages called but chatId is null/undefined");
      return;
    }

    try {
      setLoading(true);
      setError("");
      console.log("📥 [useChat] Loading messages from API for chat:", chatId);
      console.log(
        "📥 [useChat] Chat ID type:",
        typeof chatId,
        "value:",
        chatId
      );

      const data = await fetchMessages(chatId, 0, 50);

      // Normalize messages from API: ensure every message has an `id`.
      const normalized = data.map((m, idx) => ({
        ...m,
        id: m.id || (m as any).messageId || `api-msg-${m.timestamp}-${idx}`,
      }));

      console.log("✅ [useChat] API Response:", {
        messageCount: normalized.length,
        messages: normalized.map((m) => ({
          id: m.id,
          content: m.content.substring(0, 30),
          senderId: m.senderId,
          timestamp: m.timestamp,
        })),
      });

      setMessages(normalized.sort((a, b) => a.timestamp - b.timestamp));
    } catch (err: any) {
      console.error("❌ [useChat] Error loading messages:", err);
      console.error("❌ [useChat] Error details:", err.message, err.stack);
      setError(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  // Setup real-time listener for new messages
  useEffect(() => {
    if (!chatId) {
      console.warn("⚠️ [useChat] useEffect skipped - chatId is null/undefined");
      return;
    }

    console.log("🔧 [useChat] Setting up chat for chatId:", chatId);
    console.log("🔧 [useChat] Current userId:", currentUserId);

    // Load initial messages
    loadMessages();

    // Listen for new messages from Firebase
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const firebasePath = `chats/${chatId}/messages`;

    console.log(
      "🔊 [useChat] Setting up Firebase listener at path:",
      firebasePath
    );

    // Check if Firebase is connected
    const connectedRef = ref(database, ".info/connected");
    const connectedUnsubscribe = onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val();
      console.log(
        "🔌 [useChat] Firebase connection status:",
        connected ? "CONNECTED" : "DISCONNECTED"
      );

      // If reconnected after being disconnected, reload messages
      if (connected) {
        console.log(
          "🔄 [useChat] Firebase reconnected, checking for new messages"
        );
      }
    });

    const unsubscribe = onChildAdded(messagesRef, (snapshot: DataSnapshot) => {
      const messageData = snapshot.val();
      const messageId = snapshot.key;

      console.log("📨 [useChat] Firebase message received:", {
        messageId,
        path: firebasePath,
        data: messageData,
        exists: snapshot.exists(),
      });

      if (!snapshot.exists() || !messageData) {
        console.warn(
          "⚠️ [useChat] Snapshot doesn't exist or has no data:",
          messageId
        );
        return;
      }

      // Ensure senderId, senderName, content exist
      if (
        !messageData.senderId ||
        !messageData.senderName ||
        !messageData.content
      ) {
        console.warn(
          "⚠️ [useChat] Message missing required fields:",
          messageId,
          messageData
        );
        return;
      }

      // Check if message already exists (avoid duplicates)
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === messageId);
        if (exists) {
          console.log(
            "⚠️ [useChat] Message already exists, skipping:",
            messageId
          );
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

        console.log("✅ [useChat] Adding new message to UI:", {
          id: newMessage.id,
          content: newMessage.content.substring(0, 30),
          senderId: newMessage.senderId,
          currentCount: prev.length,
          newCount: prev.length + 1,
        });

        return [...prev, newMessage];
      });
    });

    // Also listen for message updates (read status)
    const updateUnsubscribe = onChildChanged(
      messagesRef,
      (snapshot: DataSnapshot) => {
        const messageData = snapshot.val();
        const messageId = snapshot.key;

        console.log("🔄 [useChat] Message updated:", messageId);

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
      console.log(
        "🔇 [useChat] Unsubscribing from Firebase listeners for chat:",
        chatId
      );
      unsubscribe();
      updateUnsubscribe();
      connectedUnsubscribe();
    };

    // Mark chat as read
    console.log("📖 [useChat] Marking chat as read:", chatId);
    markChatAsRead(chatId);

    // Periodic sync check to catch any missed messages (fallback mechanism)
    const syncCheckInterval = setInterval(async () => {
      console.log("🔄 [useChat] Periodic sync check triggered");
      try {
        const latestMessages = await fetchMessages(chatId, 0, 50); // ✅ Increased to 50

        setMessages((prevMessages) => {
          // ✅ FIX: Create a Set of existing message IDs for fast lookup
          const existingIds = new Set(
            prevMessages
              .map((m) => m.id)
              .filter((id) => id !== undefined && id !== null)
          );

          // ✅ FIX: Only add messages that don't exist AND have valid IDs
          const newMessages = latestMessages.filter((apiMsg) => {
            // Skip messages without valid IDs
            if (!apiMsg.id || apiMsg.id === null || apiMsg.id === undefined) {
              console.warn(
                "⚠️ [useChat] Skipping message without valid ID:",
                apiMsg
              );
              return false;
            }

            // Only include if not already in our state
            return !existingIds.has(apiMsg.id);
          });

          if (newMessages.length === 0) {
            console.log("✅ [useChat] All messages up to date, no sync needed");
            return prevMessages;
          }

          console.log(
            `✅ [useChat] Added ${newMessages.length} missed messages from sync check`,
            newMessages.map((m) => ({
              id: m.id,
              content: m.content.substring(0, 20),
            }))
          );

          // ✅ Merge and sort by timestamp
          const merged = [...prevMessages, ...newMessages];
          const sorted = merged.sort((a, b) => {
            const timeA = a.timestamp || 0;
            const timeB = b.timestamp || 0;
            return timeA - timeB;
          });

          return sorted;
        });
      } catch (err) {
        console.warn("⚠️ [useChat] Sync check failed:", err);
      }
    }, 5000); // Check every 5 seconds

    syncCheckIntervalRef.current = syncCheckInterval;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (syncCheckIntervalRef.current) {
        clearInterval(syncCheckIntervalRef.current);
      }
    };
  }, [chatId, loadMessages, currentUserId]);

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
    async (content: string, imageUrls: string[] = []): Promise<boolean> => {
      if (!chatId) {
        console.error(
          "❌ [useChat] Cannot send message - chatId is null/undefined"
        );
        return false;
      }

      if (!content.trim()) {
        console.warn("⚠️ [useChat] Cannot send empty message");
        return false;
      }

      try {
        setSending(true);
        setError("");

        console.log("📤 [useChat] Sending message via API:", {
          chatId,
          contentLength: content.length,
          imageCount: imageUrls.length,
          currentUserId,
        });

        const result = await apiSendMessage(chatId, content, imageUrls);

        console.log("✅ [useChat] Message sent via API, result:", result);
        console.log(
          "⏳ [useChat] Waiting for Firebase listener to receive message..."
        );

        return true;
      } catch (err: any) {
        console.error("❌ [useChat] Error sending message:", err);
        console.error("❌ [useChat] Error details:", err.message, err.stack);
        setError(err.message || "Failed to send message");
        return false;
      } finally {
        setSending(false);
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
    if (!userId) return;

    const statusRef = ref(database, `users/${userId}/status`);

    console.log("🟢 [useOnlineStatus] Setting user online:", userId);

    // Set online
    set(statusRef, {
      online: true,
      lastSeen: Date.now(),
    });

    // Set offline on unmount
    return () => {
      console.log("🔴 [useOnlineStatus] Setting user offline:", userId);
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
    if (!userId) return;

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
