"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  Trash2,
  ShoppingCart,
} from "lucide-react";
import { useCart, CartItem } from "@/lib/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { paymentsApi } from "@/lib/api";

interface PaymentLink {
  item: CartItem;
  url: string;
  paid: boolean;
}

export default function CartPage() {
  const { items, removeItem, clearCart } = useCart();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);

  const totalKobo = items.reduce((s, i) => s + i.effectivePrice, 0);
  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/payment/success`
      : "";

  // ── Single item → redirect to normal checkout ──────────────────
  if (!authLoading && items.length === 1) {
    router.replace(`/checkout?itemId=${items[0].itemId}`);
    return null;
  }

  // ── Empty cart ───────────────────────────────────────────────────
  if (!authLoading && items.length === 0 && paymentLinks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
          <ShoppingCart size={36} className="text-gray-400" />
        </div>
        <h1
          className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: "Clash Display", fontWeight: 700 }}
        >
          Your cart is empty
        </h1>
        <Link
          href="/items"
          className="px-6 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-colors"
          style={{ fontFamily: "Clash Display", fontWeight: 600 }}
        >
          Browse Products
        </Link>
      </div>
    );
  }

  // ── Generate payment links ────────────────────────────────────────
  const handleGenerateLinks = async () => {
    setError("");

    if (deliveryAddress.trim().length < 10) {
      setError("Please enter a delivery address (at least 10 characters)");
      return;
    }

    if (!isAuthenticated) {
      if (!guestName.trim()) {
        setError("Please enter your full name");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
        setError("Please enter a valid email");
        return;
      }
      if (guestPhone.replace(/\D/g, "").length < 7) {
        setError("Please enter a valid phone number");
        return;
      }
    }

    setProcessing(true);

    const links: PaymentLink[] = [];

    for (const item of items) {
      try {
        const payload: any = {
          itemId: item.itemId,
          amount: Math.floor(item.effectivePrice / 100), // kobo → naira
          deliveryAddress: deliveryAddress.trim(),
          callbackUrl,
        };

        if (item.variantId) payload.variantId = item.variantId;

        if (!isAuthenticated) {
          payload.buyerName = guestName.trim();
          payload.buyerEmail = guestEmail.trim();
          payload.buyerPhone = guestPhone.trim();
        }

        const response = await paymentsApi.initializePayment(payload);

        if (response.success && response.data?.paymentUrl) {
          links.push({ item, url: response.data.paymentUrl, paid: false });
        } else {
          links.push({ item, url: "", paid: false });
        }
      } catch (err: any) {
        links.push({ item, url: "", paid: false });
      }
    }

    setPaymentLinks(links);
    setProcessing(false);
  };

  const markPaid = (itemId: number) => {
    setPaymentLinks((prev) =>
      prev.map((l) => (l.item.itemId === itemId ? { ...l, paid: true } : l)),
    );
  };

  // ── Payment links step ────────────────────────────────────────────
  if (paymentLinks.length > 0) {
    const allPaid = paymentLinks.every((l) => l.paid);

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <h1
            className="text-2xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: "Clash Display", fontWeight: 700 }}
          >
            Complete Your Payments
          </h1>
          <p
            className="text-gray-500 text-sm mb-8"
            style={{ fontFamily: "Clash Display" }}
          >
            Each item has its own payment link. Pay for them one by one.
          </p>

          <div className="space-y-4 mb-8">
            {paymentLinks.map((link, idx) => (
              <div
                key={`${link.item.itemId}-${link.item.variantId ?? "base"}`}
                className={`bg-white border rounded-2xl p-5 flex items-center gap-4 transition-all ${
                  link.paid ? "border-green-200 bg-green-50" : "border-gray-200"
                }`}
              >
                {/* Image */}
                <div className="relative w-14 h-14 shrink-0 rounded-xl bg-gray-100 overflow-hidden">
                  {link.item.imageUrl ? (
                    <Image
                      src={link.item.imageUrl}
                      alt={link.item.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full text-xl">
                      📦
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold text-gray-900 truncate"
                    style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                  >
                    {link.item.title}
                  </p>
                  {link.item.variantName && (
                    <p className="text-xs text-gray-500">
                      {link.item.variantName}
                    </p>
                  )}
                  <p
                    className="text-sm font-bold text-black mt-0.5"
                    style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                  >
                    ₦{(link.item.effectivePrice / 100).toLocaleString()}
                  </p>
                </div>

                {/* Pay button */}
                {link.paid ? (
                  <div className="flex items-center gap-1.5 text-green-600 font-semibold text-sm shrink-0">
                    <CheckCircle size={18} />
                    Paid
                  </div>
                ) : link.url ? (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markPaid(link.item.itemId)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
                    style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                  >
                    Pay Now
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <span className="text-xs text-red-500 shrink-0">
                    Failed to load
                  </span>
                )}
              </div>
            ))}
          </div>

          {allPaid && (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                <p
                  className="text-green-700 font-semibold"
                  style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                >
                  🎉 All payments complete! Check your orders for updates.
                </p>
              </div>
              <button
                onClick={() => {
                  clearCart();
                  router.push("/orders/purchases");
                }}
                className="px-6 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-colors"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                View My Orders
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main cart checkout form ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link
            href="/items"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm"
            style={{ fontFamily: "Clash Display" }}
          >
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1
          className="text-2xl font-bold text-gray-900 mb-6"
          style={{ fontFamily: "Clash Display", fontWeight: 700 }}
        >
          Your Cart ({items.length} item{items.length !== 1 ? "s" : ""})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Items list */}
          <div className="lg:col-span-3 space-y-4">
            {items.map((item) => (
              <div
                key={`${item.itemId}-${item.variantId ?? "base"}`}
                className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-4"
              >
                <div className="relative w-20 h-20 shrink-0 rounded-xl bg-gray-100 overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full text-2xl">
                      📦
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-gray-900"
                    style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                  >
                    {item.title}
                  </p>
                  {item.variantName && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.variantName}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    by {item.sellerName}
                  </p>
                  <p
                    className="text-base font-bold text-black mt-1"
                    style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                  >
                    ₦{(item.effectivePrice / 100).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.itemId, item.variantId)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Checkout form */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-6 space-y-5">
              {/* Guest fields */}
              {!authLoading && !isAuthenticated && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p
                      className="text-xs text-amber-800"
                      style={{ fontFamily: "Clash Display", fontWeight: 500 }}
                    >
                      Checking out as guest.{" "}
                      <Link
                        href="/login?redirect=/cart"
                        className="underline font-semibold"
                      >
                        Sign in
                      </Link>{" "}
                      to track your orders.
                    </p>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-semibold text-gray-700 mb-1.5"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => {
                        setGuestName(e.target.value);
                        setError("");
                      }}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700 text-sm transition-all"
                      style={{ fontFamily: "Clash Display" }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-semibold text-gray-700 mb-1.5"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      Email *
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => {
                        setGuestEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700 text-sm transition-all"
                      style={{ fontFamily: "Clash Display" }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-semibold text-gray-700 mb-1.5"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => {
                        setGuestPhone(e.target.value);
                        setError("");
                      }}
                      placeholder="08012345678"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700 text-sm transition-all"
                      style={{ fontFamily: "Clash Display" }}
                    />
                  </div>
                  <hr className="border-gray-100" />
                </div>
              )}

              {/* Delivery address */}
              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                  style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                >
                  Delivery Address *
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => {
                    setDeliveryAddress(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. Male Hostel Block B, Room 205"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700 text-sm resize-none transition-all"
                  style={{ fontFamily: "Clash Display" }}
                />
                <p
                  className="text-xs text-gray-400 mt-1"
                  style={{ fontFamily: "Clash Display" }}
                >
                  This address applies to all items in your cart
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p
                    className="text-sm text-red-600"
                    style={{ fontFamily: "Clash Display" }}
                  >
                    ⚠️ {error}
                  </p>
                </div>
              )}

              {/* Note about multiple payments */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p
                  className="text-xs text-blue-700"
                  style={{ fontFamily: "Clash Display" }}
                >
                  🔒 Secure payment via Paystack. Each item is charged
                  separately — you'll get individual payment links on the next
                  step.
                </p>
              </div>

              {/* Order summary */}
              <div className="pt-1 border-t border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <span
                    className="text-sm text-gray-500"
                    style={{ fontFamily: "Clash Display" }}
                  >
                    Total ({items.length} items)
                  </span>
                  <span
                    className="text-xl font-bold text-black"
                    style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                  >
                    ₦{(totalKobo / 100).toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={handleGenerateLinks}
                  disabled={processing || items.length === 0}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
                  style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                >
                  {processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating payment links...
                    </>
                  ) : (
                    "Proceed to Payment"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
