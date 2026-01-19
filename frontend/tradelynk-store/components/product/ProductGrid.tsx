// components/product/ProductGrid.tsx
"use client";

import React from "react";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";
import { Item } from "@/types/items";
import { Package, RefreshCw } from "lucide-react";

interface ProductGridProps {
  items: Item[];
  loading?: boolean;
  onLike?: (id: number) => void;
  emptyMessage?: string;
  emptyAction?: () => void;
  emptyActionLabel?: string;
  columns?: 1 | 2 | 3 | 4;
}

export function ProductGrid({
  items,
  loading = false,
  onLike,
  emptyMessage = "No products found",
  emptyAction,
  emptyActionLabel = "Clear Filters",
  columns = 4,
}: ProductGridProps) {
  // Grid column classes based on columns prop
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  // Show loading skeletons
  if (loading) {
    return (
      <div className={`grid ${gridClasses[columns]} gap-6`}>
        {Array.from({ length: 8 }).map((_, idx) => (
          <ProductCardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  // Show empty state
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Package size={32} className="text-gray-400" />
        </div>
        <h3
          className="text-2xl font-bold text-gray-900 mb-2 text-center"
          style={{ fontFamily: "Clash Display" }}
        >
          {emptyMessage}
        </h3>
        <p
          className="text-gray-500 text-center max-w-md mb-6"
          style={{ fontFamily: "Clash Display" }}
        >
          Try adjusting your filters or check back later for new products.
        </p>
        {emptyAction && (
          <button
            onClick={emptyAction}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
            style={{ fontFamily: "Clash Display" }}
          >
            <RefreshCw size={18} />
            {emptyActionLabel}
          </button>
        )}
      </div>
    );
  }

  // Show products grid
  return (
    <div className={`grid ${gridClasses[columns]} gap-6`}>
      {items.map((item) => (
        <ProductCard key={item.id} item={item} onLike={onLike} />
      ))}
    </div>
  );
}

// Pagination component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 12,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Calculate visible page numbers
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(0);

      if (currentPage > 2) {
        pages.push("...");
      }

      // Show pages around current
      const start = Math.max(1, currentPage - 1);
      const end = Math.min(totalPages - 2, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 3) {
        pages.push("...");
      }

      // Always show last page
      if (!pages.includes(totalPages - 1)) {
        pages.push(totalPages - 1);
      }
    }

    return pages;
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-12">
      {/* Page buttons */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-sm"
          style={{ fontFamily: "Clash Display" }}
        >
          ← Previous
        </button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {getVisiblePages().map((page, idx) => (
            <React.Fragment key={idx}>
              {page === "..." ? (
                <span className="w-10 h-10 flex items-center justify-center text-gray-400">
                  ...
                </span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`w-10 h-10 rounded-xl font-semibold text-sm transition-all ${
                    page === currentPage
                      ? "bg-black text-white shadow-lg"
                      : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                  style={{ fontFamily: "Clash Display" }}
                >
                  {(page as number) + 1}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile page indicator */}
        <div className="sm:hidden px-4 py-2.5 bg-gray-100 rounded-xl">
          <span
            className="font-semibold text-sm"
            style={{ fontFamily: "Clash Display" }}
          >
            {currentPage + 1} / {totalPages}
          </span>
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-sm"
          style={{ fontFamily: "Clash Display" }}
        >
          Next →
        </button>
      </div>

      {/* Items info */}
      {totalItems !== undefined && (
        <p
          className="text-sm text-gray-500"
          style={{ fontFamily: "Clash Display" }}
        >
          Showing {currentPage * pageSize + 1} -{" "}
          {Math.min((currentPage + 1) * pageSize, totalItems)} of {totalItems}{" "}
          products
        </p>
      )}
    </div>
  );
}
