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
  const {
    messages,
    loading,
    sending,
    error,
    isOtherUserTyping,
    sendMessage,
    sendTypingIndicator,
  } = useChat(chat.id, currentUserId);
  const { isOnline, lastSeen } = useUserOnlineStatus(
    chat.sellerId === currentUserId ? chat.buyerId : chat.sellerId
  );

  console.log("🎯 ConversationView mounted/updated:", {
    chatId: chat.id,
    messagesCount: messages.length,
    loading,
    messages: messages.map((m) => ({
      id: m.id,
      content: m.content.substring(0, 20),
    })),
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
  ) => {
    if (!content.trim()) return;
    await sendMessage(content, imageUrls);
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
      key: message.id,
    });

    return acc;
  }, [] as Array<{ type: string; date?: string; data?: any; key: string }>);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 flex-1">
          {/* Back Button (Mobile) */}
          <button
            onClick={onBackClick}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg
              className="w-6 h-6"
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
            <h3 className="font-semibold text-gray-900">{otherUserName}</h3>
            <p className="text-sm text-gray-600">
              {otherUserRole}: {chat.itemTitle}
            </p>
            <p
              className={`text-xs font-medium ${
                isOnline ? "text-green-600" : "text-gray-500"
              }`}
            >
              {isOnline ? "🟢 Active now" : "🔘 Away"}
            </p>
          </div>
        </div>

        {/* Menu Button */}
        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
          ⋮
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : messagesByDate.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">👋</div>
              <p className="text-gray-600">Start the conversation!</p>
              <p className="text-sm text-gray-500 mt-2">
                Say hello to {otherUserName}
              </p>
            </div>
          </div>
        ) : (
          <>
            {messagesByDate.map((item) => {
              if (item.type === "divider") {
                return (
                  <div key={item.key} className="flex items-center gap-4 my-4">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {item.date}
                    </span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                );
              }

              const message = item.data;
              const isOwnMessage = message.senderId === currentUserId;

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
              <div className="flex items-start gap-2 mb-4">
                <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-tl-none px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-100"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-200"></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
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
