// components/product/VariantBuilderModern.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Package,
  Palette,
  Ruler,
  Check,
  Copy,
  Sparkles,
  GripVertical,
  X,
  Edit3,
} from "lucide-react";

export interface Variant {
  id: string;
  size: string;
  color: string;
  sku: string;
  price: number; // in kobo
  stock: number;
}

interface VariantBuilderProps {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
  basePrice: number; // in kobo
  className?: string;
}

// Predefined options
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "One Size"];
const COLORS = [
  { name: "Black", hex: "#0C0A09" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#EF4444" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Green", hex: "#22C55E" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Orange", hex: "#F97316" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Brown", hex: "#78350F" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Navy", hex: "#1E3A5F" },
  { name: "Beige", hex: "#D4C4A8" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Maroon", hex: "#7F1D1D" },
];

export function VariantBuilderModern({
  variants,
  onChange,
  basePrice,
  className = "",
}: VariantBuilderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [showCustomSize, setShowCustomSize] = useState(false);
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);

  // Generate unique ID
  const generateId = () =>
    `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Generate SKU
  const generateSKU = (size: string, color: string) => {
    const sizeCode = size ? size.substring(0, 2).toUpperCase() : "DF";
    const colorCode = color ? color.substring(0, 3).toUpperCase() : "DEF";
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${sizeCode}-${colorCode}-${random}`;
  };

  // Add single variant
  const addVariant = (size: string = "", color: string = "") => {
    const id = generateId();
    const newVariant: Variant = {
      id,
      size,
      color,
      sku: generateSKU(size, color),
      price: basePrice,
      stock: 1,
    };
    onChange([...variants, newVariant]);
    setExpandedId(id);
    setRecentlyAdded(id);
    setTimeout(() => setRecentlyAdded(null), 600);
  };

  // Quick add multiple variants
  const quickAddVariants = () => {
    const sizes = [...selectedSizes, ...(customSize ? [customSize] : [])];
    const colors = [...selectedColors, ...(customColor ? [customColor] : [])];

    if (sizes.length === 0 && colors.length === 0) {
      addVariant();
      setShowQuickAdd(false);
      return;
    }

    const newVariants: Variant[] = [];
    const sizesToUse = sizes.length > 0 ? sizes : [""];
    const colorsToUse = colors.length > 0 ? colors : [""];

    for (const size of sizesToUse) {
      for (const color of colorsToUse) {
        // Check if combination already exists
        const exists = variants.some(
          (v) => v.size === size && v.color === color,
        );
        if (!exists && (size || color)) {
          newVariants.push({
            id: generateId(),
            size,
            color,
            sku: generateSKU(size, color),
            price: basePrice,
            stock: 1,
          });
        }
      }
    }

    if (newVariants.length > 0) {
      onChange([...variants, ...newVariants]);
      setRecentlyAdded(newVariants[0].id);
      setTimeout(() => setRecentlyAdded(null), 600);
    }

    // Reset quick add
    setShowQuickAdd(false);
    setSelectedSizes([]);
    setSelectedColors([]);
    setCustomSize("");
    setCustomColor("");
    setShowCustomSize(false);
    setShowCustomColor(false);
  };

  // Remove variant
  const removeVariant = (id: string) => {
    onChange(variants.filter((v) => v.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  // Update variant
  const updateVariant = (id: string, updates: Partial<Variant>) => {
    onChange(
      variants.map((v) => {
        if (v.id !== id) return v;
        const updated = { ...v, ...updates };

        // Auto-regenerate SKU if size/color changed and SKU was auto-generated
        if (updates.size !== undefined || updates.color !== undefined) {
          const currentSku = v.sku;
          const autoPattern = /^[A-Z]{2}-[A-Z]{3}-[A-Z0-9]{4}$/;
          if (autoPattern.test(currentSku)) {
            updated.sku = generateSKU(
              updates.size ?? v.size,
              updates.color ?? v.color,
            );
          }
        }

        return updated;
      }),
    );
    validateVariant(id, { ...variants.find((v) => v.id === id)!, ...updates });
  };

  // Validate variant
  const validateVariant = (id: string, variant: Variant) => {
    const newErrors = { ...errors };

    const duplicate = variants.find(
      (v) =>
        v.id !== id &&
        v.size === variant.size &&
        v.color === variant.color &&
        (v.size || v.color),
    );

    if (duplicate) {
      newErrors[id] = "This combination already exists";
    } else if (!variant.size && !variant.color) {
      newErrors[id] = "Select at least size or color";
    } else {
      delete newErrors[id];
    }

    setErrors(newErrors);
  };

  // Duplicate variant
  const duplicateVariant = (variant: Variant) => {
    const id = generateId();
    const newVariant: Variant = {
      ...variant,
      id,
      sku: generateSKU(variant.size, variant.color),
    };
    onChange([...variants, newVariant]);
    setExpandedId(id);
    setRecentlyAdded(id);
    setTimeout(() => setRecentlyAdded(null), 600);
  };

  // Calculate totals
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
  const priceRange =
    variants.length > 0
      ? {
          min: Math.min(...variants.map((v) => v.price)),
          max: Math.max(...variants.map((v) => v.price)),
        }
      : { min: 0, max: 0 };

  // Format price
  const formatPrice = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

  // Get color hex
  const getColorHex = (colorName: string): string => {
    return (
      COLORS.find((c) => c.name.toLowerCase() === colorName.toLowerCase())
        ?.hex || "#9CA3AF"
    );
  };

  // Toggle size in quick add
  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  };

  // Toggle color in quick add
  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    );
  };

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3
            className="text-lg font-bold text-gray-900"
            style={{ fontFamily: "Clash Display" }}
          >
            Product Variants
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {variants.length} variant{variants.length !== 1 ? "s" : ""} •{" "}
            {totalStock} total units
          </p>
        </div>

        {/* Add Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 flex items-center gap-2
              ${
                showQuickAdd
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            style={{ fontFamily: "Clash Display" }}
          >
            <Sparkles size={16} />
            Quick Add
          </button>
          <button
            type="button"
            onClick={() => addVariant()}
            className="px-4 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-all duration-200 flex items-center gap-2 pill-btn"
            style={{ fontFamily: "Clash Display" }}
          >
            <Plus size={16} />
            Add Single
          </button>
        </div>
      </div>

      {/* Quick Add Panel */}
      {showQuickAdd && (
        <div className="mb-6 p-5 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl animate-expand shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4
              className="text-sm font-bold text-gray-900 flex items-center gap-2"
              style={{ fontFamily: "Clash Display" }}
            >
              <Sparkles size={16} className="text-amber-500" />
              Quick Add Variants
            </h4>
            <button
              type="button"
              onClick={() => setShowQuickAdd(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Size Selection */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Ruler size={14} />
                Sizes
              </label>
              <button
                type="button"
                onClick={() => setShowCustomSize(!showCustomSize)}
                className="text-xs text-gray-600 hover:text-black transition-colors"
              >
                + Custom size
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-3.5 py-2 text-sm font-medium rounded-xl border-2 transition-all duration-200
                    ${
                      selectedSizes.includes(size)
                        ? "border-black bg-black text-white"
                        : "border-gray-200 hover:border-gray-400 text-gray-700"
                    }`}
                  style={{ fontFamily: "Clash Display" }}
                >
                  {size}
                </button>
              ))}
            </div>
            {showCustomSize && (
              <input
                type="text"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                placeholder="Enter custom size (e.g., 42, EU 38)"
                className="mt-3 w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black transition-all"
                style={{ fontFamily: "Clash Display" }}
              />
            )}
          </div>

          {/* Color Selection */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Palette size={14} />
                Colors
              </label>
              <button
                type="button"
                onClick={() => setShowCustomColor(!showCustomColor)}
                className="text-xs text-gray-600 hover:text-black transition-colors"
              >
                + Custom color
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => {
                const isSelected = selectedColors.includes(color.name);
                const isWhite =
                  color.hex === "#FFFFFF" || color.name === "White";
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => toggleColor(color.name)}
                    className={`relative w-10 h-10 rounded-xl border-2 transition-all duration-200 flex items-center justify-center
                      ${
                        isSelected
                          ? "border-black ring-2 ring-black ring-offset-2"
                          : `border-gray-200 hover:border-gray-400 ${isWhite ? "border-gray-300" : ""}`
                      }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {isSelected && (
                      <Check
                        size={16}
                        className={`animate-check-pop ${
                          isWhite || color.hex === "#EAB308"
                            ? "text-gray-800"
                            : "text-white"
                        }`}
                        strokeWidth={3}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {showCustomColor && (
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder="Enter custom color (e.g., Burgundy, Rose Gold)"
                className="mt-3 w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black transition-all"
                style={{ fontFamily: "Clash Display" }}
              />
            )}
          </div>

          {/* Preview & Generate */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {(() => {
                const sizes = [
                  ...selectedSizes,
                  ...(customSize ? [customSize] : []),
                ];
                const colors = [
                  ...selectedColors,
                  ...(customColor ? [customColor] : []),
                ];
                const count =
                  Math.max(sizes.length, 1) * Math.max(colors.length, 1);
                if (sizes.length === 0 && colors.length === 0)
                  return "No variants selected";
                return `Will create ${count} variant${count !== 1 ? "s" : ""}`;
              })()}
            </p>
            <button
              type="button"
              onClick={quickAddVariants}
              className="px-5 py-2.5 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all duration-200 pill-btn"
              style={{ fontFamily: "Clash Display" }}
            >
              Generate Variants
            </button>
          </div>
        </div>
      )}

      {/* Variant List */}
      {variants.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center animate-fade-in-up">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <p
            className="text-gray-900 font-medium mb-1"
            style={{ fontFamily: "Clash Display" }}
          >
            No variants yet
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Add variants for different sizes, colors, or options
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => setShowQuickAdd(true)}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
              style={{ fontFamily: "Clash Display" }}
            >
              <Sparkles size={16} />
              Quick Add
            </button>
            <button
              type="button"
              onClick={() => addVariant()}
              className="px-4 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2"
              style={{ fontFamily: "Clash Display" }}
            >
              <Plus size={16} />
              Add First Variant
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div
              key={variant.id}
              className={`border rounded-2xl overflow-hidden transition-all duration-300 stagger-item card-hover
                ${recentlyAdded === variant.id ? "ring-2 ring-black ring-offset-2 animate-spring" : ""}
                ${errors[variant.id] ? "border-red-300 bg-red-50/50" : "border-gray-200 bg-white"}
                ${expandedId === variant.id ? "shadow-lg" : "shadow-sm"}`}
            >
              {/* Collapsed Row */}
              <div
                className={`flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors
                  ${expandedId === variant.id ? "border-b border-gray-100 bg-gray-50/30" : ""}`}
                onClick={() =>
                  setExpandedId(expandedId === variant.id ? null : variant.id)
                }
              >
                {/* Drag Handle (visual only for now) */}
                <div className="text-gray-300 cursor-grab hidden sm:block">
                  <GripVertical size={18} />
                </div>

                {/* Color Swatch */}
                {variant.color && (
                  <div
                    className={`w-8 h-8 rounded-lg border-2 flex-shrink-0 transition-all
                      ${variant.color.toLowerCase() === "white" ? "border-gray-300" : "border-transparent"}`}
                    style={{ backgroundColor: getColorHex(variant.color) }}
                    title={variant.color}
                  />
                )}

                {/* Variant Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold text-gray-900 truncate"
                    style={{ fontFamily: "Clash Display" }}
                  >
                    {[variant.size, variant.color]
                      .filter(Boolean)
                      .join(" / ") || "Unnamed Variant"}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    SKU: {variant.sku} • {variant.stock} in stock
                  </p>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p
                    className="text-sm font-bold text-gray-900"
                    style={{ fontFamily: "Clash Display" }}
                  >
                    {formatPrice(variant.price)}
                  </p>
                </div>

                {/* Expand Icon */}
                <div className="flex-shrink-0 text-gray-400">
                  {expandedId === variant.id ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === variant.id && (
                <div className="p-5 bg-white animate-slide-up">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Size */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Size
                      </label>
                      <div className="relative">
                        <select
                          value={
                            SIZES.includes(variant.size)
                              ? variant.size
                              : "custom"
                          }
                          onChange={(e) => {
                            if (e.target.value === "custom") {
                              // Keep current custom value
                            } else {
                              updateVariant(variant.id, {
                                size: e.target.value,
                              });
                            }
                          }}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 appearance-none bg-white focus:border-black focus:ring-1 focus:ring-black transition-all"
                          style={{ fontFamily: "Clash Display" }}
                        >
                          <option value="">Select size</option>
                          {SIZES.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                          {!SIZES.includes(variant.size) && variant.size && (
                            <option value="custom">
                              {variant.size} (Custom)
                            </option>
                          )}
                          <option value="custom">+ Custom size</option>
                        </select>
                        <ChevronDown
                          size={16}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                        />
                      </div>
                      {(!SIZES.includes(variant.size) ||
                        variant.size === "") && (
                        <input
                          type="text"
                          value={
                            SIZES.includes(variant.size) ? "" : variant.size
                          }
                          onChange={(e) =>
                            updateVariant(variant.id, { size: e.target.value })
                          }
                          placeholder="Enter custom size"
                          className="mt-2 w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black transition-all"
                          style={{ fontFamily: "Clash Display" }}
                        />
                      )}
                    </div>

                    {/* Color */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Color
                      </label>
                      <div className="relative">
                        <select
                          value={
                            COLORS.some((c) => c.name === variant.color)
                              ? variant.color
                              : "custom"
                          }
                          onChange={(e) => {
                            if (e.target.value === "custom") {
                              // Keep current custom value
                            } else {
                              updateVariant(variant.id, {
                                color: e.target.value,
                              });
                            }
                          }}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 appearance-none bg-white focus:border-black focus:ring-1 focus:ring-black transition-all"
                          style={{ fontFamily: "Clash Display" }}
                        >
                          <option value="">Select color</option>
                          {COLORS.map((color) => (
                            <option key={color.name} value={color.name}>
                              {color.name}
                            </option>
                          ))}
                          {!COLORS.some((c) => c.name === variant.color) &&
                            variant.color && (
                              <option value="custom">
                                {variant.color} (Custom)
                              </option>
                            )}
                          <option value="custom">+ Custom color</option>
                        </select>
                        <div
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md border border-gray-300"
                          style={{
                            backgroundColor: getColorHex(variant.color),
                          }}
                        />
                        <ChevronDown
                          size={16}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                        />
                      </div>
                      {(!COLORS.some((c) => c.name === variant.color) ||
                        variant.color === "") && (
                        <input
                          type="text"
                          value={
                            COLORS.some((c) => c.name === variant.color)
                              ? ""
                              : variant.color
                          }
                          onChange={(e) =>
                            updateVariant(variant.id, { color: e.target.value })
                          }
                          placeholder="Enter custom color"
                          className="mt-2 w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black transition-all"
                          style={{ fontFamily: "Clash Display" }}
                        />
                      )}
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Price
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 text-sm font-medium">
                          ₦
                        </span>
                        <input
                          type="number"
                          value={variant.price / 100}
                          onChange={(e) =>
                            updateVariant(variant.id, {
                              price: Math.round(
                                parseFloat(e.target.value || "0") * 100,
                              ),
                            })
                          }
                          min="0"
                          step="0.01"
                          className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:border-black focus:ring-1 focus:ring-black transition-all"
                          style={{ fontFamily: "Clash Display" }}
                        />
                      </div>
                    </div>

                    {/* Stock */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Stock
                      </label>
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={(e) =>
                          updateVariant(variant.id, {
                            stock: parseInt(e.target.value || "0", 10),
                          })
                        }
                        min="0"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:border-black focus:ring-1 focus:ring-black transition-all"
                        style={{ fontFamily: "Clash Display" }}
                      />
                    </div>
                  </div>

                  {/* SKU Row */}
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) =>
                          updateVariant(variant.id, {
                            sku: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="Auto-generated"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 font-mono uppercase placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black transition-all"
                      />
                    </div>
                    <div className="flex gap-2 pt-6">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateVariant(variant);
                        }}
                        className="p-2.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
                        title="Duplicate variant"
                      >
                        <Copy size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeVariant(variant.id);
                        }}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Remove variant"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {errors[variant.id] && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-red-600 animate-shake">
                      <AlertCircle size={16} />
                      {errors[variant.id]}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary Footer */}
      {variants.length > 0 && (
        <div className="mt-6 p-5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 animate-fade-in-up">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Total Variants
              </p>
              <p
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: "Clash Display" }}
              >
                {variants.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Total Stock
              </p>
              <p
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: "Clash Display" }}
              >
                {totalStock.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Price Range
              </p>
              <p
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: "Clash Display" }}
              >
                {priceRange.min === priceRange.max
                  ? formatPrice(priceRange.min)
                  : `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      {variants.length > 0 && (
        <div className="mt-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100 flex gap-3">
          <Sparkles size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p
              className="text-sm font-medium text-amber-900"
              style={{ fontFamily: "Clash Display" }}
            >
              Pro Tips
            </p>
            <ul className="mt-1 text-xs text-amber-700 space-y-0.5">
              <li>• Click any variant to expand and edit details</li>
              <li>• Use Quick Add to generate multiple variants at once</li>
              <li>• Set stock to 0 to mark variants as out of stock</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
