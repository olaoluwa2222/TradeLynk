"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { itemsApi } from "@/lib/api";

interface Item {
  id: number;
  title: string;
  price: number;
  image?: string;
  imageUri?: string;
  imageUrls?: string[];
  category: string;
  condition: string;
  likeCount: number;
  viewCount: number;
  isLiked: boolean;
  sellerId: number;
  sellerName: string;
}

interface PaginationData {
  content: Item[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export default function ItemsPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filter state
  const [category, setCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [condition, setCondition] = useState<string>("");
  const [sort, setSort] = useState<string>("RECENT");

  // Sidebar visibility (mobile)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Categories list
  const categories = [
    "Electronics",
    "Books",
    "Clothing",
    "Furniture",
    "Sports",
    "Other",
  ];

  const conditions = ["NEW", "LIKE_NEW", "GOOD", "FAIR"];

  const sorts = [
    { value: "RECENT", label: "Newest First" },
    { value: "PRICE_LOW", label: "Price: Low to High" },
    { value: "PRICE_HIGH", label: "Price: High to Low" },
    { value: "TRENDING", label: "Trending" },
  ];

  // Fetch items based on filters
  const fetchItems = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await itemsApi.getAllItems(
        currentPage,
        pageSize,
        category || undefined,
        minPrice,
        maxPrice,
        condition || undefined,
        sort
      );

      if (data.success) {
        setItems(data.data.content || []);
        setTotalPages(data.data.totalPages || 0);
        setPageSize(data.data.pageSize || 10);
      } else {
        setError(data.message || "Failed to load items");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while loading items");
    } finally {
      setLoading(false);
    }
  };

  // Initialize filters from URL params
  useEffect(() => {
    const searchQuery = searchParams.get("search");
    const categoryParam = searchParams.get("category");

    if (categoryParam) {
      // Decode the category param and set it
      const decodedCategory = decodeURIComponent(categoryParam);
      setCategory(decodedCategory);
    }
  }, [searchParams]);

  // Fetch items when filters change
  useEffect(() => {
    fetchItems();
  }, [category, minPrice, maxPrice, condition, sort, currentPage]);

  // Handle like/unlike
  const handleLike = async (itemId: number, isLiked: boolean) => {
    try {
      if (isLiked) {
        await itemsApi.unlikeItem(itemId);
      } else {
        await itemsApi.likeItem(itemId);
      }

      // Update local state
      setItems(
        items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                isLiked: !isLiked,
                likeCount: isLiked ? item.likeCount - 1 : item.likeCount + 1,
              }
            : item
        )
      );
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setCategory("");
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setCondition("");
    setSort("RECENT");
    setCurrentPage(0);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-3xl md:text-4xl font-bold text-black"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 700,
                }}
              >
                Browse Items
              </h1>
              <p
                className="text-gray-600 mt-1"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                {items.length > 0
                  ? `Showing ${items.length} items`
                  : "No items found"}
              </p>
            </div>

            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <aside
            className={`lg:col-span-1 ${
              sidebarOpen ? "block" : "hidden"
            } lg:block`}
          >
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              {/* Filter Header */}
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-xl font-bold text-black"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  Filters
                </h2>
                <button
                  onClick={handleResetFilters}
                  className="text-sm text-gray-600 hover:text-black underline"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  Reset
                </button>
              </div>

              {/* Sort */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <label
                  className="block text-sm font-semibold text-black mb-3"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Sort By
                </label>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  {sorts.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <label
                  className="block text-sm font-semibold text-black mb-3"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Category
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value=""
                      checked={category === ""}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        setCurrentPage(0);
                      }}
                      className="w-4 h-4"
                    />
                    <span
                      className="text-sm text-gray-700"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      All Categories
                    </span>
                  </label>

                  {categories.map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="category"
                        value={cat}
                        checked={category === cat}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setCurrentPage(0);
                        }}
                        className="w-4 h-4"
                      />
                      <span
                        className="text-sm text-gray-700"
                        style={{
                          fontFamily: "Clash Display",
                          fontWeight: 400,
                        }}
                      >
                        {cat}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <label
                  className="block text-sm font-semibold text-black mb-3"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Price Range
                </label>
                <div className="space-y-3">
                  <div>
                    <label
                      className="text-xs text-gray-600 block mb-1"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      Min Price (₦)
                    </label>
                    <input
                      type="number"
                      value={minPrice || ""}
                      onChange={(e) => {
                        setMinPrice(
                          e.target.value ? Number(e.target.value) : undefined
                        );
                        setCurrentPage(0);
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="text-xs text-gray-600 block mb-1"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      Max Price (₦)
                    </label>
                    <input
                      type="number"
                      value={maxPrice || ""}
                      onChange={(e) => {
                        setMaxPrice(
                          e.target.value ? Number(e.target.value) : undefined
                        );
                        setCurrentPage(0);
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Condition */}
              <div className="mb-8">
                <label
                  className="block text-sm font-semibold text-black mb-3"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Condition
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="condition"
                      value=""
                      checked={condition === ""}
                      onChange={(e) => {
                        setCondition(e.target.value);
                        setCurrentPage(0);
                      }}
                      className="w-4 h-4"
                    />
                    <span
                      className="text-sm text-gray-700"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      All Conditions
                    </span>
                  </label>

                  {conditions.map((cond) => (
                    <label
                      key={cond}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="condition"
                        value={cond}
                        checked={condition === cond}
                        onChange={(e) => {
                          setCondition(e.target.value);
                          setCurrentPage(0);
                        }}
                        className="w-4 h-4"
                      />
                      <span
                        className="text-sm text-gray-700"
                        style={{
                          fontFamily: "Clash Display",
                          fontWeight: 400,
                        }}
                      >
                        {cond === "LIKE_NEW" ? "Like New" : cond}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Items Grid */}
          <main className="lg:col-span-3">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p
                    className="text-gray-600"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    Loading items...
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Items Grid */}
            {!loading && items.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={`/items/${item.id}`}
                      className="group cursor-pointer"
                    >
                      <div className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-black hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                        {/* Image Container */}
                        <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                          <Image
                            src={
                              item.imageUrls?.[0] ||
                              item.image ||
                              "https://via.placeholder.com/300x200"
                            }
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />

                          {/* Like Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleLike(item.id, item.isLiked);
                            }}
                            className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
                          >
                            <span className="text-xl">
                              {item.isLiked ? "❤️" : "🤍"}
                            </span>
                          </button>

                          {/* Condition Badge */}
                          <div className="absolute top-3 left-3">
                            <span
                              className="px-3 py-1 bg-black text-white text-xs font-bold rounded-full"
                              style={{
                                fontFamily: "Clash Display",
                                fontWeight: 700,
                              }}
                            >
                              {item.condition === "LIKE_NEW"
                                ? "Like New"
                                : item.condition}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex-1 flex flex-col">
                          {/* Category */}
                          <p
                            className="text-xs text-gray-500 mb-2"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          >
                            {item.category}
                          </p>

                          {/* Title */}
                          <h3
                            className="font-bold text-black mb-3 line-clamp-2 group-hover:text-gray-700"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 600,
                            }}
                          >
                            {item.title}
                          </h3>

                          {/* Seller Info */}
                          <p
                            className="text-xs text-gray-600 mb-3"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          >
                            by {item.sellerName}
                          </p>

                          {/* Stats - at bottom */}
                          <div className="flex items-center gap-4 justify-between mb-3 mt-auto text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <span>❤️</span>
                              <span
                                style={{
                                  fontFamily: "Clash Display",
                                  fontWeight: 500,
                                }}
                              >
                                {item.likeCount}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>👁️</span>
                              <span
                                style={{
                                  fontFamily: "Clash Display",
                                  fontWeight: 500,
                                }}
                              >
                                {item.viewCount}
                              </span>
                            </div>
                          </div>

                          {/* Price */}
                          <p
                            className="text-lg font-bold text-black"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 700,
                            }}
                          >
                            ₦{item.price.toLocaleString()}
                          </p>

                          {/* Buy Now Button */}
                          <Link
                            href={`/items/${item.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.location.href = `/items/${item.id}`;
                            }}
                            className="mt-3 w-full py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition-colors text-center text-sm"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 700,
                            }}
                          >
                            Buy Now
                          </Link>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-12 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    ← Previous
                  </button>

                  <div
                    className="flex items-center gap-2"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    {Array.from({ length: Math.min(5, totalPages) }).map(
                      (_, i) => {
                        const pageNum =
                          totalPages <= 5
                            ? i
                            : Math.max(0, currentPage - 2) + i;
                        if (pageNum >= totalPages) return null;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-lg transition-colors ${
                              pageNum === currentPage
                                ? "bg-black text-white"
                                : "border border-gray-300 hover:bg-gray-100"
                            }`}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                    }
                    disabled={currentPage >= totalPages - 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    Next →
                  </button>
                </div>

                {/* Page Info */}
                <div className="text-center mt-4">
                  <p
                    className="text-sm text-gray-600"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    Page {currentPage + 1} of {totalPages}
                  </p>
                </div>
              </>
            )}

            {/* Empty State */}
            {!loading && items.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-6xl mb-4">📦</div>
                <h3
                  className="text-2xl font-bold text-black mb-2"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  No items found
                </h3>
                <p
                  className="text-gray-600 text-center max-w-md"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Try adjusting your filters or check back later for new items.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-6 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
