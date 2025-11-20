"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { itemsApi } from "@/lib/api";
import { startChatWithSeller } from "@/lib/utils/chatHelpers";
import { useAuth } from "@/hooks/useAuth";

interface ItemDetails {
  id: number;
  title: string;
  description: string;
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
  sellerAvatar?: string;
  createdAt: string;
}

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const itemId = params.id as string;
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const data = await itemsApi.getItemById(itemId);
        if (data.success) {
          setItem(data.data);
          setIsLiked(data.data.isLiked || false);
        } else {
          setError(data.message || "Failed to load item");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while loading the item");
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      fetchItem();
    }
  }, [itemId]);

  const handleLike = async () => {
    try {
      if (isLiked) {
        await itemsApi.unlikeItem(itemId);
      } else {
        await itemsApi.likeItem(itemId);
      }
      setIsLiked(!isLiked);
      if (item) {
        setItem({
          ...item,
          likeCount: isLiked ? item.likeCount - 1 : item.likeCount + 1,
        });
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleChatSeller = async () => {
    if (!isAuthenticated) {
      alert("Please login to chat with the seller");
      router.push("/login");
      return;
    }

    try {
      setChatLoading(true);
      await startChatWithSeller(Number(itemId), item!.sellerId, router);
    } catch (err: any) {
      console.error("Error starting chat:", err);
      alert(err.message || "Failed to start chat. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
          <p
            className="text-gray-600"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            Loading item...
          </p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1
              className="text-3xl font-bold text-black mb-4"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              Item Not Found
            </h1>
            <p
              className="text-gray-600 mb-6"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              {error || "The item you're looking for doesn't exist."}
            </p>
            <Link
              href="/items"
              className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              Back to Items
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link
          href="/items"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-8"
          style={{
            fontFamily: "Clash Display",
            fontWeight: 500,
          }}
        >
          ← Back to Items
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <div>
            <div className="relative w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden">
              <Image
                src={
                  item.imageUrls?.[0] ||
                  item.image ||
                  "https://via.placeholder.com/500"
                }
                alt={item.title}
                fill
                className="object-cover"
                priority
              />

              {/* Condition Badge */}
              <div className="absolute top-4 left-4">
                <span
                  className="px-4 py-2 bg-black text-white text-sm font-bold rounded-full"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  {item.condition === "LIKE_NEW" ? "Like New" : item.condition}
                </span>
              </div>

              {/* Like Button */}
              <button
                onClick={handleLike}
                className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
              >
                <span className="text-2xl">{isLiked ? "❤️" : "🤍"}</span>
              </button>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p
                  className="text-sm text-gray-600 mb-1"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Likes
                </p>
                <p
                  className="text-2xl font-bold text-black"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  ❤️ {item.likeCount}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p
                  className="text-sm text-gray-600 mb-1"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Views
                </p>
                <p
                  className="text-2xl font-bold text-black"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  👁️ {item.viewCount}
                </p>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div>
            {/* Category */}
            <p
              className="text-sm text-gray-500 mb-2"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              {item.category}
            </p>

            {/* Title */}
            <h1
              className="text-4xl font-bold text-black mb-4"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              {item.title}
            </h1>

            {/* Price */}
            <div className="mb-8">
              <p
                className="text-gray-600 text-sm mb-2"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Price
              </p>
              <p
                className="text-4xl font-bold text-black"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 700,
                }}
              >
                ₦{item.price.toLocaleString()}
              </p>
            </div>

            {/* Description */}
            <div className="mb-8">
              <p
                className="text-gray-600 text-sm mb-2"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Description
              </p>
              <p
                className="text-gray-700 leading-relaxed"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                {item.description || "No description provided."}
              </p>
            </div>

            {/* Seller Info */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p
                className="text-sm text-gray-600 mb-3"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Seller Information
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                  <span className="text-white font-bold">
                    {item.sellerName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p
                    className="font-semibold text-black"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    {item.sellerName}
                  </p>
                  <p
                    className="text-xs text-gray-500"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    Campus Seller
                  </p>
                </div>
              </div>
            </div>

            {/* Item Details */}
            <div className="mb-8 space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <p
                  className="text-sm text-gray-600"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  Posted
                </p>
                <p
                  className="text-sm text-black"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <p
                  className="text-sm text-gray-600"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  Condition
                </p>
                <p
                  className="text-sm text-black font-semibold"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  {item.condition === "LIKE_NEW" ? "Like New" : item.condition}
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleChatSeller}
                disabled={chatLoading}
                className="w-full py-4 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 700,
                }}
              >
                {chatLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Starting Chat...
                  </>
                ) : (
                  <>
                    💬 Chat with Seller
                    <span>→</span>
                  </>
                )}
              </button>
              <button
                className="w-full py-4 border-2 border-black text-black font-bold rounded-lg hover:bg-gray-50 transition-colors"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 700,
                }}
              >
                Report Item
              </button>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p
                className="text-xs text-blue-900"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 500,
                }}
              >
                💡 Always meet in a safe, public location. Verify item condition
                before making payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
