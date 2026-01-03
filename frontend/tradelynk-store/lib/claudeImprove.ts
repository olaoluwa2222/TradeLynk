// lib/claudeImprove.ts

/**
 * Improve text using Claude API (if configured)
 * Note: This requires backend API endpoint that calls Claude
 * @param text - The text to improve
 * @param type - Type of text (bio, tagline)
 * @returns Improved text
 */
export async function improveTextWithAI(
  text: string,
  type: "bio" | "tagline"
): Promise<string> {
  try {
    if (!text.trim()) {
      throw new Error("Text cannot be empty");
    }

    // This would call your backend endpoint that integrates with Claude
    // For now, this is a placeholder implementation
    // You'll need to implement this on your backend

    const prompt =
      type === "bio"
        ? `Improve this seller bio for a student marketplace. Make it professional, engaging, and highlight trustworthiness. Keep it under 500 characters:\n\n${text}`
        : `Improve this store tagline for a student marketplace. Make it catchy, memorable, and professional. Keep it under 100 characters:\n\n${text}`;

    // TODO: Replace with actual backend API call
    const response = await fetch("/api/improve-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify({
        text,
        type,
        prompt,
      }),
    });

    if (!response.ok) {
      // If endpoint doesn't exist yet, provide a fallback message
      if (response.status === 404) {
        throw new Error(
          "AI improvement feature is not configured yet. Please contact support."
        );
      }
      throw new Error(`Failed to improve text: ${response.status}`);
    }

    const data = await response.json();
    return data.improvedText || text;
  } catch (error) {
    console.error("AI improvement error:", error);
    throw error;
  }
}

/**
 * Check if AI improvement is available
 * @returns true if the feature is configured
 */
export async function isAIImprovementAvailable(): Promise<boolean> {
  try {
    // Check if backend endpoint exists
    const response = await fetch("/api/improve-text/status", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
