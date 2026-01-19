// components/product/VariantBuilder.tsx
"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  AlertCircle,
  ChevronDown,
  Package,
  Palette,
  Ruler,
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
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "One Size", "Custom"];
const COLORS = [
  { name: "Black", hex: "#000000" },
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
  { name: "Custom", hex: "#9CA3AF" },
];

export function VariantBuilder({
  variants,
  onChange,
  basePrice,
  className = "",
}: VariantBuilderProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [customInputs, setCustomInputs] = useState<{
    [key: string]: { size?: string; color?: string };
  }>({});

  // Get actual size/color value (custom or predefined)
  const getActualSize = (variant: Variant) => {
    return variant.size === "Custom"
      ? customInputs[variant.id]?.size || ""
      : variant.size;
  };

  const getActualColor = (variant: Variant) => {
    return variant.color === "Custom"
      ? customInputs[variant.id]?.color || ""
      : variant.color;
  };

  // Merge custom values into variants before passing to parent
  const getMergedVariants = () => {
    return variants.map((v) => ({
      ...v,
      size: getActualSize(v),
      color: getActualColor(v),
    }));
  };

  // Call parent onChange with merged variants whenever variants or customInputs change
  const updateParent = (newVariants: Variant[]) => {
    const merged = newVariants.map((v) => ({
      ...v,
      size: v.size === "Custom" ? customInputs[v.id]?.size || "" : v.size,
      color: v.color === "Custom" ? customInputs[v.id]?.color || "" : v.color,
    }));
    onChange(merged);
  };

  // Generate unique ID
  const generateId = () =>
    `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Generate SKU
  const generateSKU = (size: string, color: string) => {
    const sizeCode = size.substring(0, 2).toUpperCase();
    const colorCode = color.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${sizeCode}-${colorCode}-${random}`;
  };

  // Add new variant
  const addVariant = () => {
    const newVariant: Variant = {
      id: generateId(),
      size: "",
      color: "",
      sku: "",
      price: basePrice,
      stock: 0,
    };
    const newVariants = [...variants, newVariant];
    updateParent(newVariants);
    setExpandedRow(newVariant.id);
  };

  // Remove variant
  const removeVariant = (id: string) => {
    const newVariants = variants.filter((v) => v.id !== id);
    updateParent(newVariants);
    if (expandedRow === id) setExpandedRow(null);
    const newErrors = { ...errors };
    delete newErrors[id];
    setErrors(newErrors);
  };

  // Update variant
  const updateVariant = (id: string, updates: Partial<Variant>) => {
    const newVariants = variants.map((v) => {
      if (v.id !== id) return v;

      const updated = { ...v, ...updates };

      // Auto-generate SKU if size or color changed
      if ((updates.size || updates.color) && !v.sku) {
        updated.sku = generateSKU(
          updates.size || v.size,
          updates.color || v.color,
        );
      }

      return updated;
    });

    updateParent(newVariants);

    // Validate
    validateVariant(id, {
      ...variants.find((v) => v.id === id),
      ...updates,
    } as Variant);
  };

  // Validate variant
  const validateVariant = (id: string, variant: Variant) => {
    const newErrors = { ...errors };

    // Check for duplicates
    const duplicate = variants.find(
      (v) =>
        v.id !== id &&
        v.size === variant.size &&
        v.color === variant.color &&
        v.size &&
        v.color,
    );

    if (duplicate) {
      newErrors[id] = "This size/color combination already exists";
    } else if (!variant.size && !variant.color) {
      newErrors[id] = "Select at least size or color";
    } else {
      delete newErrors[id];
    }

    setErrors(newErrors);
  };

  // Generate all combinations
  const generateCombinations = () => {
    const selectedSizes = Array.from(
      new Set(variants.map((v) => v.size).filter(Boolean)),
    );
    const selectedColors = Array.from(
      new Set(variants.map((v) => v.color).filter(Boolean)),
    );

    if (selectedSizes.length === 0 && selectedColors.length === 0) {
      // No variants exist, create empty one
      addVariant();
      return;
    }

    const sizes = selectedSizes.length > 0 ? selectedSizes : [""];
    const colors = selectedColors.length > 0 ? selectedColors : [""];

    const combinations: Variant[] = [];

    for (const size of sizes) {
      for (const color of colors) {
        // Check if combination already exists
        const exists = variants.find(
          (v) => v.size === size && v.color === color,
        );

        if (!exists) {
          combinations.push({
            id: generateId(),
            size,
            color,
            sku: generateSKU(size || "ONE", color || "DEF"),
            price: basePrice,
            stock: 0,
          });
        }
      }
    }

    if (combinations.length > 0) {
      onChange([...variants, ...combinations]);
    }
  };

  // Calculate total stock
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  // Format price for display
  const formatPrice = (kobo: number) => {
    return `₦${(kobo / 100).toLocaleString()}`;
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3
            className="text-lg font-bold text-gray-900"
            style={{ fontFamily: "Clash Display" }}
          >
            Product Variants
          </h3>
          <p className="text-sm text-gray-500">
            {variants.length} variant{variants.length !== 1 ? "s" : ""} •{" "}
            {totalStock} total in stock
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={generateCombinations}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            style={{ fontFamily: "Clash Display" }}
          >
            Generate Combinations
          </button>
          <button
            type="button"
            onClick={addVariant}
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            style={{ fontFamily: "Clash Display" }}
          >
            <Plus size={16} />
            Add Variant
          </button>
        </div>
      </div>

      {/* Variants Table */}
      {variants.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p
            className="text-gray-600 font-medium mb-2"
            style={{ fontFamily: "Clash Display" }}
          >
            No variants yet
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Add variants for different sizes, colors, or options
          </p>
          <button
            type="button"
            onClick={addVariant}
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
            style={{ fontFamily: "Clash Display" }}
          >
            <Plus size={16} />
            Add First Variant
          </button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
            <div className="col-span-2 flex items-center gap-1">
              <Ruler size={14} />
              Size
            </div>
            <div className="col-span-2 flex items-center gap-1">
              <Palette size={14} />
              Color
            </div>
            <div className="col-span-2">SKU</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">Stock</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Variant Rows */}
          {variants.map((variant) => (
            <div
              key={variant.id}
              className={`border-b border-gray-100 last:border-b-0 ${
                errors[variant.id] ? "bg-red-50" : "bg-white"
              }`}
            >
              <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center">
                {/* Size */}
                <div className="col-span-2">
                  {variant.size === "Custom" ? (
                    <input
                      type="text"
                      value={customInputs[variant.id]?.size || ""}
                      onChange={(e) => {
                        const newCustomInputs = {
                          ...customInputs,
                          [variant.id]: {
                            ...customInputs[variant.id],
                            size: e.target.value,
                          },
                        };
                        setCustomInputs(newCustomInputs);
                        // Update parent with merged values
                        updateParent(variants);
                      }}
                      placeholder="Enter custom size"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black"
                      style={{ fontFamily: "Clash Display" }}
                    />
                  ) : (
                    <div className="relative">
                      <select
                        value={variant.size}
                        onChange={(e) => {
                          const newSize = e.target.value;
                          updateVariant(variant.id, { size: newSize });
                          if (newSize !== "Custom") {
                            // Clear custom input when switching away from Custom
                            const newCustomInputs = { ...customInputs };
                            if (newCustomInputs[variant.id]) {
                              delete newCustomInputs[variant.id].size;
                            }
                            setCustomInputs(newCustomInputs);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:border-black focus:ring-1 focus:ring-black"
                        style={{ fontFamily: "Clash Display" }}
                      >
                        <option value="">Select</option>
                        {SIZES.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                  )}
                </div>

                {/* Color */}
                <div className="col-span-2">
                  {variant.color === "Custom" ? (
                    <input
                      type="text"
                      value={customInputs[variant.id]?.color || ""}
                      onChange={(e) => {
                        const newCustomInputs = {
                          ...customInputs,
                          [variant.id]: {
                            ...customInputs[variant.id],
                            color: e.target.value,
                          },
                        };
                        setCustomInputs(newCustomInputs);
                        // Update parent with merged values
                        updateParent(variants);
                      }}
                      placeholder="Enter custom color"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black"
                      style={{ fontFamily: "Clash Display" }}
                    />
                  ) : (
                    <div className="relative">
                      <select
                        value={variant.color}
                        onChange={(e) => {
                          const newColor = e.target.value;
                          updateVariant(variant.id, { color: newColor });
                          if (newColor !== "Custom") {
                            // Clear custom input when switching away from Custom
                            const newCustomInputs = { ...customInputs };
                            if (newCustomInputs[variant.id]) {
                              delete newCustomInputs[variant.id].color;
                            }
                            setCustomInputs(newCustomInputs);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:border-black focus:ring-1 focus:ring-black"
                        style={{ fontFamily: "Clash Display" }}
                      >
                        <option value="">Select</option>
                        {COLORS.map((color) => (
                          <option key={color.name} value={color.name}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      {variant.color && variant.color !== "Custom" && (
                        <div
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-gray-300"
                          style={{
                            backgroundColor:
                              COLORS.find((c) => c.name === variant.color)
                                ?.hex || "#ccc",
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* SKU */}
                <div className="col-span-2">
                  <input
                    type="text"
                    value={variant.sku}
                    onChange={(e) =>
                      updateVariant(variant.id, {
                        sku: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Auto-generated"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black uppercase"
                    style={{ fontFamily: "Clash Display" }}
                  />
                </div>

                {/* Price */}
                <div className="col-span-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
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
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black"
                      style={{ fontFamily: "Clash Display" }}
                    />
                  </div>
                </div>

                {/* Stock */}
                <div className="col-span-2">
                  <input
                    type="number"
                    value={variant.stock}
                    onChange={(e) =>
                      updateVariant(variant.id, {
                        stock: parseInt(e.target.value || "0", 10),
                      })
                    }
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black"
                    style={{ fontFamily: "Clash Display" }}
                  />
                </div>

                {/* Actions */}
                <div className="col-span-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => removeVariant(variant.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove variant"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errors[variant.id] && (
                <div className="px-4 pb-3 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle size={14} />
                  {errors[variant.id]}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {variants.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Total Variants</p>
              <p
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "Clash Display" }}
              >
                {variants.length}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Total Stock</p>
              <p
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "Clash Display" }}
              >
                {totalStock.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Price Range</p>
              <p
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "Clash Display" }}
              >
                {variants.length > 0 &&
                  formatPrice(Math.min(...variants.map((v) => v.price)))}
                {variants.length > 1 &&
                  Math.min(...variants.map((v) => v.price)) !==
                    Math.max(...variants.map((v) => v.price)) && (
                    <span>
                      {" "}
                      - {formatPrice(Math.max(...variants.map((v) => v.price)))}
                    </span>
                  )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p
          className="text-sm font-medium text-blue-900 mb-2"
          style={{ fontFamily: "Clash Display" }}
        >
          💡 Variant Tips
        </p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Each size/color combination creates a unique variant</li>
          <li>• SKUs are auto-generated but can be customized</li>
          <li>• Set stock to 0 for out-of-stock variants</li>
          <li>• Prices can differ between variants</li>
        </ul>
      </div>
    </div>
  );
}
