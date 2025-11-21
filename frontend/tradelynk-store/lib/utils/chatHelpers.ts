import { chatsApi } from "@/lib/api";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Start a chat with a seller about a specific item
 * This function checks if a chat exists, creates one if it doesn't, and redirects to it
 */
/**
 * Find or create chat and navigate to it
 */
export const startChatWithSeller = async (
  itemId: number,
  sellerId: number,
  router: AppRouterInstance
): Promise<void> => {
  try {
    console.log("💬 Starting chat for item:", itemId, "seller:", sellerId);

    // Check if chat already exists
    const checkResponse = await chatsApi.getChatByItem(itemId);

    if (checkResponse.success && checkResponse.exists && checkResponse.chatId) {
      console.log("✅ Found existing chat:", checkResponse.chatId);
      router.push(`/chat?chatId=${checkResponse.chatId}`);
      return;
    }

    console.log("📝 Chat doesn't exist, creating new one...");

    // Create new chat
    const createResponse = await chatsApi.createChat({
      itemId,
      sellerId,
    });

    if (createResponse.success && createResponse.data) {
      const chatId = createResponse.data.chatId;
      console.log("✅ Chat created successfully:", chatId);
      router.push(`/chat?chatId=${chatId}`);
      return;
    }

    throw new Error(createResponse.message || "Failed to create chat");
  } catch (error: any) {
    console.error("❌ Error starting chat:", error);
    throw new Error(error.message || "Failed to start chat");
  }
};
