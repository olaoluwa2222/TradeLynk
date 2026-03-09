"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { itemsApi, paymentsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface ItemDetails {
  id: number;
  sellerId: number;
  sellerName: string;
  sellerEmail: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  quantity: number;
  imageUrls: string[];
  status: string;
  // Variant-related fields
  hasVariants?: boolean;
  totalStock?: number;
  isInStock?: boolean;
  variants?: Array<{
    id: number;
    stock: number;
    isInStock: boolean;
    isLowStock?: boolean;
    isDefault?: boolean;
    variantName: string;
    price: number;
  }>;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const itemId = searchParams.get("itemId");

  const [item, setItem] = useState<ItemDetails | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<{
    id: number;
    stock: number;
    isInStock: boolean;
    isLowStock?: boolean;
    isDefault?: boolean;
    variantName: string;
    price: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [instructions, setInstructions] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Guest fields (used when not logged in)
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // Fetch item details (no auth required — guest checkout supported)
  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId) {
        setError("No item selected");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await itemsApi.getItemById(itemId);

        if (data.success) {
          const itemData = data.data;

          // Check if item is available
          if (itemData.status !== "ACTIVE") {
            setError("This item is no longer available");
            setLoading(false);
            return;
          }

          // Check if item is sold out
          // For items with variants, use totalStock or isInStock
          // For items without variants, use quantity
          const isOutOfStock = itemData.hasVariants
            ? itemData.totalStock !== undefined
              ? itemData.totalStock <= 0
              : !itemData.isInStock
            : itemData.quantity <= 0;

          if (isOutOfStock) {
            setError("This item is sold out");
            setLoading(false);
            return;
          }

          // Check if user is trying to buy their own item
          if (user && itemData.sellerId === user.userId) {
            setError("You cannot purchase your own item");
            setLoading(false);
            return;
          }

          setItem(itemData);
          // Set default variant for items with variants
          if (
            itemData.hasVariants &&
            itemData.variants &&
            itemData.variants.length > 0
          ) {
            const defaultVariant =
              itemData.variants.find((v: any) => v.isDefault) ||
              itemData.variants[0];
            setSelectedVariant(defaultVariant);
          }
        } else {
          setError(data.message || "Failed to load item");
        }
      } catch (err: any) {
        console.error("Error fetching item:", err);
        setError(err.message || "Failed to load item details");
      } finally {
        setLoading(false);
      }
    };

    if (itemId && !authLoading) {
      fetchItem();
    }
  }, [itemId, user, authLoading]);

  // Handle purchase
  const handleCompletePurchase = async () => {
    // Validation
    if (!deliveryAddress.trim()) {
      setValidationError("Please enter your campus delivery address");
      return;
    }

    if (deliveryAddress.trim().length < 10) {
      setValidationError("Delivery address must be at least 10 characters");
      return;
    }

    // Guest validation
    if (!isAuthenticated) {
      if (!guestName.trim()) {
        setValidationError("Please enter your full name");
        return;
      }
      if (
        !guestEmail.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)
      ) {
        setValidationError("Please enter a valid email address");
        return;
      }
      if (!guestPhone.trim() || guestPhone.replace(/\D/g, "").length < 7) {
        setValidationError("Please enter a valid phone number");
        return;
      }
    }

    if (!item) {
      setValidationError("Item details not loaded");
      return;
    }

    // Check if variant is required but not selected
    if (item.hasVariants && !selectedVariant) {
      setValidationError("Please select a variant before checking out");
      return;
    }

    // Validate selected variant has stock
    if (selectedVariant && !selectedVariant.isInStock) {
      setValidationError(
        "Selected variant is out of stock. Please choose another.",
      );
      return;
    }

    setValidationError("");
    setPaymentLoading(true);

    try {
      // Prepare payment data
      // ✅ Divide amount by 100: Convert from kobo to naira
      const amountInNaira = selectedVariant
        ? Math.floor(selectedVariant.price / 100)
        : Math.floor(item.price / 100);

      // Build the callback URL so Paystack redirects back to our success page
      const callbackUrl = `${window.location.origin}/payment/success`;

      const paymentData: any = {
        itemId: item.id,
        amount: amountInNaira, // ✅ NOW in naira (e.g., 1500000 instead of 150000000)
        deliveryAddress: deliveryAddress.trim(),
        callbackUrl, // Tell backend where Paystack should redirect after payment
      };

      // Add variantId if item has variants
      if (item.hasVariants && selectedVariant) {
        paymentData.variantId = selectedVariant.id;
      }

      // Add guest info when buyer is not logged in
      if (!isAuthenticated) {
        paymentData.buyerName = guestName.trim();
        paymentData.buyerEmail = guestEmail.trim();
        paymentData.buyerPhone = guestPhone.trim();
      }

      // Initialize payment
      const response = await paymentsApi.initializePayment(paymentData);

      console.log("Payment response:", response);

      if (response.success && response.data.paymentUrl) {
        // Save pending payment reference in localStorage as a safety net
        // This lets us recover the payment if the redirect back from Paystack fails
        try {
          const pendingPayments = JSON.parse(
            localStorage.getItem("pendingPayments") || "[]",
          );
          const pendingEntry = {
            reference:
              response.data.reference || response.data.paymentReference,
            itemId: item.id,
            itemTitle: item.title,
            amount: amountInNaira,
            createdAt: new Date().toISOString(),
            paymentUrl: response.data.paymentUrl,
          };
          pendingPayments.push(pendingEntry);
          // Keep only recent pending payments (last 10)
          const recentPending = pendingPayments.slice(-10);
          localStorage.setItem(
            "pendingPayments",
            JSON.stringify(recentPending),
          );
          console.log(
            "Saved pending payment reference:",
            pendingEntry.reference,
          );
        } catch (e) {
          console.warn("Could not save pending payment to localStorage:", e);
        }

        // Redirect to Paystack payment page
        window.location.href = response.data.paymentUrl;
      } else {
        throw new Error(response.message || "Failed to initialize payment");
      }
    } catch (err: any) {
      console.error("Payment initialization error:", err);
      // Extract error message from axios response or error object
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to initialize payment. Please try again.";
      setValidationError(errorMessage);
      setPaymentLoading(false);
    }
  };

  // Loading state
  if (loading || authLoading) {
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
            Loading checkout...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !item) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="text-6xl mb-6">⚠️</div>
            <h1
              className="text-3xl font-bold text-black mb-4"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              Checkout Error
            </h1>
            <p
              className="text-gray-600 mb-6"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              {error || "Unable to proceed with checkout"}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/items"
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Back to Items
              </Link>
              {itemId && (
                <Link
                  href={`/items/${itemId}`}
                  className="px-6 py-3 border-2 border-black text-black rounded-lg hover:bg-gray-50 transition-colors"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  View Item
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1
            className="text-2xl font-bold text-black"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            Checkout
          </h1>
          <Link
            href={`/items/${item.id}`}
            className="text-gray-600 hover:text-black transition-colors"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 500,
            }}
          >
            ← Back to Item
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Side - Item Summary (60% - 3 columns) */}
          <div className="lg:col-span-3">
            <h2
              className="text-xl font-bold text-black mb-6"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              Order Summary
            </h2>

            {/* Item Card */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex gap-6">
                {/* Item Image */}
                <div className="relative w-32 h-32 shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={item.imageUrls[0] || "/placeholder.jpg"}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                  {/* Condition Badge */}
                  <div className="absolute top-2 left-2">
                    <span
                      className="px-2 py-1 bg-black text-white text-xs font-bold rounded-full"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 700,
                      }}
                    >
                      {item.condition === "LIKE_NEW"
                        ? "Like New"
                        : item.condition}
                    </span>
                  </div>
                </div>

                {/* Item Details */}
                <div className="flex-1">
                  <p
                    className="text-xs text-gray-500 mb-1"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    {item.category}
                  </p>
                  <h3
                    className="text-lg font-bold text-black mb-2"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 700,
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-sm text-gray-600 mb-3 line-clamp-2"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    {item.description}
                  </p>

                  {/* Variant Selector */}
                  {item.hasVariants &&
                    item.variants &&
                    item.variants.length > 0 && (
                      <div className="mb-4 p-3 bg-white rounded-lg border border-gray-300">
                        <p
                          className="text-xs font-semibold text-gray-700 mb-2"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 600,
                          }}
                        >
                          Select Variant:
                        </p>
                        <div className="space-y-2">
                          {item.variants.map((variant) => (
                            <button
                              key={variant.id}
                              onClick={() => {
                                if (variant.isInStock) {
                                  setSelectedVariant(variant);
                                  setValidationError("");
                                }
                              }}
                              disabled={!variant.isInStock}
                              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                selectedVariant?.id === variant.id
                                  ? "border-black bg-gray-50"
                                  : variant.isInStock
                                    ? "border-gray-200 hover:border-gray-400"
                                    : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p
                                    className="font-medium text-sm"
                                    style={{
                                      fontFamily: "Clash Display",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {variant.variantName}
                                  </p>
                                  <p
                                    className={`text-xs ${
                                      variant.isInStock
                                        ? variant.isLowStock
                                          ? "text-orange-600"
                                          : "text-green-600"
                                        : "text-red-600"
                                    }`}
                                    style={{
                                      fontFamily: "Clash Display",
                                      fontWeight: 400,
                                    }}
                                  >
                                    {variant.isInStock
                                      ? variant.isLowStock
                                        ? `Only ${variant.stock} left`
                                        : `${variant.stock} in stock`
                                      : "Out of stock"}
                                  </p>
                                </div>
                                <p
                                  className="font-bold"
                                  style={{
                                    fontFamily: "Clash Display",
                                    fontWeight: 700,
                                  }}
                                >
                                  ₦{(variant.price / 100).toLocaleString()}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  <p
                    className="text-2xl font-bold text-black"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 700,
                    }}
                  >
                    ₦
                    {(
                      (selectedVariant?.price || item.price) / 100
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Seller Info */}
              <div className="mt-6 pt-6 border-t border-gray-300">
                <p
                  className="text-xs text-gray-600 mb-2"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Sold by
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
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
                      Verified Seller
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Notice */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-3">
                <div className="text-2xl">🔒</div>
                <div>
                  <p
                    className="font-semibold text-blue-900 mb-1"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    Secure Payment
                  </p>
                  <p
                    className="text-xs text-blue-800"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    Your payment is processed securely via Paystack. Payment
                    goes directly to the seller upon completion.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Delivery Form + Payment (40% - 2 columns) */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-6">
              <h2
                className="text-xl font-bold text-black mb-6"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 700,
                }}
              >
                Delivery Details
              </h2>

              {/* Guest info — shown only when not logged in */}
              {!isAuthenticated && !authLoading && (
                <div className="mb-6 space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p
                      className="text-xs text-amber-800"
                      style={{ fontFamily: "Clash Display", fontWeight: 500 }}
                    >
                      Checking out as guest.{" "}
                      <a
                        href={`/login?redirect=/checkout?itemId=${itemId}`}
                        className="underline font-semibold"
                      >
                        Sign in
                      </a>{" "}
                      to track your orders.
                    </p>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-semibold text-gray-700 mb-2"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => {
                        setGuestName(e.target.value);
                        setValidationError("");
                      }}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all text-gray-700"
                      style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                      disabled={paymentLoading}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-semibold text-gray-700 mb-2"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => {
                        setGuestEmail(e.target.value);
                        setValidationError("");
                      }}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all text-gray-700"
                      style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                      disabled={paymentLoading}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-semibold text-gray-700 mb-2"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => {
                        setGuestPhone(e.target.value);
                        setValidationError("");
                      }}
                      placeholder="e.g. 08012345678"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all text-gray-700"
                      style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                      disabled={paymentLoading}
                    />
                  </div>
                  <hr className="border-gray-200" />
                </div>
              )}

              {/* Delivery Address Input */}
              <div className="mb-6">
                <label
                  className="block text-sm font-semibold text-gray-700 mb-2"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Campus Delivery Address *
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => {
                    setDeliveryAddress(e.target.value);
                    setValidationError("");
                  }}
                  placeholder="e.g., Male Hostel Block B, Room 205"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all text-gray-700"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                  disabled={paymentLoading}
                />
                <p
                  className="text-xs text-gray-500 mt-1"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Minimum 10 characters
                </p>
              </div>

              {/* Instructions (Optional) */}
              <div className="mb-6">
                <label
                  className="block text-sm font-semibold text-gray-700 mb-2"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Additional Instructions (Optional)
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Any special instructions for the seller..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none text-gray-700"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                  disabled={paymentLoading}
                />
              </div>

              {/* Validation Error */}
              {validationError && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p
                    className="text-sm text-red-600"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 500,
                    }}
                  >
                    ⚠️ {validationError}
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="my-6 border-t border-gray-200"></div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <p
                    className="text-sm text-gray-600"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    Item Price
                  </p>
                  <p
                    className="text-sm font-semibold text-black"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    ₦
                    {(
                      (selectedVariant?.price || item.price) / 100
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p
                    className="text-sm text-gray-600"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    Delivery Fee
                  </p>
                  <p
                    className="text-sm font-semibold text-green-600"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    FREE
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                  <p
                    className="text-lg font-bold text-black"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 700,
                    }}
                  >
                    Total
                  </p>
                  <p
                    className="text-2xl font-bold text-black"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 700,
                    }}
                  >
                    ₦
                    {(
                      (selectedVariant?.price || item.price) / 100
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Complete Purchase Button */}
              <button
                onClick={handleCompletePurchase}
                disabled={paymentLoading || !deliveryAddress.trim()}
                className="w-full py-4 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 700,
                }}
              >
                {paymentLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    🔒 Complete Purchase
                    <span>→</span>
                  </>
                )}
              </button>

              {/* Payment Info */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="text-gray-400">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p
                  className="text-xs text-gray-500"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Secured by Paystack
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
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
              Loading checkout...
            </p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
