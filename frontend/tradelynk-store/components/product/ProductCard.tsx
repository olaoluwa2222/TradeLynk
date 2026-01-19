// components/product/ProductCard.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Eye, Tag, Sparkles } from "lucide-react";
import { Item, getConditionLabel } from "@/types/items";

interface ProductCardProps {
  item: Item;
  onLike?: (id: number) => void;
  showQuickView?: boolean;
}

export function ProductCard({
  item,
  onLike,
  showQuickView = true,
}: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(item.likedByCurrentUser);
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    onLike?.(item.id);
  };

  // Get primary image URL
  const imageUrl =
    item.primaryImage?.imageUrl ||
    item.imageUrls?.[0] ||
    "https://via.placeholder.com/400x400?text=No+Image";

  // Get condition badge color
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "NEW":
        return "bg-emerald-500";
      case "LIKE_NEW":
        return "bg-blue-500";
      case "GOOD":
        return "bg-amber-500";
      case "FAIR":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get price display
  const priceDisplay =
    item.displayPrice ||
    (item.hasVariants && item.lowestPrice !== item.highestPrice
      ? `₦${(item.lowestPrice / 100).toLocaleString()} - ₦${(item.highestPrice / 100).toLocaleString()}`
      : `₦${(item.price / 100).toLocaleString()}`);

  return (
    <Link href={`/items/${item.slug || item.id}`}>
      <div
        className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <Image
            src={
              imageError
                ? "https://via.placeholder.com/400x400?text=No+Image"
                : imageUrl
            }
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Overlay gradient on hover */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}
          />

          {/* Badges - Top Left */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {/* Condition Badge */}
            <span
              className={`${getConditionColor(item.condition)} text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg`}
            >
              {getConditionLabel(item.condition)}
            </span>

            {/* Featured Badge */}
            {item.isFeatured && (
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Sparkles size={10} />
                Featured
              </span>
            )}

            {/* Out of Stock Badge */}
            {!item.isInStock && (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                Out of Stock
              </span>
            )}
          </div>

          {/* Like Button - Top Right */}
          <button
            onClick={handleLike}
            className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
              isLiked
                ? "bg-red-500 text-white"
                : "bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-white hover:text-red-500"
            }`}
          >
            <Heart size={18} className={isLiked ? "fill-current" : ""} />
          </button>

          {/* Quick Stats - Bottom */}
          <div
            className={`absolute bottom-3 left-3 right-3 flex items-center justify-between transition-all duration-300 ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-md">
                <Heart size={12} className="text-red-500 fill-current" />
                <span className="text-xs font-semibold text-gray-800">
                  {likeCount}
                </span>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-md">
                <Eye size={12} className="text-gray-500" />
                <span className="text-xs font-semibold text-gray-800">
                  {item.viewCount}
                </span>
              </div>
            </div>

            {/* Variants indicator */}
            {item.hasVariants && item.variants && item.variants.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md">
                <span className="text-xs font-semibold text-gray-800">
                  {item.variants.length} options
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category Tag */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              <Tag size={10} />
              {item.category}
            </span>
            {item.hasVariants && (
              <span className="text-xs text-gray-400">Multiple options</span>
            )}
          </div>

          {/* Title */}
          <h3
            className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors"
            style={{ fontFamily: "Clash Display" }}
          >
            {item.title}
          </h3>

          {/* Seller Info */}
          <p className="text-xs text-gray-500 mb-3">
            by{" "}
            <span className="font-medium text-gray-700">{item.sellerName}</span>
          </p>

          {/* Price & Action */}
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "Clash Display" }}
              >
                {priceDisplay}
              </p>
              {item.compareAtPrice && item.compareAtPrice > item.price && (
                <p className="text-xs text-gray-400 line-through">
                  ₦{(item.compareAtPrice / 100).toLocaleString()}
                </p>
              )}
            </div>

            {/* Quick Buy Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/items/${item.slug || item.id}`;
              }}
              className="px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg"
              style={{ fontFamily: "Clash Display" }}
            >
              View
            </button>
          </div>

          {/* Tags (if any) */}
          {item.tags && item.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-[10px] text-gray-400">
                  +{item.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stock Indicator (for low stock items) */}
        {item.isInStock && item.isLowStock && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500" />
        )}
      </div>
    </Link>
  );
}

// Skeleton loader for ProductCard
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-square bg-gray-200" />

      {/* Content skeleton */}
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
        <div className="h-5 bg-gray-200 rounded w-full mb-2" />
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
        <div className="h-4 bg-gray-100 rounded w-24 mb-3" />
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-24" />
          <div className="h-9 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
}
