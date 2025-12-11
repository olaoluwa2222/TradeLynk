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
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showItemSidebar, setShowItemSidebar] = useState(false); // ✅ NEW: Control right sidebar
  const [isMobile, setIsMobile] = useState(false); // ✅ NEW: Track screen size

  // ✅ Set online status (only when user is available)
  useOnlineStatus(user?.userId || 0);

  // ✅ NEW: Detect screen size for responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Service worker message listener
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      console.log("📨 [ChatPage] Received service worker message:", event.data);

      if (event.data?.type === "NAVIGATE_TO_CHAT" && event.data?.chatId) {
        const targetChatId = event.data.chatId;
        console.log(`🔗 [ChatPage] Navigating to chat: ${targetChatId}`);

        const targetChat = chats.find(
          (c) => c.chatId === targetChatId || c.id === targetChatId
        );

        if (targetChat) {
          setSelectedChatId(targetChat.id);
          router.push(`/chat?chatId=${targetChat.id}`, { scroll: false });
          console.log("✅ [ChatPage] Chat selected:", targetChatId);
        } else {
          console.warn("⚠️ [ChatPage] Chat not found, refetching chats...");
          loadChatsData();
        }
      }
    };

    if ("serviceWorker" in navigator && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener(
        "message",
        handleServiceWorkerMessage
      );
      console.log("✅ [ChatPage] Service worker message listener registered");
    }

    return () => {
      if ("serviceWorker" in navigator && navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener(
          "message",
          handleServiceWorkerMessage
        );
      }
    };
  }, [chats, isAuthenticated, user, router]);

  // Load chats function
  const loadChatsData = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchChats();

      // Normalize chatId to id
      const normalizedChats = data.map((chat) => ({
        ...chat,
        id: chat.chatId || chat.id,
      }));

      setChats(normalizedChats);
      console.log("✅ Chats loaded:", normalizedChats.length, "chats");

      return normalizedChats;
    } catch (err: any) {
      setError(err.message || "Failed to load chats");
      console.error("Error loading chats:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Load chats on mount
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const initializeChats = async () => {
      const normalizedChats = await loadChatsData();

      // Check if chatId is provided in URL params
      const chatIdParam = searchParams.get("chatId");
      if (chatIdParam) {
        console.log("📌 Found chatId in URL:", chatIdParam);
        setSelectedChatId(chatIdParam);
      } else if (normalizedChats.length > 0 && !selectedChatId) {
        console.log("📌 No chatId param, selecting first chat");
        setSelectedChatId(normalizedChats[0].id);
      }
    };

    initializeChats();
  }, [isAuthenticated, user]);

  // Handle URL changes
  useEffect(() => {
    const chatIdParam = searchParams.get("chatId");
    if (chatIdParam && chatIdParam !== selectedChatId) {
      console.log("🔄 URL changed, updating selected chat:", chatIdParam);
      setSelectedChatId(chatIdParam);
    }
  }, [searchParams]);

  // Refetch if chat not found
  useEffect(() => {
    if (!isAuthenticated || !selectedChatId || loading) return;

    const found = chats.find((c) => c.id === selectedChatId);
    if (found) return;

    console.log("🔄 Chat not found, refetching in 1 second...", selectedChatId);
    const timer = setTimeout(() => loadChatsData(), 1000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, selectedChatId, chats, loading]);

  // ✅ CRITICAL: Wait for both auth and user to be ready
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
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

  // Placeholder for loading chat
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

  // ✅ NEW: Handle chat selection with responsive behavior
  const handleSelectChat = (chat: Chat) => {
    console.log("📌 Selecting chat:", chat);
    if (!chat || !chat.id) {
      console.error("❌ Invalid chat object:", chat);
      return;
    }
    setSelectedChatId(chat.id);
    router.push(`/chat?chatId=${chat.id}`, { scroll: false });
  };

  // ✅ NEW: Handle back click
  const handleBackClick = () => {
    setSelectedChatId(null);
    router.push("/chat", { scroll: false });
  };

  console.log("📋 ChatPage state:", {
    totalChats: chats.length,
    selectedChatId,
    selectedChat: selectedChat
      ? { id: selectedChat.id, itemTitle: selectedChat.itemTitle }
      : null,
    loading,
    isWaitingForNewChat,
    userId: user?.userId,
    isMobile,
    showItemSidebar,
  });

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">💬 Messages</h1>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* ✅ LEFT SIDEBAR - Chat List (Always visible on desktop) */}
        <div
          className={`
            ${isMobile && selectedChatId ? "hidden" : "block"}
            w-full md:w-96 border-r border-gray-200 bg-white overflow-y-auto
          `}
        >
          <ChatList
            chats={chats}
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            loading={loading}
            error={error}
          />
        </div>

        {/* ✅ CENTER - Conversation View */}
        <div
          className={`
            ${isMobile && !selectedChatId ? "hidden" : "flex-1"}
            ${
              !selectedChatId && !isMobile
                ? "flex items-center justify-center"
                : ""
            }
            bg-white border-r border-gray-200
          `}
        >
          {chatToDisplay && user ? (
            <ConversationView
              chat={chatToDisplay}
              currentUserId={user.userId} // ✅ GUARANTEED to be a number
              onBackClick={handleBackClick}
              onViewItem={() => setShowItemSidebar(!showItemSidebar)}
            />
          ) : isWaitingForNewChat ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading chat...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-gray-600 text-lg font-semibold">
                  Select a conversation to start
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Choose from your chats on the left
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ✅ RIGHT SIDEBAR - Item Details (Desktop only, toggleable) */}
        {showItemSidebar && chatToDisplay && (
          <div
            className={`
              ${isMobile ? "absolute inset-0 z-50" : "w-80"}
              border-l border-gray-200 bg-white overflow-y-auto
            `}
          >
            <ItemSidebar
              chat={chatToDisplay}
              onClose={() => setShowItemSidebar(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
