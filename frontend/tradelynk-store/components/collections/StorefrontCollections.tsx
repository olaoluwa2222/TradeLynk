"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Tag,
  Package,
  ChevronRight,
  Star,
  Loader2,
  FolderOpen,
  ArrowRight,
} from "lucide-react";
import { collectionsApi } from "@/lib/api";
import { CollectionSummary, Collection } from "@/types/items";

interface StorefrontCollectionsProps {
  sellerId: number;
  sellerUsername: string;
  primaryColor?: string;
  variant?: "featured" | "full" | "compact";
  maxItems?: number;
}

export default function StorefrontCollections({
  sellerId,
  sellerUsername,
  primaryColor = "#000000",
  variant = "full",
  maxItems,
}: StorefrontCollectionsProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollections();
  }, [sellerId, variant]);

  const loadCollections = async () => {
    setLoading(true);
    try {
      let response;
      if (variant === "featured") {
        response = await collectionsApi.getFeaturedCollections(sellerId);
        // Fallback: if featured endpoint fails or returns nothing, load all active
        if (
          !response?.success ||
          !response?.data ||
          response.data.length === 0
        ) {
          response = await collectionsApi.getSellerCollections(sellerId, true);
        }
      } else {
        response = await collectionsApi.getSellerCollections(sellerId, true);
      }

      if (response.success) {
        let data = response.data || [];
        // For full collections, we need to fetch each collection details
        if (variant === "full" && data.length > 0) {
          const detailedCollections = await Promise.all(
            data.slice(0, maxItems).map(async (c: CollectionSummary) => {
              try {
                const detail = await collectionsApi.getById(c.id);
                return detail.success ? detail.data : c;
              } catch {
                return c;
              }
            }),
          );
          setCollections(detailedCollections);
        } else {
          setCollections(maxItems ? data.slice(0, maxItems) : data);
        }
      }
    } catch (error) {
      console.error("Error loading collections:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (collections.length === 0) {
    return null; // Don't show anything if no collections
  }

  // Featured Variant - Horizontal scrolling cards for homepage
  if (variant === "featured") {
    return (
      <section className="py-12 fade-in-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Star size={20} style={{ color: primaryColor }} />
              </div>
              <div>
                <h2
                  className="text-2xl md:text-3xl font-bold text-gray-900"
                  style={{ fontFamily: "Clash Display" }}
                >
                  Featured Collections
                </h2>
                <p className="text-gray-500 text-sm mt-0.5">
                  Curated selections just for you
                </p>
              </div>
            </div>
          </div>

          {/* Horizontal Scroll */}
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
            {collections.map((collection, index) => (
              <Link
                key={collection.id}
                href={`/sellers/${sellerUsername}/collections/${collection.slug}`}
                className="flex-shrink-0 w-72 md:w-80 snap-start group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02]">
                  {collection.imageUrl ? (
                    <Image
                      src={collection.imageUrl}
                      alt={collection.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}40, ${primaryColor}80)`,
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Tag size={48} className="text-white/50" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Star
                        size={14}
                        className="text-yellow-400 fill-yellow-400"
                      />
                      <span className="text-xs text-yellow-200 font-medium">
                        Featured
                      </span>
                    </div>
                    <h3
                      className="text-lg font-bold text-white mb-1"
                      style={{ fontFamily: "Clash Display" }}
                    >
                      {collection.name}
                    </h3>
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <Package size={14} />
                      <span>{collection.itemCount || 0} products</span>
                    </div>
                  </div>
                  {/* Arrow on Hover */}
                  <div className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <ChevronRight size={18} className="text-white" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Compact Variant - Simple list/grid for sidebar or smaller areas
  if (variant === "compact") {
    return (
      <div className="space-y-3">
        {collections.map((collection) => (
          <Link
            key={collection.id}
            href={`/sellers/${sellerUsername}/collections/${collection.slug}`}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {collection.imageUrl ? (
                <Image
                  src={collection.imageUrl}
                  alt={collection.name}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Tag size={20} style={{ color: primaryColor }} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className="font-semibold text-gray-900 truncate group-hover:text-black transition-colors"
                style={{ fontFamily: "Clash Display" }}
              >
                {collection.name}
              </h4>
              <p className="text-sm text-gray-500">
                {collection.itemCount || 0} products
              </p>
            </div>
            <ChevronRight
              size={18}
              className="text-gray-400 group-hover:text-gray-600 transition-colors"
            />
          </Link>
        ))}
      </div>
    );
  }

  // Full Variant - Large cards grid for dedicated collections page/section
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {collections.map((collection, index) => (
        <Link
          key={collection.id}
          href={`/sellers/${sellerUsername}/collections/${collection.slug}`}
          className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 fade-in-section"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Image */}
          <div className="relative h-48 overflow-hidden">
            {collection.imageUrl ? (
              <Image
                src={collection.imageUrl}
                alt={collection.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}60)`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Tag size={56} className="text-white/40" />
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Featured Badge */}
            {collection.isFeatured && (
              <div className="absolute top-3 left-3">
                <span className="flex items-center gap-1 px-2.5 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                  <Star size={12} className="fill-yellow-900" />
                  Featured
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5">
            <h3
              className="text-lg font-bold text-gray-900 mb-2 group-hover:text-black transition-colors"
              style={{ fontFamily: "Clash Display" }}
            >
              {collection.name}
            </h3>
            {collection.description && (
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {collection.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-gray-600">
                <Package size={16} className="text-gray-400" />
                {collection.itemCount || 0} products
              </span>
              <span
                className="flex items-center gap-1 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: primaryColor }}
              >
                View
                <ArrowRight size={14} />
              </span>
            </div>
          </div>

          {/* Product Preview */}
          {collection.items && collection.items.length > 0 && (
            <div className="px-5 pb-5">
              <div className="flex -space-x-3 overflow-hidden">
                {collection.items.slice(0, 4).map((item, idx) => {
                  const imageUrl =
                    item.primaryImage?.thumbnail || item.imageUrls?.[0] || "";
                  return (
                    <div
                      key={item.id}
                      className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-100"
                      style={{ zIndex: 4 - idx }}
                    >
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={item.title}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={16} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                  );
                })}
                {collection.itemCount > 4 && (
                  <div
                    className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: primaryColor, zIndex: 0 }}
                  >
                    +{collection.itemCount - 4}
                  </div>
                )}
              </div>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
