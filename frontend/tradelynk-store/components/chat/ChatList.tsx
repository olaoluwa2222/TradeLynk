"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Chat } from "@/lib/services/chatService";
import { formatRelativeTime } from "@/lib/utils/timeUtils";

interface ChatListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chat: Chat) => void;
  loading: boolean;
  error: string;
}

export default function ChatList({
  chats,
  selectedChatId,
  onSelectChat,
  loading,
  error,
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "buying" | "selling">(
    "all"
  );

  // Filter and search chats
  const filteredChats = useMemo(() => {
    return chats
      .filter((chat) => {
        // Filter by tab
        if (filterTab === "buying" && chat.buyerId === chat.sellerId)
          return true;
        if (filterTab === "selling" && chat.sellerId === chat.buyerId)
          return true;
        if (filterTab === "all") return true;
        return false;
      })
      .filter((chat) => {
        // Filter by search
        if (!searchQuery) return true;
        return (
          chat.itemTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          chat.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          chat.sellerName.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  }, [chats, searchQuery, filterTab]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="p-4 border-b border-gray-200">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-white p-4">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-2">⚠️ Error</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (filteredChats.length === 0 && !searchQuery) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="🔍 Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-gray-600 font-semibold mb-1">
              No conversations yet
            </p>
            <p className="text-sm text-gray-500">
              Start browsing items to chat with sellers
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <input
          type="text"
          placeholder="🔍 Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(["all", "buying", "selling"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterTab === tab
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat)} // Pass the entire chat object
            className={`w-full flex items-start gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
              selectedChatId === chat.id
                ? "bg-indigo-50 border-l-4 border-l-indigo-600"
                : ""
            }`}
          >
            {/* Item Image */}
            <div className="relative w-12 h-12 shrink-0 rounded bg-gray-100 overflow-hidden">
              <Image
                src={chat.itemImageUrl || "https://via.placeholder.com/48"}
                alt={chat.itemTitle}
                fill
                className="object-cover"
              />
            </div>

            {/* Chat Info */}
            <div className="flex-1 min-w-0 text-left">
              {/* Header Row */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-semibold text-gray-900 truncate ${
                    chat.unreadCount > 0 ? "font-bold" : ""
                  }`}
                >
                  {chat.buyerName === chat.sellerName
                    ? chat.itemTitle
                    : chat.buyerName === "You"
                    ? chat.sellerName
                    : chat.buyerName}
                </span>
                <span className="text-xs text-gray-500 ml-2 shrink-0">
                  {formatRelativeTime(chat.lastMessageAt)}
                </span>
              </div>

              {/* Item Title */}
              <p className="text-xs text-gray-500 truncate mb-1">
                {chat.itemTitle}
              </p>

              {/* Last Message */}
              <p className="text-sm text-gray-600 truncate">
                {chat.isFromCurrentUser && "You: "}
                {chat.lastMessage}
              </p>
            </div>

            {/* Unread Badge */}
            {chat.unreadCount > 0 && (
              <div className="shrink-0">
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                  {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
