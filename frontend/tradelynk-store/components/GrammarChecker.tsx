"use client";

import { useState } from "react";
import { aiApi } from "@/lib/api";

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
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const handleImprove = async () => {
    // Validation
    if (!text.trim()) {
      setError("Please enter some text first");
      return;
    }

    if (text.length < 10) {
      setError("Text is too short. Please write at least 10 characters.");
      return;
    }

    setIsImproving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await aiApi.improveText(text, type);

      if (response.success && response.data) {
        const improvedText = response.data.improvedText;
        onTextChange(improvedText);
        setSuccessMessage("✨ Text improved successfully!");

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError("Failed to improve text. Please try again.");
      }
    } catch (err: any) {
      console.error("AI improvement error:", err);

      // Better error messages
      if (err.response?.status === 400) {
        setError(err.response.data.message || "Invalid text format");
      } else if (err.response?.status === 500) {
        setError("AI service is temporarily unavailable. Please try again.");
      } else {
        setError("Failed to improve text. Please check your connection.");
      }
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <div className="w-full">
      {/* Text Area */}
      <label
        className="block text-sm font-medium text-gray-700 mb-2"
        style={{
          fontFamily: "Clash Display",
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      <textarea
        value={text}
        onChange={(e) => {
          onTextChange(e.target.value);
          setError("");
          setSuccessMessage("");
        }}
        maxLength={maxLength}
        rows={type === "bio" ? 6 : 3}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none text-gray-900"
        style={{
          fontFamily: "Clash Display",
          fontWeight: 400,
        }}
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

      {/* AI Improve Button */}
      <div className="flex gap-3 mt-3">
        <button
          type="button"
          onClick={handleImprove}
          disabled={isImproving || !text.trim() || text.length < 10}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{
            fontFamily: "Clash Display",
            fontWeight: 500,
          }}
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
              Improving with AI...
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
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Help Text */}
      <p
        className="text-xs text-gray-500 mt-2"
        style={{
          fontFamily: "Clash Display",
          fontWeight: 400,
        }}
      >
        💡 Click "Improve with AI" to enhance your {type} with better grammar,
        clarity, and engagement
      </p>
    </div>
  );
}
