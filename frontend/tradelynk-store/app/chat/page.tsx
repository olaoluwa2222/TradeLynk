"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import ChatList from "@/components/chat/ChatList";
import ConversationView from "@/components/chat/ConversationView";
import ItemSidebar from "@/components/chat/ItemSidebar";
import { fetchChats, Chat } from "@/lib/services/chatService";
import { initializeFCM, cleanupFCM } from "@/lib/services/fcmService";
import { useOnlineStatus } from "@/lib/hooks/useChat";

export default function ChatPage() {
  const { user, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobileViewChat, setIsMobileViewChat] = useState(false);
  const [isMobileViewItem, setIsMobileViewItem] = useState(false);

  // Set online status - always called (unconditionally)
  useOnlineStatus(user?.userId || 0);

  // Load chats on mount
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const loadChats = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchChats();
        setChats(data);

        console.log("✅ Chats loaded:", data.length, "chats");
        console.log("🔍 Looking for chatId in URL params...");

        // Check if chatId is provided in URL params
        const chatIdParam = searchParams.get("chatId");
        if (chatIdParam) {
          console.log("📌 Found chatId in URL:", chatIdParam);
          // Try to find the chat in the list
          const foundChat = data.find((c) => c.id === chatIdParam);
          if (foundChat) {
            console.log("✅ Chat found in list, selecting it");
            setSelectedChatId(chatIdParam);
            setIsMobileViewChat(true);
          } else {
            console.warn(
              "⚠️ Chat not found in list, it might still be loading from server"
            );
            // Still set it - it might load in the next refresh
            setSelectedChatId(chatIdParam);
            setIsMobileViewChat(true);
          }
        } else if (data.length > 0 && !selectedChatId) {
          console.log("📌 No chatId param, selecting first chat");
          // Select first chat if available and no chatId param
          setSelectedChatId(data[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load chats");
        console.error("Error loading chats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadChats();

    // Initialize FCM
    const token = localStorage.getItem("token");
    if (token) {
      initializeFCM(token, (payload) => {
        // Reload chats when new message arrives
        loadChats();
      });
    }
  }, [isAuthenticated, user, searchParams]);

  // Cleanup FCM on logout
  useEffect(() => {
    return () => {
      if (isAuthenticated && user) {
        const token = localStorage.getItem("token");
        if (token) {
          cleanupFCM(token);
        }
      }
    };
  }, [isAuthenticated, user]);

  // If chatId is in URL but chat not found in list yet (newly created chat),
  // refetch after a short delay
  useEffect(() => {
    if (!isAuthenticated || !selectedChatId) return;

    // Find the selected chat
    const found = chats.find((c) => c.id === selectedChatId);
    if (found || loading) {
      return;
    }

    console.log("🔄 Chat not found, refetching in 1 second...", selectedChatId);
    const timer = setTimeout(async () => {
      try {
        const data = await fetchChats();
        setChats(data);
        console.log("✅ Chats refetched, total:", data.length, "chats");
      } catch (err) {
        console.error("Error refetching chats:", err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, selectedChatId, chats, loading]);

  // Helper variables - computed after all hooks
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
              onSelectChat={(chatId) => {
                setSelectedChatId(chatId);
                setIsMobileViewChat(true);
              }}
              loading={loading}
              error={error}
            />
          </div>
        )}

        {/* Center - Conversation View */}
        {(isMobileViewChat || !isMobileViewChat) && (
          <div className="hidden md:flex md:w-1/2 lg:w-1/2 flex-col border-r border-gray-200">
            {selectedChat ? (
              <ConversationView
                chat={selectedChat}
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
            {selectedChat ? (
              <ConversationView
                chat={selectedChat}
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
            {selectedChat ? (
              <ItemSidebar
                chat={selectedChat}
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
            {selectedChat ? (
              <ItemSidebar
                chat={selectedChat}
                onClose={() => setIsMobileViewItem(false)}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
