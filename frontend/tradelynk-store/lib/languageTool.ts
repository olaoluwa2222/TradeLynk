// lib/languageTool.ts

export interface LanguageToolMatch {
  message: string;
  shortMessage: string;
  offset: number;
  length: number;
  replacements: string[];
  context: {
    text: string;
    offset: number;
    length: number;
  };
  rule: {
    id: string;
    description: string;
    category: {
      id: string;
      name: string;
    };
  };
}

export interface LanguageToolResponse {
  matches: LanguageToolMatch[];
}

/**
 * Check text for spelling and grammar errors using LanguageTool API
 * @param text - The text to check
 * @returns Array of grammar/spelling issues
 */
export async function checkGrammar(text: string): Promise<LanguageToolMatch[]> {
  try {
    if (!text.trim()) {
      return [];
    }

    const response = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        text: text,
        language: "en-US",
        enabledOnly: "false",
      }),
    });

    if (!response.ok) {
      throw new Error(`LanguageTool API error: ${response.status}`);
    }

    const data: LanguageToolResponse = await response.json();
    return data.matches;
  } catch (error) {
    console.error("Grammar check error:", error);
    throw error;
  }
}

/**
 * Apply a suggested replacement to text
 * @param text - Original text
 * @param match - The match object with offset and length
 * @param replacement - The replacement text
 * @returns Updated text
 */
export function applyReplacement(
  text: string,
  match: LanguageToolMatch,
  replacement: string
): string {
  const before = text.substring(0, match.offset);
  const after = text.substring(match.offset + match.length);
  return before + replacement + after;
}
