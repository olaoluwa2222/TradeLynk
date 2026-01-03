// components/GrammarChecker.tsx
"use client";

import { useState } from "react";
import {
  checkGrammar,
  applyReplacement,
  LanguageToolMatch,
} from "@/lib/languageTool";
import {
  improveTextWithAI,
  isAIImprovementAvailable,
} from "@/lib/claudeImprove";

interface GrammarCheckerProps {
  text: string;
  onTextChange: (text: string) => void;
  type: "bio" | "tagline";
  label?: string;
  maxLength?: number;
}

export default function GrammarChecker({
  text,
  onTextChange,
  type,
  label = "Text",
  maxLength,
}: GrammarCheckerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [matches, setMatches] = useState<LanguageToolMatch[]>([]);
  const [error, setError] = useState<string>("");
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);

  // Check AI availability on mount
  useState(() => {
    if (aiAvailable === null) {
      isAIImprovementAvailable().then(setAiAvailable);
    }
  });

  const handleCheck = async () => {
    setIsChecking(true);
    setError("");
    setMatches([]);

    try {
      const results = await checkGrammar(text);
      setMatches(results);

      if (results.length === 0) {
        setError("✓ No issues found!");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check grammar");
    } finally {
      setIsChecking(false);
    }
  };

  const handleImprove = async () => {
    setIsImproving(true);
    setError("");
    setMatches([]);

    try {
      const improved = await improveTextWithAI(text, type);
      onTextChange(improved);
      setError("✓ Text improved!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to improve text with AI"
      );
    } finally {
      setIsImproving(false);
    }
  };

  const handleApplySuggestion = (
    match: LanguageToolMatch,
    replacement: string
  ) => {
    const newText = applyReplacement(text, match, replacement);
    onTextChange(newText);

    // Remove this match from the list
    setMatches(matches.filter((m) => m !== match));

    if (matches.length === 1) {
      setError("✓ All suggestions applied!");
    }
  };

  return (
    <div className="w-full">
      {/* Text Area */}
      <label className="block text-sm font-medium mb-2">{label}</label>
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        maxLength={maxLength}
        rows={type === "bio" ? 6 : 2}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
        placeholder={
          type === "bio"
            ? "Tell buyers about yourself and what you sell..."
            : "A catchy tagline for your store..."
        }
      />

      {/* Character Count */}
      {maxLength && (
        <div className="text-right text-sm text-gray-500 mt-1">
          {text.length} / {maxLength}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-3">
        <button
          type="button"
          onClick={handleCheck}
          disabled={isChecking || !text.trim()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isChecking ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Checking...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Check Spelling
            </>
          )}
        </button>

        {aiAvailable !== false && (
          <button
            type="button"
            onClick={handleImprove}
            disabled={isImproving || !text.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isImproving ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Improving...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                Improve with AI
              </>
            )}
          </button>
        )}
      </div>

      {/* Results */}
      {error && (
        <div
          className={`mt-3 p-3 rounded-lg ${
            error.startsWith("✓")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {error}
        </div>
      )}

      {/* Grammar Suggestions */}
      {matches.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium">
            Found {matches.length} issue{matches.length > 1 ? "s" : ""}:
          </p>
          {matches.map((match, index) => (
            <div
              key={index}
              className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900">
                    {match.message}
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    "
                    {match.context.text.substring(
                      match.context.offset,
                      match.context.offset + match.context.length
                    )}
                    "
                  </p>
                  {match.replacements.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {match.replacements.slice(0, 3).map((replacement, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() =>
                            handleApplySuggestion(match, replacement)
                          }
                          className="px-3 py-1 bg-white border border-yellow-300 rounded text-sm hover:bg-yellow-100 transition-colors"
                        >
                          Use "{replacement}"
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
