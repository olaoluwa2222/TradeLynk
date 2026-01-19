// app/items/page.tsx - Redesigned Product Listing Page
"use client";

import Link from "next/link";
import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  SlidersHorizontal,
  X,
  Grid3X3,
  LayoutGrid,
  Search,
} from "lucide-react";
import { itemsApi } from "@/lib/api";
import {
  Item,
  ItemCategory,
  ItemCondition,
  SortOption,
  PaginatedResponse,
} from "@/types/items";
import { ProductGrid, Pagination } from "@/components/product/ProductGrid";
import {
  ProductFilters,
  FilterToggle,
} from "@/components/product/ProductFilters";

interface FilterState {
  category: ItemCategory | "";
  condition: ItemCondition | "";
  minPrice: number | undefined;
  maxPrice: number | undefined;
  tags: string[];
  inStock: boolean;
  sort: SortOption;
}

const DEFAULT_FILTERS: FilterState = {
  category: "",
  condition: "",
  minPrice: undefined,
  maxPrice: undefined,
  tags: [],
  inStock: false,
  sort: "RECENT",
};

function ItemsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 12;

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Filter state
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Available tags for filter
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Grid columns
  const [columns, setColumns] = useState<3 | 4>(4);

  // Initialize from URL params
  useEffect(() => {
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const condition = searchParams.get("condition");
    const sort = searchParams.get("sort");
    const page = searchParams.get("page");

    if (search) {
      setSearchQuery(search);
      setSearchInput(search);
    }

    const newFilters: Partial<FilterState> = {};
    if (category) newFilters.category = category as ItemCategory;
    if (condition) newFilters.condition = condition as ItemCondition;
    if (sort) newFilters.sort = sort as SortOption;
    if (tag) newFilters.tags = [decodeURIComponent(tag)];

    if (Object.keys(newFilters).length > 0) {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    }

    if (page) setCurrentPage(parseInt(page));
  }, [searchParams]);

  // Fetch items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let response;

      if (searchQuery && searchQuery.trim().length > 0) {
        response = await itemsApi.searchItems(
          searchQuery.trim(),
          currentPage,
          pageSize,
        );
      } else {
        response = await itemsApi.getAllItems(
          currentPage,
          pageSize,
          filters.category || undefined,
          filters.minPrice,
          filters.maxPrice,
          filters.condition || undefined,
          filters.sort,
        );
      }

      if (response.success && response.data) {
        const data = response.data as PaginatedResponse<Item>;
        setItems(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalItems(data.totalElements || 0);

        // Extract unique tags from items
        const tags = new Set<string>();
        (data.content || []).forEach((item: Item) => {
          item.tags?.forEach((tag) => tags.add(tag));
        });
        setAvailableTags(Array.from(tags));
      } else {
        setError(response.message || "Failed to load products");
      }
    } catch (err: any) {
      console.error("Error fetching items:", err);
      setError(err.message || "An error occurred while loading products");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, filters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Handle filter change
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(0);
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
    setSearchInput("");
    setCurrentPage(0);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(0);
  };

  // Handle like
  const handleLike = async (itemId: number) => {
    try {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      if (item.likedByCurrentUser) {
        await itemsApi.unlikeItem(itemId);
      } else {
        await itemsApi.likeItem(itemId);
      }

      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                likedByCurrentUser: !i.likedByCurrentUser,
                likeCount: i.likedByCurrentUser
                  ? i.likeCount - 1
                  : i.likeCount + 1,
              }
            : i,
        ),
      );
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">
            {/* Title Row */}
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className="text-3xl md:text-4xl font-bold text-gray-900"
                  style={{ fontFamily: "Clash Display" }}
                >
                  Browse Products
                </h1>
                <p
                  className="text-gray-500 mt-1"
                  style={{ fontFamily: "Clash Display" }}
                >
                  {loading ? "Loading..." : `${totalItems} products available`}
                </p>
              </div>

              {/* Grid Toggle (Desktop) */}
              <div className="hidden lg:flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setColumns(3)}
                  className={`p-2 rounded-md transition-colors ${
                    columns === 3 ? "bg-white shadow-sm" : "hover:bg-gray-200"
                  }`}
                >
                  <Grid3X3 size={18} className="text-gray-600" />
                </button>
                <button
                  onClick={() => setColumns(4)}
                  className={`p-2 rounded-md transition-colors ${
                    columns === 4 ? "bg-white shadow-sm" : "hover:bg-gray-200"
                  }`}
                >
                  <LayoutGrid size={18} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Search & Filter Row */}
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex-1 max-w-xl">
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-black focus:bg-white transition-all"
                    style={{ fontFamily: "Clash Display" }}
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput("");
                        setSearchQuery("");
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </form>

              {/* Mobile Filter Toggle */}
              <div className="lg:hidden">
                <FilterToggle
                  activeCount={activeFilterCount}
                  onClick={() => setSidebarOpen(true)}
                />
              </div>
            </div>

            {/* Active Filters Pills */}
            {(filters.category ||
              filters.condition ||
              searchQuery ||
              filters.tags.length > 0) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">Active filters:</span>

                {searchQuery && (
                  <span className="inline-flex items-center gap-1 text-sm bg-black text-white px-3 py-1 rounded-full">
                    Search: {searchQuery}
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSearchInput("");
                      }}
                    >
                      <X size={14} />
                    </button>
                  </span>
                )}

                {filters.category && (
                  <span className="inline-flex items-center gap-1 text-sm bg-gray-200 text-gray-800 px-3 py-1 rounded-full">
                    {filters.category}
                    <button
                      onClick={() => handleFilterChange({ category: "" })}
                    >
                      <X size={14} />
                    </button>
                  </span>
                )}

                {filters.condition && (
                  <span className="inline-flex items-center gap-1 text-sm bg-gray-200 text-gray-800 px-3 py-1 rounded-full">
                    {filters.condition}
                    <button
                      onClick={() => handleFilterChange({ condition: "" })}
                    >
                      <X size={14} />
                    </button>
                  </span>
                )}

                {filters.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-sm bg-gray-200 text-gray-800 px-3 py-1 rounded-full"
                  >
                    #{tag}
                    <button
                      onClick={() =>
                        handleFilterChange({
                          tags: filters.tags.filter((t) => t !== tag),
                        })
                      }
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}

                <button
                  onClick={handleResetFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-32">
              <ProductFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                availableTags={availableTags}
              />
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1 min-w-0">
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
                {error}
              </div>
            )}

            <ProductGrid
              items={items}
              loading={loading}
              onLike={handleLike}
              emptyMessage="No products found"
              emptyAction={handleResetFilters}
              emptyActionLabel="Clear Filters"
              columns={columns}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalItems}
              pageSize={pageSize}
            />
          </main>
        </div>
      </div>

      {/* Mobile Filter Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl">
            <ProductFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              availableTags={availableTags}
              isMobile
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ItemsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full mx-auto mb-4" />
            <p
              className="text-gray-600"
              style={{ fontFamily: "Clash Display" }}
            >
              Loading products...
            </p>
          </div>
        </div>
      }
    >
      <ItemsPageContent />
    </Suspense>
  );
}
