"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Chat } from "@/lib/services/chatService";
import { useChat, useUserOnlineStatus } from "@/lib/hooks/useChat";
import {
  formatMessageTime,
  getDateDivider,
  isDifferentDay,
} from "@/lib/utils/timeUtils";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

interface ConversationViewProps {
  chat: Chat;
  currentUserId: number;
  onBackClick: () => void;
  onViewItem: () => void;
}

export default function ConversationView({
  chat,
  currentUserId,
  onBackClick,
  onViewItem,
}: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ FIX: Handle both chat.id and chat.chatId
  const effectiveChatId = chat?.chatId || chat?.id || null;

  if (!effectiveChatId) {
    console.error(
      "❌ CRITICAL ERROR: chatId is undefined!",
      "chat object:",
      chat
    );

    // Show error UI instead of crashing
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <p className="text-red-600 font-bold text-lg">⚠️ Chat Not Found</p>
          <p className="text-gray-600 mt-2">
            Unable to load chat. Please try again.
          </p>
          <button
            onClick={onBackClick}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  console.log(
    "🎯 ConversationView - using chatId:",
    effectiveChatId,
    "from chat object:",
    { chatId: chat.chatId, id: chat.id }
  );

  const {
    messages,
    loading,
    sending,
    error,
    isOtherUserTyping,
    sendMessage,
    sendTypingIndicator,
  } = useChat(effectiveChatId, currentUserId);

  // ✅ FIX: Add useUserOnlineStatus hook (THIS WAS MISSING!)
  const { isOnline, lastSeen } = useUserOnlineStatus(
    chat.sellerId === currentUserId ? chat.buyerId : chat.sellerId
  );

  // ✅ FIX: Filter out messages without valid IDs before rendering
  const validMessages = messages.filter((msg) => {
    const hasId = msg.id && msg.id !== undefined && msg.id !== null;
    const hasContent = msg.content && msg.content.trim() !== "";

    if (!hasId || !hasContent) {
      console.warn("⚠️ Filtering out invalid message:", {
        id: msg.id,
        hasContent,
      });
    }

    return hasId && hasContent;
  });

  console.log("🎯 ConversationView mounted/updated:", {
    chatId: effectiveChatId,
    totalMessages: messages.length,
    validMessages: validMessages.length,
    loading,
  });

  const otherUserId =
    chat.sellerId === currentUserId ? chat.buyerId : chat.sellerId;
  const otherUserName =
    chat.sellerId === currentUserId ? chat.buyerName : chat.sellerName;
  const userRole = chat.sellerId === currentUserId ? "Seller" : "Buyer";
  const otherUserRole = chat.sellerId === currentUserId ? "Buyer" : "Seller";

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (
    content: string,
    imageUrls: string[] = []
  ): Promise<boolean> => {
    if (!content.trim()) return false;
    return await sendMessage(content, imageUrls);
  };

  const handleInputChange = useCallback(() => {
    sendTypingIndicator();
  }, [sendTypingIndicator]);

  // Group messages by date
  const messagesByDate = messages.reduce((acc, message, index) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showDateDivider =
      !prevMessage || isDifferentDay(prevMessage.timestamp, message.timestamp);

    if (showDateDivider) {
      acc.push({
        type: "divider",
        date: getDateDivider(message.timestamp),
        key: `divider-${message.timestamp}`,
      });
    }

    acc.push({
      type: "message",
      data: message,
      // Some messages may not have an id from the API; fall back to timestamp+index
      key: message.id || `msg-${message.timestamp}-${index}`,
    });

    return acc;
  }, [] as Array<{ type: string; date?: string; data?: any; key: string }>);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-gray-300 bg-white shadow-sm">
        <div className="flex items-center gap-3 flex-1">
          {/* Back Button (Mobile) */}
          <button
            onClick={onBackClick}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Profile Info */}
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{otherUserName}</h3>
            <p className="text-sm font-medium text-gray-600">
              {otherUserRole} • {chat.itemTitle}
            </p>
            <p
              className={`text-xs font-semibold ${
                isOnline ? "text-green-600" : "text-gray-500"
              }`}
            >
              {isOnline ? "🟢 Active now" : "🔘 Away"}
            </p>
          </div>
        </div>

        {/* Menu Button */}
        <button className="p-2 hover:bg-gray-100 rounded-lg text-black transition-colors font-bold">
          ⋮
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-gray-200 border-t-black rounded-full mx-auto mb-4"></div>
              <p className="text-gray-700 text-sm font-medium">
                Loading messages...
              </p>
            </div>
          </div>
        ) : messagesByDate.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">👋</div>
              <p className="text-gray-800 font-semibold">
                Start the conversation!
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Say hello to {otherUserName}
              </p>
            </div>
          </div>
        ) : (
          <>
            // In the messagesByDate.map section, update the isOwnMessage logic:
            {messagesByDate.map((item) => {
              if (item.type === "divider") {
                return (
                  <div key={item.key} className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
                      {item.date}
                    </span>
                    <div className="flex-1 h-px bg-gray-300"></div>
                  </div>
                );
              }

              const message = item.data;

              // ✅ CRITICAL FIX: Ensure both are compared as numbers
              const messageSenderId = Number(message.senderId);
              const currentUserIdNumber = Number(currentUserId);
              const isOwnMessage = messageSenderId === currentUserIdNumber;

              console.log("🎨 [ConversationView] Rendering message:", {
                messageId: message.id,
                messageSenderId: messageSenderId,
                currentUserId: currentUserIdNumber,
                isOwnMessage: isOwnMessage,
                rawSenderId: message.senderId,
                rawCurrentUserId: currentUserId,
                types: `${typeof message.senderId} === ${typeof currentUserId}`,
              });

              return (
                <MessageBubble
                  key={item.key}
                  message={message}
                  isOwnMessage={isOwnMessage}
                />
              );
            })}
            {/* Typing Indicator */}
            {isOtherUserTyping && (
              <div className="flex items-start gap-2 mb-3">
                <div className="bg-white border-2 border-gray-300 text-gray-900 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce animation-delay-100"></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce animation-delay-200"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm font-medium">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Message Input */}
      <ChatInput
        onSend={handleSendMessage}
        onTyping={handleInputChange}
        sending={sending}
        disabled={loading}
      />
    </div>
  );
}
