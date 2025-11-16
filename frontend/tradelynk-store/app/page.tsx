// app/page.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { itemsApi } from "@/lib/api";
import Footer from "@/components/Footer";

export default function Home() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [trendingItems, setTrendingItems] = useState<any[]>([]);
  const [isFetchingTrending, setIsFetchingTrending] = useState(false);
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());
  const [loadingLikes, setLoadingLikes] = useState<Set<number>>(new Set());

  // Fetch trending items on component mount
  useEffect(() => {
    const fetchTrendingItems = async () => {
      try {
        setIsFetchingTrending(true);
        const data = await itemsApi.getTrendingItems(7, 8);

        if (data.success && Array.isArray(data.data)) {
          setTrendingItems(data.data);
        }
      } catch (error) {
        console.error("Error fetching trending items:", error);
      } finally {
        setIsFetchingTrending(false);
      }
    };

    fetchTrendingItems();
  }, []);

  // Handle like/unlike
  const handleLikeToggle = async (itemId: number) => {
    if (!isAuthenticated) {
      alert("Please login to like items");
      return;
    }

    try {
      setLoadingLikes((prev) => new Set([...prev, itemId]));
      const isLiked = likedItems.has(itemId);

      if (isLiked) {
        await itemsApi.unlikeItem(itemId);
        setLikedItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      } else {
        await itemsApi.likeItem(itemId);
        setLikedItems((prev) => new Set([...prev, itemId]));
      }

      // Update the item's like count
      setTrendingItems((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              likeCount: isLiked ? item.likeCount - 1 : item.likeCount + 1,
              likedByCurrentUser: !isLiked,
            };
          }
          return item;
        })
      );
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("Failed to update like status");
    } finally {
      setLoadingLikes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/growtika-mlpsHpUUCHY-unsplash.jpg"
            alt="Campus Marketplace Hero"
            fill
            className="object-cover"
            priority
          />
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="space-y-6">
            <h1
              className="text-5xl md:text-6xl font-bold text-white mb-6"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              🎓 Buy & Sell Within Landmark University
            </h1>

            <p
              className="text-lg md:text-xl text-gray-100 mb-8 leading-relaxed max-w-2xl mx-auto"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              Discover amazing deals from fellow students. No need to leave
              campus—everything you need, right at your fingertips.
            </p>

            {isAuthenticated ? (
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                <Link
                  href="/shop"
                  className="px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors inline-block"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Browse Items
                </Link>
                {(user?.role === "SELLER" ||
                  user?.role === "BOTH" ||
                  user?.role === "ADMIN") && (
                  <Link
                    href="/items/create"
                    className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors inline-block"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    Start Selling
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                <Link
                  href="/register"
                  className="px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors inline-block"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Browse Items
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-3 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white/10 transition-colors inline-block"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Start Selling
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Shop By Category Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2
              className="text-4xl font-bold"
              style={{
                color: "#0C0A09",
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              Shop By Category
            </h2>
            <Link
              href="/categories"
              className="flex items-center gap-2 px-6 py-2 rounded-full bg-black text-white hover:bg-gray-900 transition-colors"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              View All
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Electronics */}
            <Link
              href="/category/electronics"
              className="group relative h-96 rounded-2xl overflow-hidden cursor-pointer"
            >
              <Image
                src="/dennis-brendel-YLNMXzXk8zs-unsplash.jpg"
                alt="Electronics"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-all duration-300"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-0 group-hover:translate-y-0">
                <div className="flex items-center justify-between">
                  <p
                    className="text-lg font-semibold text-white"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    Electronics
                  </p>
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <svg
                      className="w-5 h-5 text-black"
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
              href="/category/books"
              className="group relative h-96 rounded-2xl overflow-hidden cursor-pointer"
            >
              <Image
                src="/book-library-with-open-textbook.jpg"
                alt="Books"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-all duration-300"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center justify-between">
                  <p
                    className="text-lg font-semibold text-white"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    Books
                  </p>
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <svg
                      className="w-5 h-5 text-black"
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
              href="/category/food"
              className="group relative h-96 rounded-2xl overflow-hidden cursor-pointer"
            >
              <Image
                src="/pasta-spaghetti-with-shrimps-tomato-sauce-served-plate-dark-surface-closeup.jpg"
                alt="Food"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-all duration-300"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center justify-between">
                  <p
                    className="text-lg font-semibold text-white"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    Food
                  </p>
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <svg
                      className="w-5 h-5 text-black"
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
              href="/category/fashion"
              className="group relative h-96 rounded-2xl overflow-hidden cursor-pointer"
            >
              <Image
                src="/woman-orange-oversized-jacket-street-style-apparel-rear-view.jpg"
                alt="Fashion"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-all duration-300"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center justify-between">
                  <p
                    className="text-lg font-semibold text-white"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    Fashion
                  </p>
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <svg
                      className="w-5 h-5 text-black"
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
        </div>
      </section>

      {/* Trending Items Section */}
      <section className="py-20 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2
              className="text-4xl font-bold text-white"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              Trending Now
            </h2>
            <Link
              href="/trending"
              className="flex items-center gap-2 px-6 py-2 rounded-full bg-white text-black hover:bg-gray-200 transition-colors"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              See All
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {/* Loading State */}
          {isFetchingTrending ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full"></div>
            </div>
          ) : trendingItems.length > 0 ? (
            // Trending Items Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingItems.map((item) => {
                const isItemLiked =
                  item.likedByCurrentUser || likedItems.has(item.id);
                const isLoading = loadingLikes.has(item.id);

                return (
                  <div
                    key={item.id}
                    className="group relative h-80 rounded-xl overflow-hidden cursor-pointer bg-gray-800"
                  >
                    {/* Item Image */}
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                      <Image
                        src={item.imageUrls[0]}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <svg
                          className="w-16 h-16 text-gray-600"
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

                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all duration-300"></div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-between p-4">
                      {/* Like Button (Top Right) */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleLikeToggle(item.id)}
                          disabled={isLoading}
                          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors backdrop-blur disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className={`w-6 h-6 ${
                              isItemLiked ? "text-red-500" : "text-white"
                            } transition-colors drop-shadow-lg`}
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

                      {/* Bottom Section with gradient overlay */}
                      <div className="space-y-3">
                        {/* Item Info */}
                        <div>
                          <h3
                            className="text-white font-semibold line-clamp-2 mb-1"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 600,
                              fontSize: "14px",
                            }}
                          >
                            {item.title}
                          </h3>

                          {/* Price */}
                          <p
                            className="text-xl font-bold text-white"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 700,
                            }}
                          >
                            ₦{item.price?.toLocaleString()}
                          </p>
                        </div>

                        {/* Stats Row - Instagram Style */}
                        <div className="flex items-center gap-4 pt-2 border-t border-white/20">
                          {/* Likes */}
                          <div className="flex items-center gap-1.5">
                            <svg
                              className="w-4 h-4 text-red-500"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span
                              className="text-xs text-white font-semibold"
                              style={{
                                fontFamily: "Clash Display",
                                fontWeight: 600,
                              }}
                            >
                              {item.likeCount}
                            </span>
                          </div>

                          {/* Views */}
                          <div className="flex items-center gap-1.5">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            <span
                              className="text-xs text-white font-semibold"
                              style={{
                                fontFamily: "Clash Display",
                                fontWeight: 600,
                              }}
                            >
                              {item.viewCount}
                            </span>
                          </div>

                          {/* Buy Now Link */}
                          <Link
                            href={`/item/${item.id}`}
                            className="ml-auto text-xs text-white font-bold hover:text-gray-200 transition-colors"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 700,
                            }}
                          >
                            View →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p
                className="text-gray-400 text-lg"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                No trending items available at the moment
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Why Students Love TradeLynk Section */}
      <section className="w-full py-20 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/vitaly-gariev-1JnN9QhmTGU-unsplash.jpg')",
          }}
        >
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-3"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              Why Students Love TradeLynk
            </h2>
            <div className="h-1 w-20 bg-linear-to-r from-blue-500 to-purple-600 mx-auto"></div>
          </div>

          {/* Features Grid - 2x3 Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Safe & Verified */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 hover:bg-white/20 transition-all duration-300 border border-white/20">
              <div className="text-4xl mb-4">✅</div>
              <h3
                className="text-xl font-bold text-white mb-3"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Safe & Verified
              </h3>
              <p
                className="text-gray-200 text-sm leading-relaxed"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Only Landmark students can buy and sell. Verified transactions
                you can trust.
              </p>
            </div>

            {/* Feature 2: Fast & Convenient */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 hover:bg-white/20 transition-all duration-300 border border-white/20">
              <div className="text-4xl mb-4">🚀</div>
              <h3
                className="text-xl font-bold text-white mb-3"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Fast & Convenient
              </h3>
              <p
                className="text-gray-200 text-sm leading-relaxed"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                No need to leave campus. Get what you need delivered right to
                your door.
              </p>
            </div>

            {/* Feature 3: Best Prices */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 hover:bg-white/20 transition-all duration-300 border border-white/20">
              <div className="text-4xl mb-4">💰</div>
              <h3
                className="text-xl font-bold text-white mb-3"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Best Prices
              </h3>
              <p
                className="text-gray-200 text-sm leading-relaxed"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Direct from students. No middleman, just great deals between
                peers.
              </p>
            </div>

            {/* Feature 4: Easy Communication */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 hover:bg-white/20 transition-all duration-300 border border-white/20">
              <div className="text-4xl mb-4">💬</div>
              <h3
                className="text-xl font-bold text-white mb-3"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Easy Communication
              </h3>
              <p
                className="text-gray-200 text-sm leading-relaxed"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Built-in chat system. Message sellers directly and ask questions
                instantly.
              </p>
            </div>

            {/* Feature 5: Student Community */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 hover:bg-white/20 transition-all duration-300 border border-white/20">
              <div className="text-4xl mb-4">👥</div>
              <h3
                className="text-xl font-bold text-white mb-3"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Student Community
              </h3>
              <p
                className="text-gray-200 text-sm leading-relaxed"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Buy and sell with your classmates. Support fellow students on
                campus.
              </p>
            </div>

            {/* Feature 6: Secure Transactions */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 hover:bg-white/20 transition-all duration-300 border border-white/20">
              <div className="text-4xl mb-4">🔒</div>
              <h3
                className="text-xl font-bold text-white mb-3"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Secure Transactions
              </h3>
              <p
                className="text-gray-200 text-sm leading-relaxed"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Your data is protected. Safe payment methods and secure
                messaging.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-16">
            <Link
              href="/register"
              className="inline-block px-8 py-3 bg-linear-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              Join TradeLynk Today
            </Link>
          </div>
        </div>
      </section>

      {/* How Landmark Marketplace Works Section */}
      <section className="w-full py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-3"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              How TradeLynk Works
            </h2>
            <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto"></div>
          </div>

          {/* Steps Container */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Step 1: Browse */}
            <div className="flex flex-col items-center">
              {/* Step Number Circle */}
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-6 shadow-lg transform hover:scale-110 transition-transform duration-300 hover:bg-white/20">
                <span
                  className="text-3xl font-bold"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  1️⃣
                </span>
              </div>

              {/* Step Title */}
              <h3
                className="text-2xl font-bold text-white mb-3 text-center"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Browse
              </h3>

              {/* Step Description */}
              <p
                className="text-gray-300 text-center leading-relaxed"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Find the perfect item from fellow students. Explore thousands of
                listings updated daily.
              </p>

              {/* Arrow to next step */}
              <div className="hidden md:block absolute text-3xl text-gray-400 translate-x-96 -translate-y-4">
                →
              </div>
            </div>

            {/* Step 2: Chat */}
            <div className="flex flex-col items-center">
              {/* Step Number Circle */}
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-6 shadow-lg transform hover:scale-110 transition-transform duration-300 hover:bg-white/20">
                <span
                  className="text-3xl font-bold"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  2️⃣
                </span>
              </div>

              {/* Step Title */}
              <h3
                className="text-2xl font-bold text-white mb-3 text-center"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Chat
              </h3>

              {/* Step Description */}
              <p
                className="text-gray-300 text-center leading-relaxed"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Message the seller to negotiate, ask questions, and discuss
                details in real-time.
              </p>

              {/* Arrow to next step */}
              <div className="hidden md:block absolute text-3xl text-gray-400 translate-x-96 -translate-y-4">
                →
              </div>
            </div>

            {/* Step 3: Meet */}
            <div className="flex flex-col items-center">
              {/* Step Number Circle */}
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-6 shadow-lg transform hover:scale-110 transition-transform duration-300 hover:bg-white/20">
                <span
                  className="text-3xl font-bold"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  3️⃣
                </span>
              </div>

              {/* Step Title */}
              <h3
                className="text-2xl font-bold text-white mb-3 text-center"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Meet & Complete
              </h3>

              {/* Step Description */}
              <p
                className="text-gray-300 text-center leading-relaxed"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Arrange delivery on campus and complete your transaction safely.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-16">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              Start Browsing
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Got Something to Sell Section */}
      <section className="w-full py-24 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('/black-friday-assortment-with-shopping-carts.jpg')",
          }}
        >
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/70"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            {/* Main Headline */}
            <div>
              <h2
                className="text-5xl md:text-6xl font-bold text-white mb-4"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 700,
                }}
              >
                Got something to sell?
              </h2>
              <p
                className="text-xl text-white/90"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                List it in minutes!
              </p>
            </div>

            {/* Subheading */}
            <div>
              <p
                className="text-lg md:text-xl text-gray-200"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 500,
                }}
              >
                Join <span className="text-white font-bold">200+</span> students
                already buying and selling on campus
              </p>
            </div>

            {/* Stats Row */}
            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div
                  className="text-3xl font-bold text-white"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  200+
                </div>
                <div
                  className="text-sm text-gray-300 mt-1"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Active Students
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div
                  className="text-3xl font-bold text-white"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  1000+
                </div>
                <div
                  className="text-sm text-gray-300 mt-1"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Items Listed
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div
                  className="text-3xl font-bold text-white"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  24/7
                </div>
                <div
                  className="text-sm text-gray-300 mt-1"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Support
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 700,
                }}
              >
                <span>Start Selling Now</span>
                <span>→</span>
              </Link>

              <Link
                href="/browse"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 700,
                }}
              >
                <span>View All Items</span>
                <span>→</span>
              </Link>
            </div>

            {/* Additional Info */}
            <div
              className="text-sm text-gray-300 pt-4"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              No verification fee • Free listings • Secure transactions
            </div>
          </div>
        </div>
      </section>

      {/* Additional sections will be added here */}
      {/* Services Section */}

      {/* Footer */}
      <Footer />
    </div>
  );
}
