// components/onboarding/DesktopSellerCTA.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/lib/hooks/useOnboarding";

/**
 * Desktop Seller CTA
 * A floating/fixed CTA that appears on desktop screens for non-sellers
 * Encourages users to create their own storefront
 */
export default function DesktopSellerCTA() {
  const { isAuthenticated, user } = useAuth();
  const { state } = useOnboarding();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Check if user is already a seller
  const isSeller =
    user?.role === "SELLER" || user?.role === "BOTH" || user?.role === "ADMIN";

  // Check if user has a storefront
  const hasStorefront = state.hasStorefront;

  useEffect(() => {
    // Check if previously dismissed
    const dismissed = localStorage.getItem("tradelynk_desktop_cta_dismissed");
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show after a delay
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("tradelynk_desktop_cta_dismissed", "true");
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Don't show if:
  // - Already a seller with storefront
  // - User dismissed it
  // - Not visible yet
  if (isSeller || hasStorefront || isDismissed || !isVisible) return null;

  // Determine CTA based on auth state
  const getCtaConfig = () => {
    if (!isAuthenticated) {
      return {
        href: "/register",
        text: "Create Your Free Website",
        subtext: "Join 50+ sellers earning ₦50K+ monthly",
        buttonText: "Get Started Free",
      };
    }
    return {
      href: "/become-a-seller#form",
      text: "Create Your Free Website",
      subtext: "Takes only 2 minutes to set up",
      buttonText: "Start Now →",
    };
  };

  const cta = getCtaConfig();

  // Minimized state - just show a small floating button
  if (isMinimized) {
    return (
      <div className="hidden md:block fixed bottom-6 right-6 z-50">
        <button
          onClick={handleMinimize}
          className="w-14 h-14 bg-gradient-to-br from-black to-gray-800 rounded-full shadow-lg 
                     flex items-center justify-center text-2xl hover:scale-110 transition-transform
                     animate-bounce"
          title="Create Your Free Website"
        >
          🚀
        </button>
      </div>
    );
  }

  return (
    <div className="hidden md:block fixed bottom-6 right-6 z-50 animate-[slideUp_0.4s_ease-out]">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 w-80 overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        {/* Close and minimize buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            title="Minimize"
          >
            <svg
              className="w-3 h-3 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>
          <button
            onClick={handleDismiss}
            className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            title="Dismiss"
          >
            <svg
              className="w-3 h-3 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Icon */}
        <div className="w-12 h-12 bg-gradient-to-br from-black to-gray-800 rounded-xl flex items-center justify-center text-xl shadow-lg mb-4">
          🚀
        </div>

        {/* Content */}
        <h3
          className="text-lg font-bold text-black mb-1"
          style={{
            fontFamily: "Clash Display",
            fontWeight: 700,
          }}
        >
          {cta.text}
        </h3>
        <p
          className="text-sm text-gray-600 mb-4"
          style={{
            fontFamily: "Clash Display",
            fontWeight: 400,
          }}
        >
          {cta.subtext}
        </p>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          {["Free", "No coding", "2 min setup"].map((feature, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 500,
              }}
            >
              ✅ {feature}
            </span>
          ))}
        </div>

        {/* CTA Button */}
        <Link
          href={cta.href}
          className="block w-full text-center px-4 py-3 bg-black text-white font-bold rounded-xl
                     hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg"
          style={{
            fontFamily: "Clash Display",
            fontWeight: 600,
          }}
        >
          {cta.buttonText}
        </Link>
      </div>
    </div>
  );
}
