// app/dashboard/seller/items/[id]/edit/page.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ProductForm } from "@/components/product";
import { tokenStorage, authApi, itemsApi } from "@/lib/api";
import { Item } from "@/types/items";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;

  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [item, setItem] = useState<Item | null>(null);
  const [error, setError] = useState("");
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const checkAuthAndFetchItem = async () => {
      try {
        // Check auth
        const token = tokenStorage.getAccessToken();

        if (!token) {
          router.push("/login");
          return;
        }

        const userData = await authApi.getCurrentUser();

        if (!isMountedRef.current) return;

        if (!userData) {
          router.push("/login");
          return;
        }

        // Fetch item
        const response = await itemsApi.getItemById(itemId);

        if (!isMountedRef.current) return;

        if (response.success && response.data) {
          // Check if user owns this item
          if (response.data.sellerId !== userData.userId) {
            setError("You don't have permission to edit this product");
          } else {
            setItem(response.data);
            setIsAuthorized(true);
          }
        } else {
          setError(response.message || "Product not found");
        }
      } catch (error: any) {
        console.error("Error:", error);
        if (isMountedRef.current) {
          setError(error.message || "Failed to load product");
        }
      } finally {
        if (isMountedRef.current) {
          setIsChecking(false);
        }
      }
    };

    checkAuthAndFetchItem();

    return () => {
      isMountedRef.current = false;
    };
  }, [router, itemId]);

  // Loading state
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          <p
            className="text-gray-600 font-medium"
            style={{ fontFamily: "Clash Display" }}
          >
            Loading product...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔒</span>
            </div>
            <h1
              className="text-3xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "Clash Display" }}
            >
              Cannot Edit Product
            </h1>
            <p
              className="text-gray-600 mb-8 max-w-md mx-auto"
              style={{ fontFamily: "Clash Display" }}
            >
              {error}
            </p>
            <Link
              href="/dashboard/seller"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
              style={{ fontFamily: "Clash Display" }}
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized || !item) {
    return null;
  }

  // Convert item to form data format
  const initialData = {
    title: item.title,
    category: item.category,
    condition: item.condition,
    hasVariants: item.hasVariants || false,
    price: item.price ? item.price / 100 : 0, // Convert from kobo to Naira
    stock: item.quantity || item.totalStock || 0,
    variants: (item.variants || []).map((v) => ({
      id: `var_${v.id}`,
      size: v.variantOptions?.size || "",
      color: v.variantOptions?.color || "",
      sku: v.sku || "",
      price: v.price ?? v.effectivePrice ?? 0,
      stock: v.stock,
    })),
    images: (item.images || []).map((img, index) => ({
      id: `img_${img.id || index}`,
      url: img.imageUrl,
      isPrimary: img.isPrimary,
      altText: img.altText,
      order: img.position || index,
    })),
    description: item.description || "",
    tags: item.tags || [],
    shippingProfileId: item.shippingProfile?.id?.toString() || "",
  };

  return <ProductForm mode="edit" itemId={item.id} initialData={initialData} />;
}
