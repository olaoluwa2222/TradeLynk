"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams, useRouter } from "next/navigation";
import ChatList from "@/components/chat/ChatList";
import ConversationView from "@/components/chat/ConversationView";
import ItemSidebar from "@/components/chat/ItemSidebar";
import { fetchChats, Chat } from "@/lib/services/chatService";
import { useOnlineStatus } from "@/lib/hooks/useChat";

export default function ChatPage() {
  const { user, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobileViewChat, setIsMobileViewChat] = useState(false);
  const [isMobileViewItem, setIsMobileViewItem] = useState(false);

  // Set online status
  useOnlineStatus(user?.userId || 0);

  // Load chats on mount
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const loadChats = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchChats();

        // ✅ TRANSFORM: Normalize chatId to id
        const normalizedChats = data.map((chat) => ({
          ...chat,
          id: chat.chatId || chat.id, // Use chatId if exists, fallback to id
        }));

        setChats(normalizedChats);

        console.log("✅ Chats loaded:", normalizedChats.length, "chats");

        // Check if chatId is provided in URL params
        const chatIdParam = searchParams.get("chatId");
        if (chatIdParam) {
          console.log("📌 Found chatId in URL:", chatIdParam);
          setSelectedChatId(chatIdParam);
          setIsMobileViewChat(true);
        } else if (normalizedChats.length > 0 && !selectedChatId) {
          console.log("📌 No chatId param, selecting first chat");
          setSelectedChatId(normalizedChats[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load chats");
        console.error("Error loading chats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [isAuthenticated, user]);

  // Handle URL changes separately
  useEffect(() => {
    const chatIdParam = searchParams.get("chatId");
    if (chatIdParam && chatIdParam !== selectedChatId) {
      console.log("🔄 URL changed, updating selected chat:", chatIdParam);
      setSelectedChatId(chatIdParam);
      setIsMobileViewChat(true);
    }
  }, [searchParams]);

  // Refetch if chat not found (newly created chat)
  useEffect(() => {
    if (!isAuthenticated || !selectedChatId || loading) return;

    const found = chats.find((c) => c.id === selectedChatId);
    if (found) {
      return;
    }

    console.log("🔄 Chat not found, refetching in 1 second...", selectedChatId);
    const timer = setTimeout(async () => {
      try {
        const data = await fetchChats();
        const normalizedChats = data.map((chat) => ({
          ...chat,
          id: chat.chatId || chat.id,
        }));
        setChats(normalizedChats);
        console.log(
          "✅ Chats refetched, total:",
          normalizedChats.length,
          "chats"
        );
      } catch (err) {
        console.error("Error refetching chats:", err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, selectedChatId, chats, loading]);

  // Early return for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            💬 Sign in to chat
          </h1>
          <p className="text-gray-600 mb-8">
            You need to be logged in to access messages
          </p>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const selectedChat = chats.find((c) => c.id === selectedChatId);
  const isWaitingForNewChat = selectedChatId && !selectedChat;

  // Create a placeholder chat object when waiting for new chat
  const chatToDisplay =
    selectedChat ||
    (isWaitingForNewChat
      ? {
          id: selectedChatId,
          itemId: 0,
          itemTitle: "Loading...",
          buyerId: 0,
          buyerName: "Loading...",
          sellerId: 0,
          sellerName: "Loading...",
          createdAt: Date.now(),
          lastMessageAt: Date.now(),
          lastMessage: "",
          unreadCount: 0,
          isFromCurrentUser: false,
        }
      : null);

  console.log("📋 ChatPage state:", {
    totalChats: chats.length,
    selectedChatId,
    selectedChat: selectedChat
      ? { id: selectedChat.id, itemTitle: selectedChat.itemTitle }
      : null,
    loading,
    isWaitingForNewChat,
  });

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">💬 Messages</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Chat List */}
        {!isMobileViewChat && !isMobileViewItem && (
          <div className="w-full md:w-1/4 lg:w-1/4 border-r border-gray-200 bg-white overflow-y-auto">
            <ChatList
              chats={chats}
              selectedChatId={selectedChatId}
              onSelectChat={(chat) => {
                console.log("📌 Selecting chat:", chat);
                if (!chat || !chat.id) {
                  console.error("❌ Invalid chat object:", chat);
                  return;
                }
                setSelectedChatId(chat.id);
                setIsMobileViewChat(true);
                router.push(`/chat?chatId=${chat.id}`, { scroll: false });
              }}
              loading={loading}
              error={error}
            />
          </div>
        )}

        {/* Center - Conversation View */}
        {(isMobileViewChat || !isMobileViewItem) && (
          <div className="hidden md:flex md:w-1/2 lg:w-1/2 flex-col border-r border-gray-200">
            {chatToDisplay ? (
              <ConversationView
                chat={chatToDisplay}
                currentUserId={user?.userId || 0}
                onBackClick={() => setIsMobileViewChat(false)}
                onViewItem={() => setIsMobileViewItem(true)}
              />
            ) : isWaitingForNewChat ? (
              <div className="flex-1 flex items-center justify-center bg-white">
                <div className="text-center">
                  <div className="animate-spin h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading chat...</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-gray-600">
                    Select a conversation to start
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile: Full conversation view */}
        {isMobileViewChat && (
          <div className="w-full md:hidden flex flex-col">
            {chatToDisplay ? (
              <ConversationView
                chat={chatToDisplay}
                currentUserId={user?.userId || 0}
                onBackClick={() => setIsMobileViewChat(false)}
                onViewItem={() => setIsMobileViewItem(true)}
              />
            ) : null}
          </div>
        )}

        {/* Right Sidebar - Item Details */}
        {(isMobileViewItem || !isMobileViewItem) && (
          <div className="hidden lg:block lg:w-1/4 border-l border-gray-200 bg-white overflow-y-auto">
            {chatToDisplay ? (
              <ItemSidebar
                chat={chatToDisplay}
                onClose={() => setIsMobileViewItem(false)}
              />
            ) : (
              <div className="p-6 text-center text-gray-500">
                <p>No item selected</p>
              </div>
            )}
          </div>
        )}

        {/* Mobile: Full item view */}
        {isMobileViewItem && (
          <div className="w-full md:hidden flex flex-col border-l border-gray-200">
            {chatToDisplay ? (
              <ItemSidebar
                chat={chatToDisplay}
                onClose={() => setIsMobileViewItem(false)}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
