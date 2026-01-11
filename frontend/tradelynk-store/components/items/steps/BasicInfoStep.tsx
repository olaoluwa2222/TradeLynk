import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { aiApi } from "@/lib/api";

interface BasicInfoStepProps {
  title: string;
  description: string;
  category: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  errors: {
    title?: string;
    description?: string;
    category?: string;
  };
}

const CATEGORIES = [
  { value: "BOOKS", label: "📚 Books" },
  { value: "CLOTHING", label: "👕 Clothing" },
  { value: "ELECTRONICS", label: "📱 Electronics" },
  { value: "FOOD", label: "🍕 Food" },
  { value: "LIGHT", label: "💡 Light & Accessories" },
  { value: "TRANSPORTATION", label: "🚗 Transportation" },
];

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  title,
  description,
  category,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  errors,
}) => {
  const titleLength = title.length;
  const titleMax = 100;
  const descriptionLength = description.length;
  const descriptionMax = 500;

  // AI Improvement state
  const [isImproving, setIsImproving] = useState(false);
  const [improveError, setImproveError] = useState<string>("");
  const [improveSuccess, setImproveSuccess] = useState<string>("");

  // Handle AI improve description
  const handleImproveDescription = async () => {
    if (!description.trim()) {
      setImproveError("Please enter a description first");
      return;
    }

    if (description.length < 10) {
      setImproveError(
        "Description is too short. Please write at least 10 characters."
      );
      return;
    }

    setIsImproving(true);
    setImproveError("");
    setImproveSuccess("");

    try {
      // Use "bio" type as it's similar to description improvement
      const response = await aiApi.improveText(description, "bio");

      if (response.success && response.data) {
        const improvedText = response.data.improvedText;
        onDescriptionChange(improvedText.slice(0, descriptionMax));
        setImproveSuccess("✨ Description improved successfully!");

        // Clear success message after 3 seconds
        setTimeout(() => setImproveSuccess(""), 3000);
      } else {
        setImproveError("Failed to improve description. Please try again.");
      }
    } catch (err: any) {
      console.error("AI improvement error:", err);

      if (err.response?.status === 400) {
        setImproveError(
          err.response.data.message || "Invalid description format"
        );
      } else if (err.response?.status === 500) {
        setImproveError(
          "AI service is temporarily unavailable. Please try again."
        );
      } else {
        setImproveError(
          "Failed to improve description. Please check your connection."
        );
      }
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Field */}
      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Item Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value.slice(0, titleMax))}
          placeholder="e.g., iPhone 13 Pro - Like New"
          maxLength={titleMax}
          className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 text-black placeholder-gray-400 focus:outline-none ${
            errors.title
              ? "border-red-500 focus:border-red-500 bg-red-50"
              : "border-gray-200 focus:border-black focus:shadow-md hover:border-gray-300"
          }`}
        />
        <div className="flex justify-between items-start mt-2">
          {errors.title && (
            <div className="flex items-center gap-1 text-red-500 text-xs font-medium">
              <AlertCircle size={14} />
              {errors.title}
            </div>
          )}
          <span
            className={`text-xs font-medium ml-auto ${
              titleLength === titleMax ? "text-red-500" : "text-gray-400"
            }`}
          >
            {titleLength}/{titleMax}
          </span>
        </div>
      </div>

      {/* Description Field */}
      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => {
            onDescriptionChange(e.target.value.slice(0, descriptionMax));
            setImproveError("");
            setImproveSuccess("");
          }}
          placeholder="Describe your item in detail... (condition, features, etc.)"
          maxLength={descriptionMax}
          rows={4}
          className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 text-black placeholder-gray-400 focus:outline-none resize-none ${
            errors.description
              ? "border-red-500 focus:border-red-500 bg-red-50"
              : "border-gray-200 focus:border-black focus:shadow-md hover:border-gray-300"
          }`}
        />
        <div className="flex justify-between items-start mt-2">
          {errors.description && (
            <div className="flex items-center gap-1 text-red-500 text-xs font-medium">
              <AlertCircle size={14} />
              {errors.description}
            </div>
          )}
          <span
            className={`text-xs font-medium ml-auto ${
              descriptionLength === descriptionMax
                ? "text-red-500"
                : "text-gray-400"
            }`}
          >
            {descriptionLength}/{descriptionMax}
          </span>
        </div>

        {/* AI Improve Button */}
        <div className="mt-3">
          <button
            type="button"
            onClick={handleImproveDescription}
            disabled={
              isImproving || !description.trim() || description.length < 10
            }
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
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
        {improveError && (
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
              <span>{improveError}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {improveSuccess && (
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
              <span>{improveSuccess}</span>
            </div>
          </div>
        )}
      </div>

      {/* Category Field */}
      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 text-black bg-white cursor-pointer focus:outline-none appearance-none ${
              errors.category
                ? "border-red-500 focus:border-red-500 bg-red-50"
                : "border-gray-200 focus:border-black focus:shadow-md hover:border-gray-300"
            }`}
          >
            <option value="">Select a category...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
        {errors.category && (
          <div className="flex items-center gap-1 text-red-500 text-xs font-medium mt-2">
            <AlertCircle size={14} />
            {errors.category}
          </div>
        )}
      </div>

      {/* Category Info */}
      {category && (
        <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
          <p className="text-xs text-blue-700">
            <span className="font-semibold">Note:</span> Make sure your item
            matches the selected category to avoid removal.
          </p>
        </div>
      )}
    </div>
  );
};
