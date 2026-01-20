// app/items/[id]/page.tsx - Redesigned Product Detail Page
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Store, Sparkles, TrendingUp } from "lucide-react";
import { itemsApi } from "@/lib/api";
import { startChatWithSeller } from "@/lib/utils/chatHelpers";
import { useAuth } from "@/hooks/useAuth";
import { Item } from "@/types/items";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ProductGrid } from "@/components/product/ProductGrid";

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const itemId = params.id as string;

  // Check if user came from a seller's storefront (to show seller-specific related items)
  const fromStorefront = searchParams.get("from") === "storefront";
  const sellerUsername = searchParams.get("seller");

  const [item, setItem] = useState<Item | null>(null);
  const [relatedItems, setRelatedItems] = useState<Item[]>([]);
  const [sellerOtherItems, setSellerOtherItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Fetch item details
  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        setRelatedLoading(true);
        const response = await itemsApi.getItemById(itemId);

        if (response.success && response.data) {
          console.log(
            "📦 Fetched item data:",
            JSON.stringify(response.data, null, 2),
          );
          setItem(response.data);

          // Fetch related items - both from same seller and similar category
          const sellerId = response.data.sellerId;

          // Always fetch seller's other items (for "More from this seller" section)
          try {
            const sellerItemsResponse = await itemsApi.getSellerRelatedItems(
              sellerId,
              response.data.id,
              4,
            );
            if (sellerItemsResponse.success && sellerItemsResponse.data) {
              setSellerOtherItems(sellerItemsResponse.data);
            }
          } catch (sellerErr) {
            console.log("Could not fetch seller's other items");
          }

          // Fetch category-related items (similar products from any seller)
          try {
            const relatedResponse = await itemsApi.getRelatedItems(
              response.data.id,
              4,
            );
            if (relatedResponse.success && relatedResponse.data) {
              // Filter out items from the same seller to avoid duplicates
              const filteredRelated = relatedResponse.data.filter(
                (relatedItem: Item) => relatedItem.sellerId !== sellerId,
              );
              setRelatedItems(filteredRelated);
            }
          } catch (relatedErr) {
            console.log("Could not fetch related items");
          }
        } else {
          setError(response.message || "Failed to load product");
        }
      } catch (err: any) {
        console.error("Error fetching item:", err);
        setError(err.message || "An error occurred while loading the product");
      } finally {
        setLoading(false);
        setRelatedLoading(false);
      }
    };

    if (itemId) {
      fetchItem();
    }
  }, [itemId]);

  // Handle like/unlike
  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to like products");
      router.push(`/login?redirect=/items/${itemId}`);
      return;
    }

    if (!item) return;

    try {
      setLikeLoading(true);
      if (item.likedByCurrentUser) {
        await itemsApi.unlikeItem(item.id);
      } else {
        await itemsApi.likeItem(item.id);
      }

      setItem({
        ...item,
        likedByCurrentUser: !item.likedByCurrentUser,
        likeCount: item.likedByCurrentUser
          ? item.likeCount - 1
          : item.likeCount + 1,
      });
    } catch (err) {
      console.error("Error toggling like:", err);
      toast.error("Failed to update like");
    } finally {
      setLikeLoading(false);
    }
  };

  // Handle chat with seller
  const handleChat = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to chat with the seller");
      router.push(`/login?redirect=/items/${itemId}`);
      return;
    }

    if (!item) return;

    try {
      setChatLoading(true);
      await startChatWithSeller(item.id, item.sellerId, router);
    } catch (err: any) {
      console.error("Error starting chat:", err);
      toast.error(err.message || "Failed to start chat. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  // Handle buy
  const handleBuy = () => {
    if (!isAuthenticated) {
      toast.error("Please login to purchase products");
      router.push(`/login?redirect=/items/${itemId}`);
      return;
    }

    router.push(`/checkout?itemId=${itemId}`);
  };

  // Handle like for related items (both seller items and similar products)
  const handleRelatedLike = async (relatedItemId: number) => {
    if (!isAuthenticated) {
      toast.error("Please login to like products");
      return;
    }

    try {
      // Find the item in either array
      const relatedItem =
        relatedItems.find((i) => i.id === relatedItemId) ||
        sellerOtherItems.find((i) => i.id === relatedItemId);
      if (!relatedItem) return;

      if (relatedItem.likedByCurrentUser) {
        await itemsApi.unlikeItem(relatedItemId);
      } else {
        await itemsApi.likeItem(relatedItemId);
      }

      // Update function for both arrays
      const updateLikeState = (items: Item[]) =>
        items.map((i) =>
          i.id === relatedItemId
            ? {
                ...i,
                likedByCurrentUser: !i.likedByCurrentUser,
                likeCount: i.likedByCurrentUser
                  ? i.likeCount - 1
                  : i.likeCount + 1,
              }
            : i,
        );

      setRelatedItems(updateLikeState);
      setSellerOtherItems(updateLikeState);
    } catch (err) {
      console.error("Error toggling like:", err);
      toast.error("Failed to update like");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600" style={{ fontFamily: "Clash Display" }}>
            Loading product...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📦</span>
            </div>
            <h1
              className="text-3xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "Clash Display" }}
            >
              Product Not Found
            </h1>
            <p
              className="text-gray-600 mb-8 max-w-md mx-auto"
              style={{ fontFamily: "Clash Display" }}
            >
              {error ||
                "The product you're looking for doesn't exist or has been removed."}
            </p>
            <Link
              href="/items"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
              style={{ fontFamily: "Clash Display" }}
            >
              <ArrowLeft size={18} />
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Navigation */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/items"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            style={{ fontFamily: "Clash Display" }}
          >
            <ArrowLeft size={18} />
            <span>Back to Products</span>
          </Link>
        </div>
      </div>

      {/* Product Detail */}
      <ProductDetail
        item={item}
        onLike={handleLike}
        onChat={handleChat}
        onBuy={handleBuy}
        isLiking={likeLoading}
        isChatting={chatLoading}
      />

      {/* More from this Seller - Always show first */}
      {sellerOtherItems.length > 0 && (
        <section className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-100 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-black rounded-xl">
                  <Store size={20} className="text-white" />
                </div>
                <div>
                  <h2
                    className="text-2xl font-bold text-gray-900"
                    style={{ fontFamily: "Clash Display" }}
                  >
                    More from this Seller
                  </h2>
                  <p className="text-gray-500 mt-0.5 text-sm">
                    {item.sellerName
                      ? `Check out more from ${item.sellerName}`
                      : "Explore other products from this seller"}
                  </p>
                </div>
              </div>
              {item.sellerUsername && (
                <Link
                  href={`/sellers/${item.sellerUsername}`}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all"
                  style={{ fontFamily: "Clash Display" }}
                >
                  <span>Visit Store</span>
                  <ArrowLeft size={14} className="rotate-180" />
                </Link>
              )}
            </div>

            <ProductGrid
              items={sellerOtherItems}
              onLike={handleRelatedLike}
              columns={4}
            />

            {/* Mobile CTA */}
            {item.sellerUsername && (
              <div className="mt-6 sm:hidden">
                <Link
                  href={`/sellers/${item.sellerUsername}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all"
                  style={{ fontFamily: "Clash Display" }}
                >
                  <Store size={18} />
                  <span>Visit Seller's Store</span>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Similar Products - From other sellers */}
      {relatedItems.length > 0 && (
        <section className="bg-white border-t border-gray-100 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h2
                    className="text-2xl font-bold text-gray-900"
                    style={{ fontFamily: "Clash Display" }}
                  >
                    Similar Products
                  </h2>
                  <p className="text-gray-500 mt-0.5 text-sm">
                    Discover similar items you might love
                  </p>
                </div>
              </div>
              <Link
                href={`/items?category=${item.category}`}
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-all"
                style={{ fontFamily: "Clash Display" }}
              >
                View All in {item.category?.replace(/_/g, " ")}
                <ArrowLeft size={14} className="rotate-180" />
              </Link>
            </div>

            <ProductGrid
              items={relatedItems}
              onLike={handleRelatedLike}
              columns={4}
            />
          </div>
        </section>
      )}

      {/* Loading state for related items */}
      {relatedLoading &&
        sellerOtherItems.length === 0 &&
        relatedItems.length === 0 && (
          <section className="bg-white border-t border-gray-100 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-gray-200 rounded-xl animate-pulse w-10 h-10" />
                <div>
                  <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-64 animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-100 rounded-2xl aspect-[4/5] animate-pulse"
                  />
                ))}
              </div>
            </div>
          </section>
        )}

      {/* Empty state - No related products */}
      {!relatedLoading &&
        sellerOtherItems.length === 0 &&
        relatedItems.length === 0 && (
          <section className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-100 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp size={28} className="text-gray-400" />
                </div>
                <h3
                  className="text-lg font-bold text-gray-900 mb-2"
                  style={{ fontFamily: "Clash Display" }}
                >
                  Explore More Products
                </h3>
                <p className="text-gray-500 mb-6 text-sm">
                  Discover thousands of amazing products on TradeLynk
                </p>
                <Link
                  href="/items"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
                  style={{ fontFamily: "Clash Display" }}
                >
                  Browse All Products
                  <ArrowLeft size={16} className="rotate-180" />
                </Link>
              </div>
            </div>
          </section>
        )}
    </div>
  );
}
