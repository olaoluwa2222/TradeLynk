import React, { useState } from "react";
import { AlertCircle } from "lucide-react";

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
          onChange={(e) =>
            onDescriptionChange(e.target.value.slice(0, descriptionMax))
          }
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
