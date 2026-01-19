// app/items/[id]/page.tsx - Redesigned Product Detail Page
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { itemsApi } from "@/lib/api";
import { startChatWithSeller } from "@/lib/utils/chatHelpers";
import { useAuth } from "@/hooks/useAuth";
import { Item } from "@/types/items";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ProductGrid } from "@/components/product/ProductGrid";

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const itemId = params.id as string;

  const [item, setItem] = useState<Item | null>(null);
  const [relatedItems, setRelatedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Fetch item details
  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const response = await itemsApi.getItemById(itemId);

        if (response.success && response.data) {
          console.log(
            "📦 Fetched item data:",
            JSON.stringify(response.data, null, 2),
          );
          setItem(response.data);

          // Fetch related items
          try {
            const relatedResponse = await itemsApi.getRelatedItems(
              response.data.id,
              4,
            );
            if (relatedResponse.success && relatedResponse.data) {
              setRelatedItems(relatedResponse.data);
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

  // Handle like for related items
  const handleRelatedLike = async (relatedItemId: number) => {
    if (!isAuthenticated) {
      toast.error("Please login to like products");
      return;
    }

    try {
      const relatedItem = relatedItems.find((i) => i.id === relatedItemId);
      if (!relatedItem) return;

      if (relatedItem.likedByCurrentUser) {
        await itemsApi.unlikeItem(relatedItemId);
      } else {
        await itemsApi.likeItem(relatedItemId);
      }

      setRelatedItems((prev) =>
        prev.map((i) =>
          i.id === relatedItemId
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

      {/* Related Products */}
      {relatedItems.length > 0 && (
        <section className="bg-white border-t border-gray-100 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2
                  className="text-2xl font-bold text-gray-900"
                  style={{ fontFamily: "Clash Display" }}
                >
                  Related Products
                </h2>
                <p className="text-gray-500 mt-1">You might also like these</p>
              </div>
              <Link
                href={`/items?category=${item.category}`}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1"
                style={{ fontFamily: "Clash Display" }}
              >
                View All
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
    </div>
  );
}
