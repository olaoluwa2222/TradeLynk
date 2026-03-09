"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";

export default function CartDrawer() {
  const { items, count, isOpen, closeCart, removeItem } = useCart();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeCart]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const totalKobo = items.reduce((sum, i) => sum + i.effectivePrice, 0);

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={closeCart}
        className={`fixed inset-0 bg-black/40 z-100 transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-101 shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-purple-600" />
            <h2
              className="text-lg font-bold text-black"
              style={{ fontFamily: "Clash Display", fontWeight: 700 }}
            >
              Cart
            </h2>
            {count > 0 && (
              <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingCart size={28} className="text-gray-400" />
              </div>
              <div>
                <p
                  className="text-base font-bold text-gray-900"
                  style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                >
                  Your cart is empty
                </p>
                <p
                  className="text-sm text-gray-500 mt-1"
                  style={{ fontFamily: "Clash Display" }}
                >
                  Add items to get started
                </p>
              </div>
              <button
                onClick={closeCart}
                className="mt-2 px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-900 transition-colors"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((item) => (
                <li
                  key={`${item.itemId}-${item.variantId ?? "base"}`}
                  className="flex gap-3 p-4"
                >
                  {/* Image */}
                  <div className="relative w-16 h-16 shrink-0 rounded-xl bg-gray-100 overflow-hidden">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                        📦
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold text-gray-900 truncate"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      {item.title}
                    </p>
                    {item.variantName && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.variantName}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      by {item.sellerName}
                    </p>
                    <p
                      className="text-sm font-bold text-black mt-1"
                      style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                    >
                      ₦{(item.effectivePrice / 100).toLocaleString()}
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.itemId, item.variantId)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start mt-1"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-5 space-y-4">
            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span
                className="text-sm text-gray-500"
                style={{ fontFamily: "Clash Display" }}
              >
                Subtotal ({count} item{count !== 1 ? "s" : ""})
              </span>
              <span
                className="text-lg font-bold text-black"
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                ₦{(totalKobo / 100).toLocaleString()}
              </span>
            </div>

            {/* Note about separate payments */}
            {count > 1 && (
              <p
                className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2"
                style={{ fontFamily: "Clash Display" }}
              >
                Each item is a separate payment. You'll pay for each one
                individually on the next page.
              </p>
            )}

            {/* Checkout button */}
            <Link
              href="/cart"
              onClick={closeCart}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-purple-200"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              Proceed to Checkout
              <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
