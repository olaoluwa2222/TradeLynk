// components/home/MobileHome.tsx
"use client";

import Link from "next/link";
import Image from "next/image";

interface MobileHomeProps {
  trendingItems: any[];
  isFetchingTrending: boolean;
  likedItems: Set<number>;
  loadingLikes: Set<number>;
  handleLikeToggle: (itemId: number) => void;
  isAuthenticated: boolean;
  user: any;
}

export default function MobileHome({
  trendingItems,
  isFetchingTrending,
  likedItems,
  loadingLikes,
  handleLikeToggle,
  isAuthenticated,
  user,
}: MobileHomeProps) {
  const categories = [
    { name: "Electronics", href: "/items?category=ELECTRONICS", emoji: "📱" },
    { name: "Books", href: "/items?category=BOOKS", emoji: "📚" },
    { name: "Food", href: "/items?category=FOOD", emoji: "🍕" },
    { name: "Clothing", href: "/items?category=CLOTHING", emoji: "👔" },
  ];

  // Determine CTA link and text based on user status
  const getSellerCTA = () => {
    if (!isAuthenticated) {
      return { href: "/register", text: "Start Selling — Get Your Own Store" };
    }
    if (user?.role === "BUYER") {
      return {
        href: "/become-a-seller",
        text: "Start Selling — Get Your Own Store",
      };
    }
    // User is already a seller
    return { href: "/create-item", text: "List a New Product" };
  };

  const sellerCTA = getSellerCTA();

  // Show only 6 items initially on mobile
  const mobileItemLimit = 6;
  const displayedItems = trendingItems.slice(0, mobileItemLimit);
  const hasMoreItems = trendingItems.length > mobileItemLimit;

  return (
    <div className="min-h-screen bg-white">
      {/* 1. TRENDING PRODUCTS - IMMEDIATELY */}
      <section className="py-6 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-2xl font-bold text-white"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              🔥 Trending Now
            </h2>
            <Link
              href="/items"
              className="text-sm text-white font-semibold"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              See All →
            </Link>
          </div>

          {/* Loading State */}
          {isFetchingTrending ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full"></div>
            </div>
          ) : displayedItems.length > 0 ? (
            <>
              {/* Products Grid - 2 columns on mobile */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {displayedItems.map((item) => {
                  const isItemLiked =
                    item.likedByCurrentUser || likedItems.has(item.id);
                  const isLoading = loadingLikes.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className="relative rounded-lg overflow-hidden cursor-pointer bg-gray-800"
                      onClick={() => {
                        window.location.href = `/items/${item.id}`;
                      }}
                    >
                      {/* Product Image */}
                      <div className="relative h-48 w-full">
                        {item.imageUrls && item.imageUrls.length > 0 ? (
                          <Image
                            src={item.imageUrls[0]}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                            <svg
                              className="w-12 h-12 text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}

                        {/* Like Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikeToggle(item.id);
                          }}
                          disabled={isLoading}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors backdrop-blur disabled:opacity-50"
                        >
                          <svg
                            className={`w-5 h-5 ${
                              isItemLiked ? "text-red-500" : "text-white"
                            } transition-colors`}
                            fill={isItemLiked ? "currentColor" : "none"}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Product Info */}
                      <div className="p-3 bg-gray-900">
                        <h3
                          className="text-white text-sm font-semibold line-clamp-2 mb-1"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 600,
                          }}
                        >
                          {item.title}
                        </h3>
                        <p
                          className="text-white text-lg font-bold"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 700,
                          }}
                        >
                          ₦{(item.price / 100)?.toLocaleString()}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            ❤️ {item.likeCount}
                          </span>
                          <span className="flex items-center gap-1">
                            👁️ {item.viewCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* See More Button */}
              {hasMoreItems && (
                <Link
                  href="/items"
                  className="block w-full py-3 text-center bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  See All Products
                </Link>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p
                className="text-gray-400"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                No trending items available
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 2. CATEGORY CARDS - Horizontal Scroll */}
      <section className="py-6 bg-white">
        <div className="flex items-center justify-between mb-4 px-4">
          <h3
            className="text-lg font-bold"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
              color: "#0C0A09",
            }}
          >
            Shop By Category
          </h3>
          <Link
            href="/categories"
            className="text-sm text-black font-semibold"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 600,
            }}
          >
            View All →
          </Link>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-hide">
          {/* Electronics */}
          <Link
            href="/items?category=ELECTRONICS"
            className="group relative flex-shrink-0 w-64 h-48 rounded-xl overflow-hidden"
          >
            <Image
              src="/dennis-brendel-YLNMXzXk8zs-unsplash.jpg"
              alt="Electronics"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center justify-between">
                <p
                  className="text-base font-semibold text-white"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Electronics
                </p>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Books */}
          <Link
            href="/items?category=BOOKS"
            className="group relative flex-shrink-0 w-64 h-48 rounded-xl overflow-hidden"
          >
            <Image
              src="/book-library-with-open-textbook.jpg"
              alt="Books"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center justify-between">
                <p
                  className="text-base font-semibold text-white"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Books
                </p>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Food */}
          <Link
            href="/items?category=FOOD"
            className="group relative flex-shrink-0 w-64 h-48 rounded-xl overflow-hidden"
          >
            <Image
              src="/pasta-spaghetti-with-shrimps-tomato-sauce-served-plate-dark-surface-closeup.jpg"
              alt="Food"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center justify-between">
                <p
                  className="text-base font-semibold text-white"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Food
                </p>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Fashion */}
          <Link
            href="/items?category=CLOTHING"
            className="group relative flex-shrink-0 w-64 h-48 rounded-xl overflow-hidden"
          >
            <Image
              src="/woman-orange-oversized-jacket-street-style-apparel-rear-view.jpg"
              alt="Fashion"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center justify-between">
                <p
                  className="text-base font-semibold text-white"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Fashion
                </p>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. SELLER SPOTLIGHT - Design Placeholder */}
      <section className="py-6 px-4 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-lg font-bold"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
              color: "#0C0A09",
            }}
          >
            ⭐ Featured Sellers
          </h3>
          <Link
            href="/sellers"
            className="text-sm text-black font-semibold"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 600,
            }}
          >
            View All →
          </Link>
        </div>

        {/* Seller Cards - Horizontal Scroll */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {/* Seller Card 1 - Placeholder */}
          <div className="flex-shrink-0 w-64 bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                A
              </div>
              <div>
                <h4
                  className="text-sm font-bold"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  Amazing Store
                </h4>
                <p
                  className="text-xs text-gray-600"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  50+ products • ⭐ 4.8
                </p>
              </div>
            </div>
            <p
              className="text-xs text-gray-600 mb-3 line-clamp-2"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              Quality electronics and gadgets at the best prices.
            </p>
            <Link
              href="#"
              className="block w-full text-center py-2 bg-black text-white text-xs font-semibold rounded-lg"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              Visit Store
            </Link>
          </div>

          {/* Seller Card 2 - Placeholder */}
          <div className="flex-shrink-0 w-64 bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold">
                B
              </div>
              <div>
                <h4
                  className="text-sm font-bold"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  Book Haven
                </h4>
                <p
                  className="text-xs text-gray-600"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  120+ products • ⭐ 4.9
                </p>
              </div>
            </div>
            <p
              className="text-xs text-gray-600 mb-3 line-clamp-2"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              Your one-stop shop for textbooks and learning materials.
            </p>
            <Link
              href="#"
              className="block w-full text-center py-2 bg-black text-white text-xs font-semibold rounded-lg"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              Visit Store
            </Link>
          </div>
        </div>
      </section>

      {/* 4. MINI CTA - Start Selling */}
      <section className="py-8 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-md mx-auto text-center">
          <h3
            className="text-2xl font-bold text-white mb-2"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            🏪 Ready to Sell?
          </h3>
          <p
            className="text-white/90 text-sm mb-6"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            Get your own mini-website with home, about, products & contact
            sections—completely free!
          </p>
          <Link
            href={sellerCTA.href}
            className="inline-block w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-100 transition-colors"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            {sellerCTA.text} →
          </Link>
        </div>
      </section>
    </div>
  );
}
