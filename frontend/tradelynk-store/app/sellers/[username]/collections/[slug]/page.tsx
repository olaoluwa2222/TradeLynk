"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collectionsApi, sellersApi } from "@/lib/api";
import { Collection, Item } from "@/types/items";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Star,
  Heart,
  Eye,
  ShoppingBag,
  Loader2,
  Tag,
  ChevronRight,
  Grid3X3,
  LayoutGrid,
} from "lucide-react";

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const slug = params.slug as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");
  const [primaryColor, setPrimaryColor] = useState("#000000");

  useEffect(() => {
    if (slug) {
      loadCollection();
    }
  }, [slug]);

  const loadCollection = async () => {
    setLoading(true);
    try {
      const response = await collectionsApi.getBySlug(slug);
      if (response.success && response.data) {
        setCollection(response.data);

        // Try to get the seller's primary color
        try {
          const storefrontResponse = await sellersApi.getStorefront(username);
          if (storefrontResponse.success && storefrontResponse.data) {
            setPrimaryColor(storefrontResponse.data.primaryColor || "#000000");
          }
        } catch (e) {
          // Use default color
        }
      } else {
        setError("Collection not found");
      }
    } catch (err: any) {
      setError("Failed to load collection");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-gray-400 mx-auto" />
          <p className="mt-4 text-gray-500">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag size={32} className="text-gray-400" />
          </div>
          <h1
            className="text-2xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: "Clash Display" }}
          >
            Collection Not Found
          </h1>
          <p className="text-gray-500 mb-6">
            This collection may have been removed or is no longer available.
          </p>
          <Link
            href={`/sellers/${username}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all"
            style={{ fontFamily: "Clash Display" }}
          >
            <ArrowLeft size={18} />
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  const items = collection.items || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative">
        {/* Banner */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          {collection.imageUrl ? (
            <>
              <Image
                src={collection.imageUrl}
                alt={collection.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            </>
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}60, ${primaryColor}90)`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Tag size={80} className="text-white/20" />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="absolute top-0 left-0 right-0 p-4 md:p-6 z-10">
            <div className="max-w-7xl mx-auto">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all"
              >
                <ArrowLeft size={18} />
                <span className="font-medium">Back</span>
              </button>
            </div>
          </div>

          {/* Collection Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-10">
            <div className="max-w-7xl mx-auto">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-white/70 text-sm mb-4">
                <Link
                  href={`/sellers/${username}`}
                  className="hover:text-white"
                >
                  {collection.sellerName || "Store"}
                </Link>
                <ChevronRight size={14} />
                <span className="text-white">Collections</span>
                <ChevronRight size={14} />
                <span className="text-white">{collection.name}</span>
              </nav>

              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  {collection.isFeatured && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full mb-3">
                      <Star size={12} className="fill-yellow-900" />
                      Featured Collection
                    </span>
                  )}
                  <h1
                    className="text-3xl md:text-5xl font-bold text-white"
                    style={{ fontFamily: "Clash Display" }}
                  >
                    {collection.name}
                  </h1>
                  {collection.description && (
                    <p className="text-white/80 mt-2 max-w-2xl text-lg">
                      {collection.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Package size={20} className="text-white" />
                  <span className="text-white font-semibold">
                    {collection.itemCount} Products
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-500">
            Showing {items.length} product{items.length !== 1 ? "s" : ""}
          </p>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-all ${
                viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
              style={viewMode === "grid" ? { color: primaryColor } : {}}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`p-2 rounded-md transition-all ${
                viewMode === "compact" ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
              style={viewMode === "compact" ? { color: primaryColor } : {}}
            >
              <Grid3X3 size={18} />
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">
              No products in this collection yet
            </p>
            <p className="text-gray-400 text-sm mt-2">Check back soon!</p>
          </div>
        ) : (
          <div
            className={`grid gap-4 md:gap-6 ${
              viewMode === "compact"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            }`}
          >
            {items.map((item, index) => (
              <ProductCard
                key={item.id}
                item={item}
                username={username}
                primaryColor={primaryColor}
                viewMode={viewMode}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Product Card Component
function ProductCard({
  item,
  username,
  primaryColor,
  viewMode,
  index,
}: {
  item: Item;
  username: string;
  primaryColor: string;
  viewMode: "grid" | "compact";
  index: number;
}) {
  const imageUrl =
    item.primaryImage?.mediumUrl ||
    item.primaryImage?.imageUrl ||
    item.imageUrls?.[0] ||
    "";

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  if (viewMode === "compact") {
    return (
      <Link
        href={`/items/${item.id}`}
        className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package size={32} className="text-gray-300" />
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-sm font-medium text-gray-900 truncate">
            {item.title}
          </p>
          <p className="text-sm font-bold mt-1" style={{ color: primaryColor }}>
            {item.displayPrice || formatPrice(item.price)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/items/${item.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package size={48} className="text-gray-300" />
          </div>
        )}

        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Stats */}
        <div className="absolute top-3 right-3 flex gap-2">
          <span className="flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
            <Heart size={12} className="text-red-500" />
            {item.likeCount || 0}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
            <Eye size={12} className="text-gray-500" />
            {item.viewCount || 0}
          </span>
        </div>

        {/* Stock Status */}
        {!item.isInStock && (
          <div className="absolute bottom-3 left-3">
            <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
          {item.category?.replace("_", " ")}
        </p>
        <h3
          className="font-bold text-gray-900 mb-2 group-hover:text-black transition-colors line-clamp-2"
          style={{ fontFamily: "Clash Display" }}
        >
          {item.title}
        </h3>

        {/* Variants Preview */}
        {item.hasVariants && item.variants && item.variants.length > 0 && (
          <div className="flex items-center gap-1 mb-3">
            {item.variants.slice(0, 3).map((variant, idx) => (
              <span
                key={variant.id}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {variant.variantOptions?.Size || variant.variantOptions?.Color}
              </span>
            ))}
            {item.variants.length > 3 && (
              <span className="text-xs text-gray-500">
                +{item.variants.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold" style={{ color: primaryColor }}>
            {item.displayPrice || formatPrice(item.price)}
          </p>
          <span
            className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: primaryColor }}
          >
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
