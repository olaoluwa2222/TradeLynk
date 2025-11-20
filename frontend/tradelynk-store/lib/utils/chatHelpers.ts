import { chatsApi } from "@/lib/api";
import { useRouter } from "next/navigation";

/**
 * Start a chat with a seller about a specific item
 * This function checks if a chat exists, creates one if it doesn't, and redirects to it
 */
export const startChatWithSeller = async (
  itemId: number,
  sellerId: number,
  router: ReturnType<typeof useRouter>
): Promise<void> => {
  try {
    // First, try to get existing chat for this item
    let response = await chatsApi.getChatByItem(itemId);

    // If chat exists and we have a chatId, use it
    if (response.success && response.data?.chatId) {
      router.push(`/chat?chatId=${response.data.chatId}`);
      return;
    }

    // If no chat exists, create a new one
    if (!response.data?.exists) {
      response = await chatsApi.createChat({ itemId, sellerId });

      if (response.success && response.data?.id) {
        // Redirect to chat page with the newly created chat
        router.push(`/chat?chatId=${response.data.id}`);
        return;
      }

      throw new Error(response.message || "Failed to create chat");
    }

    throw new Error(response.message || "Failed to start chat");
  } catch (error) {
    console.error("Error starting chat:", error);
    throw error;
  }
};
