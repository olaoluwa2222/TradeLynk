// components/product/VariantSelector.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Check, AlertCircle, Package } from "lucide-react";
import { ProductVariant } from "@/types/items";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onSelect: (variant: ProductVariant) => void;
}

interface VariantOption {
  name: string;
  values: string[];
}

// Common color mappings for color swatches
const COLOR_MAP: Record<string, string> = {
  red: "#EF4444",
  blue: "#3B82F6",
  green: "#22C55E",
  yellow: "#EAB308",
  orange: "#F97316",
  purple: "#A855F7",
  pink: "#EC4899",
  black: "#0C0A09",
  white: "#FFFFFF",
  gray: "#6B7280",
  grey: "#6B7280",
  brown: "#92400E",
  navy: "#1E3A8A",
  teal: "#14B8A6",
  cyan: "#06B6D4",
  indigo: "#6366F1",
  lime: "#84CC16",
  rose: "#F43F5E",
  gold: "#D4AF37",
  silver: "#C0C0C0",
  beige: "#F5F5DC",
  cream: "#FFFDD0",
  maroon: "#800000",
  coral: "#FF7F50",
  turquoise: "#40E0D0",
};

export function VariantSelector({
  variants,
  selectedVariant,
  onSelect,
}: VariantSelectorProps) {
  // Extract unique options (Size, Color, etc.)
  const options = useMemo(() => {
    const optionMap: Record<string, Set<string>> = {};

    variants.forEach((variant) => {
      Object.entries(variant.variantOptions || {}).forEach(([key, value]) => {
        if (!optionMap[key]) {
          optionMap[key] = new Set();
        }
        optionMap[key].add(value);
      });
    });

    return Object.entries(optionMap).map(([name, values]) => ({
      name,
      values: Array.from(values),
    }));
  }, [variants]);

  // Track selected options
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  // Initialize with default variant's options
  useEffect(() => {
    const defaultVariant = variants.find((v) => v.isDefault) || variants[0];
    if (defaultVariant?.variantOptions) {
      setSelectedOptions(defaultVariant.variantOptions);
      onSelect(defaultVariant);
    }
  }, [variants]);

  // Find variant matching selected options
  const findMatchingVariant = (
    options: Record<string, string>,
  ): ProductVariant | undefined => {
    return variants.find((variant) => {
      const variantOptions = variant.variantOptions || {};
      return Object.entries(options).every(
        ([key, value]) => variantOptions[key] === value,
      );
    });
  };

  // Handle option selection
  const handleOptionSelect = (optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value };

    // Check if this exact combination exists
    let matchingVariant = findMatchingVariant(newOptions);

    // If no exact match, try to find a variant with this option and update other options
    if (!matchingVariant) {
      // Find any variant that has this option value
      const variantWithOption = variants.find((variant) => {
        const variantOptions = variant.variantOptions || {};
        return variantOptions[optionName] === value && variant.isInStock;
      });

      if (variantWithOption) {
        // Use this variant's options as the new selection
        const updatedOptions = { ...variantWithOption.variantOptions };
        setSelectedOptions(updatedOptions);
        onSelect(variantWithOption);
        return;
      }
    }

    setSelectedOptions(newOptions);
    if (matchingVariant) {
      onSelect(matchingVariant);
    }
  };

  // Check if an option value is available (has at least one in-stock variant)
  const isOptionAvailable = (optionName: string, value: string): boolean => {
    // Check if ANY variant with this option value exists and is in stock
    return variants.some((variant) => {
      const variantOptions = variant.variantOptions || {};
      return variantOptions[optionName] === value && variant.isInStock;
    });
  };

  // Get color value for swatch
  const getColorValue = (colorName: string): string => {
    const lowerColor = colorName.toLowerCase();
    return COLOR_MAP[lowerColor] || "#E5E7EB";
  };

  // Determine if this is a color option
  const isColorOption = (optionName: string): boolean => {
    return (
      optionName.toLowerCase() === "color" ||
      optionName.toLowerCase() === "colour"
    );
  };

  if (variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {options.map((option) => (
        <div key={option.name}>
          {/* Option Label */}
          <div className="flex items-center justify-between mb-3">
            <label
              className="text-sm font-semibold text-gray-900"
              style={{ fontFamily: "Clash Display" }}
            >
              {option.name}
              {selectedOptions[option.name] && (
                <span className="font-normal text-gray-500 ml-2">
                  — {selectedOptions[option.name]}
                </span>
              )}
            </label>
          </div>

          {/* Option Values */}
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const isSelected = selectedOptions[option.name] === value;
              const isAvailable = isOptionAvailable(option.name, value);
              const isColor = isColorOption(option.name);

              if (isColor) {
                // Color swatch
                const colorValue = getColorValue(value);
                const isWhite =
                  colorValue.toLowerCase() === "#ffffff" ||
                  value.toLowerCase() === "white";

                return (
                  <button
                    key={value}
                    onClick={() => handleOptionSelect(option.name, value)}
                    disabled={!isAvailable}
                    className={`relative w-10 h-10 rounded-full transition-all ${
                      isSelected
                        ? "ring-2 ring-black ring-offset-2"
                        : "hover:ring-2 hover:ring-gray-300 hover:ring-offset-1"
                    } ${!isAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
                    style={{ backgroundColor: colorValue }}
                    title={value}
                  >
                    {isWhite && (
                      <span className="absolute inset-0 rounded-full border border-gray-200" />
                    )}
                    {isSelected && (
                      <span
                        className={`absolute inset-0 flex items-center justify-center ${
                          isWhite ||
                          colorValue === "#EAB308" ||
                          colorValue === "#FFFDD0"
                            ? "text-gray-800"
                            : "text-white"
                        }`}
                      >
                        <Check size={16} strokeWidth={3} />
                      </span>
                    )}
                    {!isAvailable && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-full h-0.5 bg-gray-400 rotate-45 absolute" />
                      </span>
                    )}
                  </button>
                );
              }

              // Regular button (Size, etc.)
              return (
                <button
                  key={value}
                  onClick={() => handleOptionSelect(option.name, value)}
                  disabled={!isAvailable}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-black text-white shadow-lg"
                      : isAvailable
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                  }`}
                  style={{ fontFamily: "Clash Display" }}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Selected Variant Info */}
      {selectedVariant && (
        <div className="pt-4 border-t border-gray-100 space-y-3">
          {/* SKU */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">SKU:</span>
            <span className="font-mono text-gray-700">
              {selectedVariant.sku}
            </span>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {selectedVariant.isInStock ? (
              <>
                <div
                  className={`w-2 h-2 rounded-full ${
                    selectedVariant.isLowStock
                      ? "bg-orange-500"
                      : "bg-green-500"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    selectedVariant.isLowStock
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {selectedVariant.isLowStock
                    ? `Low stock: ${selectedVariant.stock} left`
                    : `${selectedVariant.stock} in stock`}
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm font-medium text-red-600">
                  Out of stock
                </span>
              </>
            )}
          </div>

          {/* Price (if different from base) */}
          {selectedVariant.price && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Variant Price:</span>
              <span
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "Clash Display" }}
              >
                ₦{(selectedVariant.effectivePrice / 100).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Low Stock Warning */}
      {selectedVariant?.isLowStock && (
        <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-100 rounded-xl">
          <AlertCircle
            size={18}
            className="text-orange-500 flex-shrink-0 mt-0.5"
          />
          <p className="text-sm text-orange-700">
            Only {selectedVariant.stock} items left. Order soon before they sell
            out!
          </p>
        </div>
      )}

      {/* Out of Stock Warning */}
      {selectedVariant && !selectedVariant.isInStock && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
          <Package size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">Out of Stock</p>
            <p className="text-xs text-red-600 mt-0.5">
              This variant is currently unavailable. Please select a different
              option.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
