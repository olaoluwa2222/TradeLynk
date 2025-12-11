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
  onDisconnect,
  DataSnapshot,
  goOffline,
  goOnline,
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
  const [isConnected, setIsConnected] = useState(false); // ✅ Track connection status
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const typingUnsubscribeRef = useRef<(() => void) | null>(null);
  const hasLoadedInitialRef = useRef(false);
  const lastMessageTimestampRef = useRef<number>(0);
  const reconnectAttemptRef = useRef<number>(0);
  const connectionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Force Firebase to go online and monitor connection
  useEffect(() => {
    console.log("🔌 [useChat] Forcing Firebase online...");

    try {
      goOnline(database);
      console.log("✅ [useChat] Firebase goOnline() called");
    } catch (err) {
      console.error("❌ [useChat] Error calling goOnline():", err);
    }

    // Monitor connection status continuously
    const connectedRef = ref(database, ".info/connected");
    const unsubscribe = onValue(
      connectedRef,
      (snapshot) => {
        const connected = snapshot.val() === true;
        setIsConnected(connected);

        console.log(
          connected
            ? "✅ [useChat] Firebase CONNECTED"
            : "❌ [useChat] Firebase DISCONNECTED"
        );

        if (connected) {
          reconnectAttemptRef.current = 0;
          console.log("🎉 [useChat] Firebase connection established!");
        } else {
          console.warn("⚠️ [useChat] Firebase connection lost!");

          // Attempt to reconnect
          reconnectAttemptRef.current += 1;
          if (reconnectAttemptRef.current <= 5) {
            console.log(
              `🔄 [useChat] Reconnection attempt ${reconnectAttemptRef.current}/5...`
            );
            setTimeout(() => {
              try {
                goOnline(database);
              } catch (err) {
                console.error("❌ [useChat] Reconnection failed:", err);
              }
            }, 2000 * reconnectAttemptRef.current);
          }
        }
      },
      (error) => {
        console.error("❌ [useChat] Connection monitoring error:", error);
      }
    );

    // Periodic connection check
    connectionCheckIntervalRef.current = setInterval(() => {
      if (!isConnected) {
        console.log(
          "🔍 [useChat] Periodic connection check - attempting to reconnect..."
        );
        try {
          goOnline(database);
        } catch (err) {
          console.error("❌ [useChat] Periodic reconnect failed:", err);
        }
      }
    }, 10000); // Check every 10 seconds

    return () => {
      unsubscribe();
      if (connectionCheckIntervalRef.current) {
        clearInterval(connectionCheckIntervalRef.current);
      }
    };
  }, []);

  // Fetch initial messages from API
  const loadMessages = useCallback(async () => {
    if (!chatId) {
      console.warn("⚠️ loadMessages called but chatId is null/undefined");
      return;
    }

    if (hasLoadedInitialRef.current) {
      console.log(
        "✅ [useChat] Initial messages already loaded, skipping API call"
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      console.log(
        "📥 [useChat] Loading initial messages from API for chat:",
        chatId
      );

      const data = await fetchMessages(chatId, 0, 50);

      const normalized = data.map((m, idx) => ({
        ...m,
        id: m.id || (m as any).messageId || `api-msg-${m.timestamp}-${idx}`,
      }));

      console.log("✅ [useChat] API Response:", {
        messageCount: normalized.length,
        firstMessage: normalized[0]
          ? {
              id: normalized[0].id,
              content: normalized[0].content.substring(0, 30),
              timestamp: normalized[0].timestamp,
            }
          : null,
        lastMessage: normalized[normalized.length - 1]
          ? {
              id: normalized[normalized.length - 1].id,
              content: normalized[normalized.length - 1].content.substring(
                0,
                30
              ),
              timestamp: normalized[normalized.length - 1].timestamp,
            }
          : null,
      });

      const sortedMessages = normalized.sort(
        (a, b) => a.timestamp - b.timestamp
      );
      setMessages(sortedMessages);

      if (sortedMessages.length > 0) {
        lastMessageTimestampRef.current =
          sortedMessages[sortedMessages.length - 1].timestamp;
        console.log(
          "📌 [useChat] Last message timestamp:",
          lastMessageTimestampRef.current
        );
      }

      hasLoadedInitialRef.current = true;
    } catch (err: any) {
      console.error("❌ [useChat] Error loading messages:", err);
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
    console.log("🔌 [useChat] Firebase connected:", isConnected);

    // Reset refs when chatId changes
    hasLoadedInitialRef.current = false;
    lastMessageTimestampRef.current = 0;

    // Load initial messages
    loadMessages();

    // ✅ Wait for Firebase connection AND initial load
    const setupListener = setTimeout(() => {
      if (!isConnected) {
        console.warn(
          "⚠️ [useChat] Cannot setup listener - Firebase not connected"
        );
        return;
      }

      const messagesRef = ref(database, `chats/${chatId}/messages`);
      const firebasePath = `chats/${chatId}/messages`;

      console.log(
        "🔊 [useChat] Setting up Firebase listener at path:",
        firebasePath
      );

      // ✅ Use onChildAdded for real-time updates (only NEW messages)
      const unsubscribe = onChildAdded(
        messagesRef,
        (snapshot: DataSnapshot) => {
          const messageData = snapshot.val();
          const messageId = snapshot.key;

          console.log("📨 [useChat] Firebase onChildAdded triggered:", {
            messageId,
            exists: snapshot.exists(),
            timestamp: messageData?.timestamp,
            lastLoadedTimestamp: lastMessageTimestampRef.current,
          });

          if (!snapshot.exists() || !messageData) {
            console.warn(
              "⚠️ [useChat] Snapshot doesn't exist or has no data:",
              messageId
            );
            return;
          }

          // Validate required fields
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

          // ✅ Only process messages NEWER than what we loaded from API
          if (messageData.timestamp <= lastMessageTimestampRef.current) {
            console.log(
              "⏭️ [useChat] Skipping old message (already loaded from API):",
              {
                messageId,
                messageTimestamp: messageData.timestamp,
                lastLoaded: lastMessageTimestampRef.current,
              }
            );
            return;
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

          console.log("✅ [useChat] Adding NEW message from Firebase:", {
            id: newMessage.id,
            content: newMessage.content.substring(0, 30),
            senderId: newMessage.senderId,
            timestamp: newMessage.timestamp,
          });

          setMessages((prev) => {
            // Check for duplicates
            const exists = prev.some((m) => m.id === messageId);
            if (exists) {
              console.warn(
                "⚠️ [useChat] Message already exists, skipping:",
                messageId
              );
              return prev;
            }

            const updated = [...prev, newMessage].sort(
              (a, b) => a.timestamp - b.timestamp
            );

            // Update last timestamp
            lastMessageTimestampRef.current = newMessage.timestamp;

            console.log("📊 [useChat] Messages updated:", {
              previousCount: prev.length,
              newCount: updated.length,
              newMessageId: messageId,
            });

            return updated;
          });
        },
        (error) => {
          console.error("❌ [useChat] Firebase onChildAdded error:", error);
        }
      );

      // Listen for message updates (read status)
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
        },
        (error) => {
          console.error("❌ [useChat] Firebase onChildChanged error:", error);
        }
      );

      unsubscribeRef.current = () => {
        console.log(
          "🔇 [useChat] Unsubscribing from Firebase listeners for chat:",
          chatId
        );
        unsubscribe();
        updateUnsubscribe();
      };

      // Mark chat as read
      console.log("📖 [useChat] Marking chat as read:", chatId);
      markChatAsRead(chatId);
    }, 1000); // ✅ Wait 1 second for API load + connection

    return () => {
      clearTimeout(setupListener);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      hasLoadedInitialRef.current = false;
      lastMessageTimestampRef.current = 0;
    };
  }, [chatId, loadMessages, currentUserId, isConnected]); // ✅ Re-run when connection changes

  // Listen for typing indicator
  useEffect(() => {
    if (!chatId || !isConnected) return;

    const typingRef = ref(database, `chats/${chatId}/typing`);

    const unsubscribe = onValue(
      typingRef,
      (snapshot: DataSnapshot) => {
        const typing = snapshot.val();
        const otherUserTyping = typing
          ? Object.keys(typing).some((id) => id !== String(currentUserId))
          : false;
        setIsOtherUserTyping(otherUserTyping);
      },
      (error) => {
        console.error("❌ [useChat] Typing indicator error:", error);
      }
    );

    typingUnsubscribeRef.current = unsubscribe;

    return () => {
      if (typingUnsubscribeRef.current) {
        typingUnsubscribeRef.current();
      }
    };
  }, [chatId, currentUserId, isConnected]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(() => {
    if (!chatId || !isConnected) return;

    const typingRef = ref(database, `chats/${chatId}/typing/${currentUserId}`);
    set(typingRef, true).catch((err) => {
      console.error("❌ [useChat] Error setting typing indicator:", err);
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      remove(typingRef).catch((err) => {
        console.error("❌ [useChat] Error removing typing indicator:", err);
      });
    }, 3000);
  }, [chatId, currentUserId, isConnected]);

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
          firebaseConnected: isConnected,
        });

        const result = await apiSendMessage(chatId, content, imageUrls);

        console.log("✅ [useChat] Message sent via API, result:", result);

        if (!isConnected) {
          console.warn(
            "⚠️ [useChat] Message sent but Firebase is disconnected - may not appear in real-time"
          );
        }

        return true;
      } catch (err: any) {
        console.error("❌ [useChat] Error sending message:", err);
        setError(err.message || "Failed to send message");
        return false;
      } finally {
        setSending(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        if (isConnected) {
          const typingRef = ref(
            database,
            `chats/${chatId}/typing/${currentUserId}`
          );
          remove(typingRef).catch((err) => {
            console.error("❌ [useChat] Error removing typing indicator:", err);
          });
        }
      }
    },
    [chatId, currentUserId, isConnected]
  );

  return {
    messages,
    loading,
    sending,
    error,
    isOtherUserTyping,
    sendMessage,
    sendTypingIndicator,
    isConnected, // ✅ Expose connection status
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

    const statusData = {
      online: true,
      lastSeen: Date.now(),
    };

    set(statusRef, statusData).catch((err) => {
      console.error("❌ [useOnlineStatus] Error setting online status:", err);
    });

    // Set offline on disconnect
    onDisconnect(statusRef).set({
      online: false,
      lastSeen: Date.now(),
    });

    return () => {
      console.log("🔴 [useOnlineStatus] Setting user offline:", userId);
      set(statusRef, {
        online: false,
        lastSeen: Date.now(),
      }).catch((err) => {
        console.error(
          "❌ [useOnlineStatus] Error setting offline status:",
          err
        );
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

    const unsubscribe = onValue(
      statusRef,
      (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        if (data) {
          setIsOnline(data.online || false);
          setLastSeen(data.lastSeen || null);
        }
      },
      (error) => {
        console.error("❌ [useUserOnlineStatus] Error:", error);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { isOnline, lastSeen };
};
