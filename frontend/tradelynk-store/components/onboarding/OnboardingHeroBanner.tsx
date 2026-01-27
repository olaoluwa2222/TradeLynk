// components/onboarding/OnboardingHeroBanner.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useOnboarding } from "@/lib/hooks/useOnboarding";

interface OnboardingHeroBannerProps {
  userName?: string;
  variant?: "dashboard" | "home";
}

export default function OnboardingHeroBanner({
  userName,
  variant = "dashboard",
}: OnboardingHeroBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const { state } = useOnboarding();

  // Don't show if user already has a storefront or dismissed
  if (state.hasStorefront || isDismissed) return null;

  // Only show for users who want to sell
  const wantsToSell =
    state.userIntent === "seller" || state.userIntent === "both";
  if (!wantsToSell && state.userIntent !== null) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    // Optionally persist this in localStorage
    localStorage.setItem("tradelynk_hero_dismissed", "true");
  };

  if (variant === "home") {
    return (
      <div className="relative bg-gradient-to-br from-black via-gray-900 to-black rounded-2xl p-6 mx-4 my-4 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">🚀</div>
            <button
              onClick={handleDismiss}
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <svg
                className="w-4 h-4 text-white/70"
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

          <h3
            className="text-xl font-bold text-white mb-2"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            Create Your Free Website
          </h3>

          <p
            className="text-gray-300 text-sm mb-4"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            Start selling in 2 minutes — No credit card required
          </p>

          <Link
            href="/become-a-seller"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold rounded-lg
                     hover:bg-gray-100 active:scale-[0.98] transition-all duration-200 group"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 600,
            }}
          >
            <span>Create Website</span>
            <span className="group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {["Free forever", "No coding", "2 min setup"].map(
              (feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full text-xs text-white/80"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  ✅ {feature}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard variant - larger and more prominent
  return (
    <div className="relative bg-gradient-to-br from-black via-gray-900 to-black rounded-2xl p-8 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-10 -left-10 w-48 h-48 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left Content */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full mb-4">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span
                className="text-xs text-white/80"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 500,
                }}
              >
                New Feature
              </span>
            </div>

            <h2
              className="text-2xl lg:text-3xl font-bold text-white mb-3"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              🚀 Create Your Free Website
            </h2>

            <p
              className="text-gray-300 text-base lg:text-lg mb-6 max-w-xl"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              Start selling in 2 minutes — Get your own branded mini-website
              with home, about, products & contact pages. No credit card
              required.
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-4 mb-6">
              {[
                { emoji: "✅", text: "Free forever" },
                { emoji: "✅", text: "No coding needed" },
                { emoji: "✅", text: "Ready in 2 minutes" },
                { emoji: "✅", text: "Share on Instagram" },
              ].map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 text-white/90 text-sm"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  {feature.emoji} {feature.text}
                </span>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/become-a-seller"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl
                         hover:bg-gray-100 active:scale-[0.98] transition-all duration-200 group shadow-lg"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 700,
                }}
              >
                <span>Create Website</span>
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>

              <button
                onClick={handleDismiss}
                className="px-6 py-3 text-white/70 font-medium rounded-xl
                         hover:bg-white/10 active:scale-[0.98] transition-all duration-200"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 500,
                }}
              >
                Maybe later
              </button>
            </div>
          </div>

          {/* Right Side - Visual/Preview */}
          <div className="hidden lg:block flex-shrink-0">
            <div className="relative w-64 h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl overflow-hidden border border-white/10">
              {/* Mock Website Preview */}
              <div className="absolute inset-0 p-3">
                {/* Browser bar */}
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <div className="flex-1 mx-2 h-4 bg-white/10 rounded text-center">
                    <span className="text-[8px] text-white/50">
                      yourstore.tradelynk.com
                    </span>
                  </div>
                </div>

                {/* Mock content */}
                <div className="space-y-2">
                  <div className="h-12 bg-white/10 rounded animate-pulse" />
                  <div className="flex gap-2">
                    <div
                      className="w-1/2 h-8 bg-white/10 rounded animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="w-1/2 h-8 bg-white/10 rounded animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className="h-16 bg-white/10 rounded animate-pulse"
                      style={{ animationDelay: "0.6s" }}
                    />
                    <div
                      className="h-16 bg-white/10 rounded animate-pulse"
                      style={{ animationDelay: "0.8s" }}
                    />
                  </div>
                </div>
              </div>

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
            </div>

            {/* Floating elements */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg animate-bounce">
              ✓
            </div>
          </div>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20
                 flex items-center justify-center transition-colors"
      >
        <svg
          className="w-5 h-5 text-white/70"
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
  );
}
