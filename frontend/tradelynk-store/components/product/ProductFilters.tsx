// components/product/ProductFilters.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  RotateCcw,
  Tag,
  Check,
} from "lucide-react";
import { ItemCategory, ItemCondition, SortOption } from "@/types/items";

interface FilterState {
  category: ItemCategory | "";
  condition: ItemCondition | "";
  minPrice: number | undefined;
  maxPrice: number | undefined;
  tags: string[];
  inStock: boolean;
  sort: SortOption;
}

interface ProductFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onReset: () => void;
  availableTags?: string[];
  className?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "BOOKS", label: "Books" },
  { value: "CLOTHING", label: "Clothing" },
  { value: "FOOD", label: "Food" },
  { value: "ACCESSORIES", label: "Accessories" },
  { value: "HOME", label: "Home & Living" },
  { value: "BEAUTY", label: "Beauty" },
  { value: "SPORTS", label: "Sports" },
  { value: "TRANSPORTATION", label: "Transportation" },
  { value: "OTHER", label: "Other" },
];

const CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "RECENT", label: "Newest First" },
  { value: "POPULAR", label: "Most Popular" },
  { value: "PRICE_LOW", label: "Price: Low to High" },
  { value: "PRICE_HIGH", label: "Price: High to Low" },
  { value: "TRENDING", label: "Trending" },
];

const PRICE_PRESETS = [
  { min: 0, max: 5000, label: "Under ₦5,000" },
  { min: 5000, max: 20000, label: "₦5,000 - ₦20,000" },
  { min: 20000, max: 50000, label: "₦20,000 - ₦50,000" },
  { min: 50000, max: 100000, label: "₦50,000 - ₦100,000" },
  { min: 100000, max: undefined, label: "Over ₦100,000" },
];

