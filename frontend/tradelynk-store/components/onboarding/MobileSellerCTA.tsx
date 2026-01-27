// components/onboarding/MobileSellerCTA.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/lib/hooks/useOnboarding";

export default function MobileSellerCTA() {
  const { isAuthenticated, user } = useAuth();
  const { state } = useOnboarding();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if user is already a seller
  const isSeller =
    user?.role === "SELLER" || user?.role === "BOTH" || user?.role === "ADMIN";

  // Show after a short delay and only on scroll
  useEffect(() => {
    // Check if previously dismissed
    const dismissed = localStorage.getItem("tradelynk_mobile_cta_dismissed");
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show after user scrolls a bit
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setIsVisible(true);
      }
    };

    // Also show after 3 seconds
    const timer = setTimeout(() => setIsVisible(true), 3000);

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("tradelynk_mobile_cta_dismissed", "true");
  };

  // Don't show if:
  // - Already a seller
  // - User dismissed it
  // - Not visible yet
  // - On desktop (this is mobile only)
  if (isSeller || isDismissed || !isVisible) return null;

  // Determine CTA based on auth state
  const getCtaConfig = () => {
    if (!isAuthenticated) {
      return {
        href: "/register",
        text: "Start Selling — Create Free Website",
        subtext: "Join 50+ sellers earning ₦50K+ monthly",
      };
    }
    return {
      href: "/become-a-seller",
      text: "Create Your Free Website",
      subtext: "Takes only 2 minutes to set up",
    };
  };

  const cta = getCtaConfig();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 animate-[slideUp_0.3s_ease-out]">
      {/* Gradient fade at top */}
      <div className="h-6 bg-gradient-to-t from-white to-transparent" />

      {/* Main CTA bar */}
      <div className="bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-black to-gray-800 rounded-xl flex items-center justify-center text-xl shadow-lg">
            🚀
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold text-black truncate"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              {cta.text}
            </p>
            <p
              className="text-xs text-gray-600 truncate"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              {cta.subtext}
            </p>
          </div>

          {/* CTA Button */}
          <Link
            href={cta.href}
            className="flex-shrink-0 px-4 py-2.5 bg-black text-white text-sm font-bold rounded-xl
                     hover:bg-gray-800 active:scale-95 transition-all shadow-lg"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 600,
            }}
          >
            Start →
          </Link>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <svg
              className="w-4 h-4 text-gray-400"
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

        {/* Feature pills - optional, can be hidden for space */}
        <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide">
          {["✅ Free", "✅ No coding", "✅ 2 min setup"].map(
            (feature, index) => (
              <span
                key={index}
                className="flex-shrink-0 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                {feature}
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
