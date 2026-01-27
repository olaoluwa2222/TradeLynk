// components/product/ProductDetail.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Share2,
  MessageCircle,
  ShoppingCart,
  CheckCircle,
  MapPin,
  Calendar,
  Eye,
  Tag,
  ChevronRight,
  Package,
  Truck,
  Shield,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { getSellerUrl } from "@/lib/utils/sellerUrls";
import {
  Item,
  ProductVariant,
  getConditionLabel,
  getStockStatus,
} from "@/types/items";
import { ImageGallery } from "./ImageGallery";
import { VariantSelector } from "./VariantSelector";

interface ProductDetailProps {
  item: Item;
  onLike?: () => void;
  onChat?: () => void;
  onBuy?: () => void;
  isLiking?: boolean;
  isChatting?: boolean;
}

export function ProductDetail({
  item,
  onLike,
  onChat,
  onBuy,
  isLiking = false,
  isChatting = false,
}: ProductDetailProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );

  // Initialize selectedVariant when item variants are loaded
  React.useEffect(() => {
    if (
      item.hasVariants &&
      item.variants &&
      item.variants.length > 0 &&
      !selectedVariant
    ) {
      setSelectedVariant(item.variants[0]);
    }
  }, [item.hasVariants, item.variants, selectedVariant]);
  const [isLiked, setIsLiked] = useState(item.likedByCurrentUser);
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const [copied, setCopied] = useState(false);

  // Get current price based on selected variant
  const currentPrice = selectedVariant?.effectivePrice || item.price;
  const formattedPrice = `₦${(currentPrice / 100).toLocaleString()}`;

  // Handle like
  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    onLike?.();
  };

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `Check out ${item.title} on TradeLynk`,
          url,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Check if can buy
  const canBuy = item.hasVariants
    ? (selectedVariant?.isInStock ?? item.isInStock)
    : item.isInStock;

  // Stock status
  const stockStatus =
    item.hasVariants && selectedVariant
      ? {
          label: selectedVariant.isInStock
            ? selectedVariant.isLowStock
              ? `Low stock: ${selectedVariant.stock} left`
              : `${selectedVariant.stock} in stock`
            : "Out of stock",
          color: selectedVariant.isInStock
            ? selectedVariant.isLowStock
              ? "orange"
              : "green"
            : "red",
        }
      : getStockStatus(item);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column - Images */}
        <div>
          <ImageGallery
            images={item.images || []}
            title={item.title}
            primaryImageUrl={item.primaryImage?.imageUrl}
          />

          {/* Stats (visible on mobile) */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:hidden">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Heart size={14} className="text-red-500" />
                Likes
              </div>
              <p
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: "Clash Display" }}
              >
                {likeCount}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Eye size={14} className="text-blue-500" />
                Views
              </div>
              <p
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: "Clash Display" }}
              >
                {item.viewCount}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link
              href="/items"
              className="hover:text-gray-700 transition-colors"
            >
              Products
            </Link>
            <ChevronRight size={14} />
            <Link
              href={`/items?category=${item.category}`}
              className="hover:text-gray-700 transition-colors"
            >
              {item.category}
            </Link>
            <ChevronRight size={14} />
            <span className="text-gray-900 truncate max-w-[150px]">
              {item.title}
            </span>
          </nav>

          {/* Category & Condition */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
              <Tag size={10} />
              {item.category}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                item.condition === "NEW"
                  ? "bg-emerald-100 text-emerald-700"
                  : item.condition === "LIKE_NEW"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {getConditionLabel(item.condition)}
            </span>
            {item.isFeatured && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
                Featured
              </span>
            )}
          </div>

          {/* Title */}
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "Clash Display" }}
          >
            {item.title}
          </h1>

          {/* Price */}
          <div className="mb-6">
            {item.hasVariants && item.lowestPrice !== item.highestPrice ? (
              <div>
                <p className="text-sm text-gray-500 mb-1">Price Range</p>
                <p
                  className="text-3xl font-bold text-gray-900"
                  style={{ fontFamily: "Clash Display" }}
                >
                  {item.displayPrice}
                </p>
              </div>
            ) : (
              <p
                className="text-3xl font-bold text-gray-900"
                style={{ fontFamily: "Clash Display" }}
              >
                {formattedPrice}
              </p>
            )}
            {item.compareAtPrice && item.compareAtPrice > item.price && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg text-gray-400 line-through">
                  ₦{(item.compareAtPrice / 100).toLocaleString()}
                </span>
                <span className="text-sm font-bold text-green-600">
                  {Math.round((1 - item.price / item.compareAtPrice) * 100)}%
                  OFF
                </span>
              </div>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2 mb-6">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                stockStatus.color === "green"
                  ? "bg-green-500"
                  : stockStatus.color === "orange"
                    ? "bg-orange-500"
                    : "bg-red-500"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                stockStatus.color === "green"
                  ? "text-green-600"
                  : stockStatus.color === "orange"
                    ? "text-orange-600"
                    : "text-red-600"
              }`}
            >
              {stockStatus.label}
            </span>
          </div>

          {/* Variant Selector */}
          {item.hasVariants && item.variants && item.variants.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <VariantSelector
                variants={item.variants}
                selectedVariant={selectedVariant}
                onSelect={setSelectedVariant}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 mb-8">
            <button
              onClick={onBuy}
              disabled={!canBuy}
              className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              style={{ fontFamily: "Clash Display" }}
            >
              <ShoppingCart size={20} />
              {canBuy ? "Buy Now" : "Out of Stock"}
            </button>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={onChat}
                disabled={isChatting}
                className="py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ fontFamily: "Clash Display" }}
              >
                {isChatting ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MessageCircle size={18} />
                )}
                <span className="hidden sm:inline">Chat</span>
              </button>

              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`py-3 border-2 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  isLiked
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                style={{ fontFamily: "Clash Display" }}
              >
                <Heart size={18} className={isLiked ? "fill-current" : ""} />
                <span className="hidden sm:inline">{likeCount}</span>
              </button>

              <button
                onClick={handleShare}
                className="py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                style={{ fontFamily: "Clash Display" }}
              >
                {copied ? (
                  <Check size={18} className="text-green-500" />
                ) : (
                  <Share2 size={18} />
                )}
                <span className="hidden sm:inline">
                  {copied ? "Copied!" : "Share"}
                </span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3
              className="text-lg font-bold text-gray-900 mb-3"
              style={{ fontFamily: "Clash Display" }}
            >
              Description
            </h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {item.description || "No description provided."}
            </p>
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="mb-6">
              <h3
                className="text-sm font-semibold text-gray-700 mb-2"
                style={{ fontFamily: "Clash Display" }}
              >
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag, idx) => (
                  <Link
                    key={idx}
                    href={`/items?tag=${encodeURIComponent(tag)}`}
                    className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Seller Card */}
          <div className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 mb-6">
            <h3
              className="text-sm font-semibold text-gray-700 mb-4"
              style={{ fontFamily: "Clash Display" }}
            >
              Seller Information
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center text-white text-xl font-bold">
                {item.sellerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className="font-bold text-gray-900"
                    style={{ fontFamily: "Clash Display" }}
                  >
                    {item.sellerName}
                  </p>
                  <CheckCircle
                    size={14}
                    className="text-blue-500 fill-blue-100"
                  />
                </div>
                <p className="text-xs text-gray-500">@{item.sellerUsername}</p>
              </div>
              <Link
                href={getSellerUrl(item.sellerUsername)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                View Store
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>

          {/* Product Details Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-0.5">Posted</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-0.5">SKU</p>
              <p className="text-sm font-mono text-gray-900">{item.sku}</p>
            </div>
            {item.weightInGrams && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-0.5">Weight</p>
                <p className="text-sm font-medium text-gray-900">
                  {item.weightInGrams}g
                </p>
              </div>
            )}
            {item.hasVariants && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-0.5">Variants</p>
                <p className="text-sm font-medium text-gray-900">
                  {item.variants?.length || 0} options
                </p>
              </div>
            )}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <div className="text-center">
              <Shield size={24} className="mx-auto text-blue-600 mb-1" />
              <p className="text-xs font-medium text-blue-800">
                Secure Payment
              </p>
            </div>
            <div className="text-center">
              <Truck size={24} className="mx-auto text-blue-600 mb-1" />
              <p className="text-xs font-medium text-blue-800">Fast Delivery</p>
            </div>
            <div className="text-center">
              <CheckCircle size={24} className="mx-auto text-blue-600 mb-1" />
              <p className="text-xs font-medium text-blue-800">
                Verified Seller
              </p>
            </div>
          </div>

          {/* Safety Tip */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertCircle
                size={18}
                className="text-amber-600 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-amber-800">
                <strong>Safety Tip:</strong> Always meet in a safe, public
                location. Verify item condition before making payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
