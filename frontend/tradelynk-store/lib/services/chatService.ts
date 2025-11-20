import { chatsApi } from "@/lib/api";

export interface Chat {
  id: string;
  itemId: number;
  itemTitle: string;
  itemImageUrl?: string;
  buyerId: number;
  buyerName: string;
  sellerId: number;
  sellerName: string;
  createdAt: number;
  lastMessageAt: number;
  lastMessage: string;
  unreadCount: number;
  isFromCurrentUser: boolean;
}

export interface Message {
  id: string;
  senderId: number;
  senderName: string;
  content: string;
  imageUrls?: string[];
  timestamp: number;
  read: boolean;
  readAt?: number;
}

export interface ChatDetails extends Chat {
  messages: Message[];
}

/**
 * Get all chats for current user
 */
export const fetchChats = async (): Promise<Chat[]> => {
  try {
    const response = await chatsApi.getChats();
    if (response.success) {
      return response.data || [];
    }
    throw new Error(response.message || "Failed to fetch chats");
  } catch (error) {
    console.error("Error fetching chats:", error);
    throw error;
  }
};

/**
 * Get specific chat details
 */
export const fetchChatDetails = async (
  chatId: string
): Promise<ChatDetails> => {
  try {
    const response = await chatsApi.getChatDetails(chatId);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || "Failed to fetch chat details");
  } catch (error) {
    console.error("Error fetching chat details:", error);
    throw error;
  }
};

/**
 * Get messages in a chat
 */
export const fetchMessages = async (
  chatId: string,
  page: number = 0,
  size: number = 50
): Promise<Message[]> => {
  try {
    const response = await chatsApi.getMessages(chatId, page, size);
    if (response.success) {
      return response.data || [];
    }
    throw new Error(response.message || "Failed to fetch messages");
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

/**
 * Send a message
 */
export const sendMessage = async (
  chatId: string,
  content: string,
  imageUrls: string[] = []
): Promise<Message> => {
  try {
    const response = await chatsApi.sendMessage({
      chatId,
      content,
      imageUrls,
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || "Failed to send message");
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

/**
 * Mark chat as read
 */
export const markChatAsRead = async (chatId: string): Promise<void> => {
  try {
    const response = await chatsApi.markAsRead(chatId);
    if (!response.success) {
      throw new Error(response.message || "Failed to mark as read");
    }
  } catch (error) {
    console.error("Error marking chat as read:", error);
    // Don't throw - this is not critical
  }
};

/**
 * Get unread count
 */
export const fetchUnreadCount = async (): Promise<number> => {
  try {
    const response = await chatsApi.getUnreadCount();
    if (response.success) {
      return response.data || 0;
    }
    throw new Error(response.message || "Failed to fetch unread count");
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }
};

/**
 * Find or create chat by item
 */
export const findOrCreateChatByItem = async (itemId: number): Promise<Chat> => {
  try {
    let response = await chatsApi.getChatByItem(itemId);
    if (response.success && response.data) {
      return response.data;
    }

    // If chat doesn't exist, create one
    response = await chatsApi.createChat({ itemId });
    if (response.success) {
      return response.data;
    }

    throw new Error(response.message || "Failed to create chat");
  } catch (error) {
    console.error("Error finding or creating chat:", error);
    throw error;
  }
};

/**
 * Upload image
 */
export const uploadChatImage = async (file: File): Promise<string> => {
  try {
    const response = await chatsApi.uploadImage(file);
    if (response.success) {
      return response.data.imageUrl || response.data;
    }
    throw new Error(response.message || "Failed to upload image");
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

/**
 * Delete chat
 */
export const deleteChat = async (chatId: string): Promise<void> => {
  try {
    const response = await chatsApi.deleteChat(chatId);
    if (!response.success) {
      throw new Error(response.message || "Failed to delete chat");
    }
  } catch (error) {
    console.error("Error deleting chat:", error);
    throw error;
  }
};