export function ProductFilters({
  filters,
  onFilterChange,
  onReset,
  availableTags = [],
  className = "",
  isMobile = false,
  onClose,
}: ProductFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    sort: true,
    category: true,
    price: true,
    condition: true,
    tags: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Count active filters
  const activeFilterCount = [
    filters.category,
    filters.condition,
    filters.minPrice !== undefined || filters.maxPrice !== undefined,
    filters.tags.length > 0,
    filters.inStock,
  ].filter(Boolean).length;

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-gray-700" />
          <h2
            className="font-bold text-gray-900"
            style={{ fontFamily: "Clash Display" }}
          >
            Filters
          </h2>
          {activeFilterCount > 0 && (
            <span className="bg-black text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={onReset}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          )}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Sections */}
      <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Sort */}
        <FilterSection
          title="Sort By"
          isExpanded={expandedSections.sort}
          onToggle={() => toggleSection("sort")}
        >
          <div className="space-y-1">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onFilterChange({ sort: option.value })}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                  filters.sort === option.value
                    ? "bg-black text-white"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
                style={{ fontFamily: "Clash Display" }}
              >
                {option.label}
                {filters.sort === option.value && <Check size={14} />}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Category */}
        <FilterSection
          title="Category"
          isExpanded={expandedSections.category}
          onToggle={() => toggleSection("category")}
          badge={filters.category ? 1 : 0}
        >
          <div className="space-y-1">
            <button
              onClick={() => onFilterChange({ category: "" })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                !filters.category
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "hover:bg-gray-50 text-gray-600"
              }`}
              style={{ fontFamily: "Clash Display" }}
            >
              All Categories
              {!filters.category && <Check size={14} />}
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => onFilterChange({ category: cat.value })}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                  filters.category === cat.value
                    ? "bg-black text-white"
                    : "hover:bg-gray-50 text-gray-600"
                }`}
                style={{ fontFamily: "Clash Display" }}
              >
                {cat.label}
                {filters.category === cat.value && <Check size={14} />}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Price Range */}
        <FilterSection
          title="Price Range"
          isExpanded={expandedSections.price}
          onToggle={() => toggleSection("price")}
          badge={
            filters.minPrice !== undefined || filters.maxPrice !== undefined
              ? 1
              : 0
          }
        >
          <div className="space-y-3">
            {/* Preset buttons */}
            <div className="flex flex-wrap gap-2">
              {PRICE_PRESETS.map((preset, idx) => {
                const isActive =
                  filters.minPrice === preset.min * 100 &&
                  (preset.max === undefined
                    ? filters.maxPrice === undefined
                    : filters.maxPrice === preset.max * 100);

                return (
                  <button
                    key={idx}
                    onClick={() =>
                      onFilterChange({
                        minPrice: preset.min * 100,
                        maxPrice: preset.max ? preset.max * 100 : undefined,
                      })
                    }
                    className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                      isActive
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    style={{ fontFamily: "Clash Display" }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom range inputs */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">
                  Min (₦)
                </label>
                <input
                  type="number"
                  value={
                    filters.minPrice !== undefined ? filters.minPrice / 100 : ""
                  }
                  onChange={(e) =>
                    onFilterChange({
                      minPrice: e.target.value
                        ? Number(e.target.value) * 100
                        : undefined,
                    })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <span className="text-gray-400 pt-5">-</span>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">
                  Max (₦)
                </label>
                <input
                  type="number"
                  value={
                    filters.maxPrice !== undefined ? filters.maxPrice / 100 : ""
                  }
                  onChange={(e) =>
                    onFilterChange({
                      maxPrice: e.target.value
                        ? Number(e.target.value) * 100
                        : undefined,
                    })
                  }
                  placeholder="∞"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </FilterSection>

        {/* Condition */}
        <FilterSection
          title="Condition"
          isExpanded={expandedSections.condition}
          onToggle={() => toggleSection("condition")}
          badge={filters.condition ? 1 : 0}
        >
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onFilterChange({ condition: "" })}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                !filters.condition
                  ? "bg-gray-200 text-gray-900 font-medium"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={{ fontFamily: "Clash Display" }}
            >
              All
            </button>
            {CONDITIONS.map((cond) => (
              <button
                key={cond.value}
                onClick={() => onFilterChange({ condition: cond.value })}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  filters.condition === cond.value
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={{ fontFamily: "Clash Display" }}
              >
                {cond.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* In Stock Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <span
            className="text-sm font-medium text-gray-700"
            style={{ fontFamily: "Clash Display" }}
          >
            In Stock Only
          </span>
          <button
            onClick={() => onFilterChange({ inStock: !filters.inStock })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              filters.inStock ? "bg-black" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                filters.inStock ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>

        {/* Tags */}
        {availableTags.length > 0 && (
          <FilterSection
            title="Tags"
            isExpanded={expandedSections.tags}
            onToggle={() => toggleSection("tags")}
            badge={filters.tags.length}
          >
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = filters.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      const newTags = isSelected
                        ? filters.tags.filter((t) => t !== tag)
                        : [...filters.tags, tag];
                      onFilterChange({ tags: newTags });
                    }}
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full transition-colors ${
                      isSelected
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Tag size={10} />
                    {tag}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        )}
      </div>

      {/* Mobile Apply Button */}
      {isMobile && (
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
            style={{ fontFamily: "Clash Display" }}
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  );
}

// Filter Section Component
interface FilterSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: number;
  children: React.ReactNode;
}

function FilterSection({
  title,
  isExpanded,
  onToggle,
  badge = 0,
  children,
}: FilterSectionProps) {
  return (
    <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2 text-left"
      >
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold text-gray-900"
            style={{ fontFamily: "Clash Display" }}
          >
            {title}
          </span>
          {badge > 0 && (
            <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>
      {isExpanded && <div className="mt-2">{children}</div>}
    </div>
  );
}

// Mobile filter toggle button
interface FilterToggleProps {
  activeCount: number;
  onClick: () => void;
}

export function FilterToggle({ activeCount, onClick }: FilterToggleProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
      style={{ fontFamily: "Clash Display" }}
    >
      <SlidersHorizontal size={18} className="text-gray-600" />
      <span className="font-medium text-gray-700">Filters</span>
      {activeCount > 0 && (
        <span className="bg-black text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {activeCount}
        </span>
      )}
    </button>
  );
}
