"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { sellersApi } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";
import GrammarChecker from "@/components/GrammarChecker";
import ThemeSelector from "@/components/ThemeSelector";
import StorefrontPreview from "@/components/StorefrontPreview";
import { Theme } from "@/types/seller";

export default function BecomeASellerPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { markStorefrontCreated } = useOnboarding();
  const router = useRouter();

  // Redirect existing sellers away from this page
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (
        user.role === "SELLER" ||
        user.role === "BOTH" ||
        user.role === "ADMIN"
      ) {
        router.push("/create-item");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If user is already a seller, show redirect message
  if (
    isAuthenticated &&
    user &&
    (user.role === "SELLER" || user.role === "BOTH" || user.role === "ADMIN")
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-lg text-gray-600">
            You are already a seller! Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="w-full bg-[#0F0F0F] text-white py-20 pb-28 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-500/30 text-purple-300 text-sm font-semibold px-4 py-2 rounded-full">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                Free storefront · No credit card needed
              </div>

              {/* Main Headline */}
              <div>
                <h1
                  className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  Stop Sending Photos.<br />
                  <span className="text-purple-400">Get a Real Store.</span> 🏪
                </h1>
              </div>

              {/* Subheading */}
              <div>
                <p
                  className="text-xl text-gray-300 leading-relaxed"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Your own professional mini website at{" "}
                  <span className="text-purple-400 font-semibold">yourname.tradelynk.app</span>.
                  Share one link, let customers browse everything you sell, and receive orders directly — no more DM chaos.
                </p>
              </div>

              {/* What you get — quick hits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
                  <p className="text-2xl mb-1">🌐</p>
                  <p className="text-white font-semibold text-sm">Your own link</p>
                  <p className="text-gray-400 text-xs">yourname.tradelynk.app</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
                  <p className="text-2xl mb-1">🛍️</p>
                  <p className="text-white font-semibold text-sm">Product catalogue</p>
                  <p className="text-gray-400 text-xs">Unlimited listings</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
                  <p className="text-2xl mb-1">💸</p>
                  <p className="text-white font-semibold text-sm">Direct payments</p>
                  <p className="text-gray-400 text-xs">To your bank · 24h</p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#storefront-feature"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all duration-300 shadow-lg hover:shadow-purple-900/50 text-lg group"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  <span>See How It Works</span>
                  <span className="group-hover:translate-y-1 transition-transform">↓</span>
                </a>
                <a
                  href="#form"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-white/20 text-white font-bold rounded-xl hover:border-purple-400 hover:text-purple-300 transition-all duration-300 text-lg"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  Skip to Setup →
                </a>
              </div>

            </div>

            {/* Right Side - Stats Card */}
            <div className="flex flex-col gap-6">
              {/* Main Stats Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300">
                <div
                  className="text-5xl font-bold text-white mb-2"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  50+
                </div>
                <p
                  className="text-gray-300 text-sm mb-6"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Active sellers on TradeLynk
                </p>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-white/10">
                    <span
                      className="text-gray-300"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      Avg. monthly earnings
                    </span>
                    <span
                      className="text-2xl font-bold text-white"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 700,
                      }}
                    >
                      ₦50K+
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-white/10">
                    <span
                      className="text-gray-300"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      Items sold this month
                    </span>
                    <span
                      className="text-2xl font-bold text-white"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 700,
                      }}
                    >
                      1,200+
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span
                      className="text-gray-300"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      Customer satisfaction
                    </span>
                    <span
                      className="text-2xl font-bold text-white"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 700,
                      }}
                    >
                      4.8★
                    </span>
                  </div>
                </div>
              </div>

              {/* Storefront URL Preview */}
              <div className="bg-white rounded-2xl p-6">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-3">
                  Your storefront will look like this:
                </p>
                {/* Browser bar mockup */}
                <div className="bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-200 border-b border-gray-300">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-600 font-medium text-center border border-gray-300">
                      yourname.tradelynk.app
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="h-16 bg-linear-to-r from-purple-500 to-purple-700 rounded-lg flex items-center px-4 gap-3">
                      <div className="w-10 h-10 bg-white/30 rounded-full"></div>
                      <div>
                        <div className="h-3 w-24 bg-white/80 rounded mb-1"></div>
                        <div className="h-2 w-16 bg-white/50 rounded"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="aspect-square bg-gray-200 rounded-lg"></div>
                      <div className="aspect-square bg-gray-200 rounded-lg"></div>
                      <div className="aspect-square bg-gray-200 rounded-lg"></div>
                    </div>
                    <div className="h-2 w-3/4 bg-gray-200 rounded"></div>
                    <div className="h-2 w-1/2 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <a
                  href="#form"
                  className="inline-block w-full py-3 mt-4 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors text-center"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  Claim Your Store →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BEFORE vs AFTER ─────────────────────── */}
      <section className="w-full bg-[#0F0F0F] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-purple-400 font-semibold text-sm tracking-widest uppercase mb-4">
            THE DIFFERENCE
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 leading-tight" style={{ fontFamily: "Clash Display", fontWeight: 700 }}>
            Instagram DMs vs. your TradeLynk storefront
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* Before */}
            <div className="bg-red-950/40 border border-red-800/40 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">😵</span>
                <p className="text-red-300 font-bold text-lg">Before TradeLynk</p>
              </div>
              <ul className="space-y-3">
                {[
                  "Sending the same photos to every customer over and over",
                  "\"How much?\" \"Available?\" — same questions, all day",
                  "No way for customers to browse what you sell",
                  "Payment via manual bank transfer with no record",
                  "Lose sales when you're offline or asleep",
                  "Customers can't find you easily — no single link to share",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-red-200 text-sm">
                    <span className="text-red-500 mt-0.5 shrink-0">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="bg-green-950/40 border border-green-700/40 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">🚀</span>
                <p className="text-green-300 font-bold text-lg">With TradeLynk</p>
              </div>
              <ul className="space-y-3">
                {[
                  "All your products live on your own site — customers browse themselves",
                  "Share ONE link: yourname.tradelynk.app — works everywhere",
                  "Customers order directly with full product details + photos",
                  "Payments tracked and paid to your bank within 24 hours",
                  "Your store works 24/7 — even while you sleep",
                  "Professional, branded presence that builds trust instantly",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-green-200 text-sm">
                    <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <a
            href="#storefront-feature"
            className="inline-flex items-center gap-2 mt-10 text-purple-400 font-semibold hover:text-purple-300 transition-colors"
          >
            See what your storefront looks like ↓
          </a>
        </div>
      </section>

      {/* ── STOREFRONT FEATURE SHOWCASE ─────────────────────── */}
      <section id="storefront-feature" className="w-full bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Label */}
          <p className="text-purple-600 font-semibold text-sm tracking-widest uppercase mb-3 text-center">
            YOUR OWN MINI WEBSITE
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold text-black mb-4 text-center leading-tight"
            style={{ fontFamily: "Clash Display", fontWeight: 700 }}
          >
            Not just a listing. A full storefront.
          </h2>
          <p className="text-gray-500 text-lg text-center mb-16 max-w-2xl mx-auto leading-relaxed">
            When you become a seller on TradeLynk, you get your own professional
            mini website — not just a profile. Share one link everywhere and let
            customers browse, order, and pay directly.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Feature highlights */}
            <div className="space-y-8">
              {/* Feature 1 */}
              <div className="flex items-start gap-5">
                <div className="shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
                  🌐
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black mb-1" style={{ fontFamily: "Clash Display" }}>
                    Your own unique link
                  </h3>
                  <p className="text-gray-500 leading-relaxed">
                    Get <span className="font-semibold text-purple-600">yourname.tradelynk.app</span> — a real web address you can
                    drop in your Instagram bio, WhatsApp status, or anywhere online.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-5">
                <div className="shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
                  🛍️
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black mb-1" style={{ fontFamily: "Clash Display" }}>
                    Product catalogue — not just photos
                  </h3>
                  <p className="text-gray-500 leading-relaxed">
                    List unlimited products with prices, descriptions, and photos. Organize
                    them into collections. Customers can browse everything in one place.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-5">
                <div className="shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
                  🎨
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black mb-1" style={{ fontFamily: "Clash Display" }}>
                    Pick your look & theme
                  </h3>
                  <p className="text-gray-500 leading-relaxed">
                    Choose from multiple storefront themes and brand colours to match your
                    business personality — no design skills needed.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-start gap-5">
                <div className="shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
                  📦
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black mb-1" style={{ fontFamily: "Clash Display" }}>
                    Orders come straight to you
                  </h3>
                  <p className="text-gray-500 leading-relaxed">
                    Customers order directly on your storefront. You get notified instantly
                    and receive payment to your bank — no middleman.
                  </p>
                </div>
              </div>

              <a
                href="#form"
                className="inline-flex items-center gap-3 px-8 py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-purple-200 text-lg group mt-2"
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                <span>Set Up My Storefront</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </a>
            </div>

            {/* Right: Storefront URL Bar + Card mockup */}
            <div className="relative">
              {/* Decorative glow */}
              <div className="absolute -inset-4 bg-purple-100 rounded-3xl blur-2xl opacity-40 pointer-events-none"></div>

              <div className="relative bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden">
                {/* Browser chrome */}
                <div className="bg-gray-100 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 bg-white rounded-md px-4 py-1.5 text-sm text-gray-500 font-medium border border-gray-300 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-purple-600 font-semibold">adaeze</span>.tradelynk.app
                  </div>
                </div>

                {/* Storefront content mockup */}
                <div className="bg-gray-50">
                  {/* Store banner */}
                  <div className="h-28 bg-linear-to-r from-purple-600 to-purple-800 relative flex items-end px-6 pb-4">
                    <div className="absolute bottom-0 translate-y-1/2 left-6 w-16 h-16 bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center text-2xl">
                      👗
                    </div>
                  </div>
                  <div className="pt-12 px-6 pb-4">
                    <h4 className="text-lg font-bold text-gray-900">Adaeze Couture</h4>
                    <p className="text-gray-500 text-sm mb-1">adaeze.tradelynk.app</p>
                    <p className="text-gray-600 text-sm">Nigerian fashion for the modern woman 🇳🇬</p>
                    <div className="flex gap-2 mt-3">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">✓ Verified Seller</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">⚡ Ships in 24h</span>
                    </div>
                  </div>

                  {/* Product grid */}
                  <div className="px-6 pb-6">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Products</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { bg: "bg-orange-200", emoji: "👗", price: "₦8,500" },
                        { bg: "bg-pink-200", emoji: "👜", price: "₦12,000" },
                        { bg: "bg-blue-200", emoji: "👠", price: "₦6,200" },
                      ].map((item, i) => (
                        <div key={i} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                          <div className={`${item.bg} aspect-square flex items-center justify-center text-3xl`}>
                            {item.emoji}
                          </div>
                          <div className="p-2">
                            <div className="h-1.5 bg-gray-200 rounded w-3/4 mb-1.5"></div>
                            <p className="text-xs font-bold text-gray-800">{item.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 bg-purple-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                Free to set up ✨
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Selling Works Section */}
      <section className="w-full bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-16">
            <p className="text-purple-600 font-semibold text-sm tracking-widest uppercase mb-3">
              HOW IT WORKS
            </p>
            <h2
              className="text-4xl md:text-5xl font-bold text-black mb-3"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              Up and running in 3 simple steps
            </h2>
            <div className="h-1 w-20 bg-purple-600 mx-auto rounded-full"></div>
          </div>

          {/* Steps Container */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1: Create Storefront */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300 relative z-10">
                <span className="text-5xl">🏪</span>
              </div>

              <h3 className="text-2xl font-bold text-black mb-4" style={{ fontFamily: "Clash Display", fontWeight: 600 }}>
                Step 1
              </h3>

              <h4 className="text-xl font-semibold text-black mb-3" style={{ fontFamily: "Clash Display", fontWeight: 600 }}>
                Create Your Storefront
              </h4>

              <p className="text-gray-600 text-sm leading-relaxed">
                Sign up, choose your store name, and get your personal link at{" "}
                <span className="text-purple-600 font-semibold">yourname.tradelynk.app</span> — in under 5 minutes.
              </p>
            </div>

            {/* Step 2: Add Products */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300 relative z-10">
                <span className="text-5xl">📸</span>
              </div>

              <h3 className="text-2xl font-bold text-black mb-4" style={{ fontFamily: "Clash Display", fontWeight: 600 }}>
                Step 2
              </h3>

              <h4 className="text-xl font-semibold text-black mb-3" style={{ fontFamily: "Clash Display", fontWeight: 600 }}>
                Add Your Products
              </h4>

              <p className="text-gray-600 text-sm leading-relaxed">
                Upload photos, set prices, write descriptions, and organise into collections.
                Your storefront is instantly updated — no tech skills needed.
              </p>
            </div>

            {/* Step 3: Share & Get Paid */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300 relative z-10">
                <span className="text-5xl">💰</span>
              </div>

              <h3 className="text-2xl font-bold text-black mb-4" style={{ fontFamily: "Clash Display", fontWeight: 600 }}>
                Step 3
              </h3>

              <h4 className="text-xl font-semibold text-black mb-3" style={{ fontFamily: "Clash Display", fontWeight: 600 }}>
                Share Your Link & Get Paid
              </h4>

              <p className="text-gray-600 text-sm leading-relaxed">
                Drop your storefront link in your Instagram bio or WhatsApp status. Customers
                order directly and you get paid to your bank within 24–48 hours.
              </p>
            </div>
          </div>

          {/* CTA below steps */}
          <div className="text-center mt-14">
            <a
              href="#form"
              className="inline-flex items-center gap-3 px-8 py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-purple-200 text-lg group"
              style={{ fontFamily: "Clash Display", fontWeight: 700 }}
            >
              <span>Start Building My Store</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
            <p className="text-gray-400 text-sm mt-3">Free to start · No credit card needed</p>
          </div>
        </div>
      </section>

      {/* ── BRIDGE — "You're 5 mins away" ─────────────────────── */}
      <section className="w-full bg-purple-600 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-purple-200 font-semibold text-sm tracking-widest uppercase mb-3">
            READY?
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "Clash Display", fontWeight: 700 }}>
            You're 5 minutes away from your own store.
          </h2>
          <p className="text-purple-100 text-lg mb-8 leading-relaxed">
            Fill in the form below to claim your storefront link, customise your look,
            and go live. It's completely free — no credit card, no tech skills needed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-white/80 text-sm font-medium">
            <span>✓ Free forever</span>
            <span className="hidden sm:block">·</span>
            <span>✓ Your own subdomain</span>
            <span className="hidden sm:block">·</span>
            <span>✓ Unlimited products</span>
            <span className="hidden sm:block">·</span>
            <span>✓ Direct bank payments</span>
          </div>
          <a
            href="#form"
            className="inline-flex items-center gap-3 mt-8 px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-all duration-200 shadow-lg text-lg group"
            style={{ fontFamily: "Clash Display", fontWeight: 700 }}
          >
            <span>Set Up My Store Now</span>
            <span className="group-hover:translate-y-1 transition-transform">↓</span>
          </a>
        </div>
      </section>

      {/* Seller Activation Form Section */}
      <SellerActivationForm
        isAuthenticated={isAuthenticated}
        router={router}
        userName={user?.name || ""}
        onStorefrontCreated={markStorefrontCreated}
      />
    </div>
  );
}

// Seller Activation Form Component
function SellerActivationForm({
  isAuthenticated,
  router,
  userName,
  onStorefrontCreated,
}: {
  isAuthenticated: boolean;
  router: ReturnType<typeof useRouter>;
  userName: string;
  onStorefrontCreated: () => void;
}) {
  const [banks, setBanks] = useState<Array<{ code: string; name: string }>>([]);

  // Store profile fields
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [usernameError, setUsernameError] = useState("");
  const [linkValidationError, setLinkValidationError] = useState("");
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const [storeTagline, setStoreTagline] = useState("");
  const [bio, setBio] = useState("");

  // Optional fields
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [storeScreenshotUrl, setStoreScreenshotUrl] = useState("");

  // Theme fields
  const [selectedTheme, setSelectedTheme] = useState<Theme>("modern-clean");
  const [primaryColor, setPrimaryColor] = useState("#000000");
  const [secondaryColor, setSecondaryColor] = useState("#FFFFFF");
  const [layoutType, setLayoutType] = useState("multi-page");

  // Existing fields
  const [businessName, setBusinessName] = useState("");
  const [campusAddress, setCampusAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validationStatus, setValidationStatus] = useState<
    "idle" | "validating" | "valid" | "invalid"
  >("idle");

  // Fetch banks on component mount
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const data = await sellersApi.getBanks();
        if (data.success) {
          setBanks(data.data);
        }
      } catch (err) {
        console.error("Error fetching banks:", err);
        setError("Failed to load banks. Please refresh the page.");
      }
    };

    if (isAuthenticated) {
      fetchBanks();
    }
  }, [isAuthenticated]);

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (!username || username.length < 3) {
        setUsernameStatus("idle");
        return;
      }

      // Validate format
      const validFormat = /^[a-z0-9-]+$/.test(username);
      if (!validFormat) {
        setUsernameStatus("idle");
        setUsernameError(
          "Only lowercase letters, numbers, and hyphens allowed",
        );
        return;
      }

      setUsernameStatus("checking");
      setUsernameError("");

      try {
        const data = await sellersApi.checkUsername(username);
        // API returns: {success: true, available: true, message: "..."}
        if (data.success && data.available) {
          setUsernameStatus("available");
          setUsernameError("");
        } else {
          setUsernameStatus("taken");
          setUsernameError(data.message || "Username is taken");
        }
      } catch (err) {
        console.error("Username check error:", err);
        setUsernameStatus("idle");
        setUsernameError("Failed to check username availability");
      }
    };

    const debounceTimer = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounceTimer);
  }, [username]);

  // Validate account number when it changes
  useEffect(() => {
    const validateAccountNumber = async () => {
      if (accountNumber.length === 10 && bankCode) {
        try {
          setValidationStatus("validating");
          const data = await sellersApi.validateAccount(
            accountNumber,
            bankCode,
          );

          if (data.success) {
            setAccountName(data.data.accountName);
            setValidationStatus("valid");
          } else {
            setValidationStatus("invalid");
            setError(data.message || "Invalid account number");
          }
        } catch (err) {
          setValidationStatus("invalid");
          setError("Failed to validate account number");
        }
      } else {
        setValidationStatus("idle");
        setAccountName("");
      }
    };

    const debounceTimer = setTimeout(validateAccountNumber, 500);
    return () => clearTimeout(debounceTimer);
  }, [accountNumber, bankCode]);

  // Generate username from name
  const generateUsername = () => {
    if (!userName) return;

    const generated = userName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);

    setUsername(generated);
  };

  // Handle theme change
  const handleThemeChange = (
    theme: Theme,
    primary: string,
    secondary: string,
  ) => {
    setSelectedTheme(theme);
    setPrimaryColor(primary);
    setSecondaryColor(secondary);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!username || usernameStatus !== "available") {
      setError("Please provide a valid, available username");
      return;
    }

    if (
      !storeTagline ||
      storeTagline.length < 10 ||
      storeTagline.length > 100
    ) {
      setError("Store tagline must be between 10-100 characters");
      return;
    }

    if (!bio || bio.length < 50 || bio.length > 500) {
      setError("Bio must be between 50-500 characters");
      return;
    }

    if (!bannerImageUrl) {
      setError("Please upload a banner image for your storefront");
      return;
    }

    if (!bankName || !accountNumber || !agreedToTerms) {
      setError("Please fill in all required fields and agree to terms");
      return;
    }

    if (validationStatus !== "valid") {
      setError("Please validate your account number first");
      return;
    }

    if (phoneNumber && phoneNumber.length !== 11) {
      setError("Phone number must be 11 digits");
      return;
    }

    if (whatsappNumber && whatsappNumber.length !== 11) {
      setError("WhatsApp number must be 11 digits");
      return;
    }

    setIsLoading(true);

    try {
      const data = await sellersApi.activateSeller({
        // Required new fields
        username,
        storeTagline,
        bio,

        // Optional new fields
        logoUrl: logoUrl || undefined,
        bannerImageUrl: bannerImageUrl || undefined,
        phoneNumber: phoneNumber || undefined,
        whatsappNumber: whatsappNumber || undefined,
        instagramHandle: instagramHandle || undefined,
        twitterHandle: twitterHandle || undefined,
        storeScreenshotUrl: storeScreenshotUrl || undefined,

        // Theme fields
        theme: selectedTheme,
        primaryColor,
        secondaryColor,
        layoutType,

        // Existing fields
        businessName: businessName || undefined,
        campusAddress: campusAddress || undefined,
        bankName,
        accountNumber,
        accountName,
        agreedToTerms,
      });

      if (data.success) {
        setSuccess(true);
        // Mark storefront as created in onboarding
        onStorefrontCreated();

        // Redirect to the seller's storefront using subdomain format
        setTimeout(() => {
          window.location.href = `https://${username}.tradelynk.app`;
        }, 2000);
      } else {
        setError(data.message || "Failed to activate seller account");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <section
        id="form"
        className="w-full bg-gray-50 py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-3xl font-bold text-black mb-4"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            Ready to become a seller?
          </h2>
          <p
            className="text-gray-600 mb-8"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            You need to create an account first
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition-colors"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            Create Account
          </Link>
        </div>
      </section>
    );
  }

  if (success) {
    return (
      <section
        id="form"
        className="w-full bg-green-50 py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2
            className="text-3xl font-bold text-black mb-4"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            ✅ Seller Account Activated!
          </h2>
          <p
            className="text-gray-600 mb-4"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            Welcome to the seller community! Your storefront is now live at{" "}
            <a
              href={`https://${username}.tradelynk.app`}
              className="font-semibold text-indigo-600 hover:text-indigo-800 underline"
            >
              {username}.tradelynk.app
            </a>
          </p>
          <p
            className="text-sm text-gray-500 mb-6"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            Redirecting you to your storefront where you can start adding
            products...
          </p>
          <div className="flex justify-center gap-4">
            <a
              href={`https://${username}.tradelynk.app`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition-colors"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              Go to My Storefront →
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="form" className="w-full bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <div className="text-center mb-12">
          <p className="text-purple-600 font-semibold text-sm tracking-widest uppercase mb-3">
            STEP 1 OF 1 — FREE TO JOIN
          </p>
          <h2
            className="text-4xl font-bold text-black mb-3"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            🏪 Build Your Store — It Takes 5 Minutes
          </h2>
          <p
            className="text-gray-500 max-w-xl mx-auto"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            Fill in your details below to claim your storefront at{" "}
            <span className="text-purple-600 font-semibold">yourname.tradelynk.app</span>.
            Customers will be able to browse your products and order directly.
          </p>
        </div>

        {/* Form + Preview Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Card - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <form onSubmit={handleSubmit} className="space-y-10">
                {/* Error Alert */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {/* SECTION 1: Store Identity (NEW) */}
                <div className="border-b border-gray-200 pb-8">
                  <h3
                    className="text-2xl font-semibold text-black mb-6"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    Store Identity (Required)
                  </h3>

                  {/* Store Link */}
                  <div className="mb-6">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 500,
                      }}
                    >
                      Store Link <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 relative">
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => {
                              const value = e.target.value.toLowerCase();
                              // Check for invalid characters and show specific error
                              const invalidChars = value.match(/[^a-z0-9-]/g);
                              if (invalidChars) {
                                const uniqueInvalid = [
                                  ...new Set(invalidChars),
                                ].join(", ");
                                setLinkValidationError(
                                  `Invalid characters: "${uniqueInvalid}" — Only lowercase letters (a-z), numbers (0-9), and hyphens (-) are allowed in your store link.`,
                                );
                              } else {
                                setLinkValidationError("");
                              }
                              // Only set valid characters
                              setUsername(value.replace(/[^a-z0-9-]/g, ""));
                            }}
                            placeholder="your-store-name"
                            maxLength={50}
                            className={`flex-1 w-full px-4 py-3 border border-r-0 rounded-l-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 ${
                              linkValidationError
                                ? "border-red-500 bg-red-50"
                                : "border-gray-300"
                            }`}
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          />
                          <span
                            className="inline-flex items-center px-3 py-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-500 text-sm"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          >
                            .tradelynk.app
                          </span>
                        </div>
                        {usernameStatus === "checking" && (
                          <div className="absolute right-3 top-3">
                            <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
                          </div>
                        )}
                        {usernameStatus === "available" &&
                          !linkValidationError && (
                            <div className="absolute right-3 top-3 text-green-500 text-xl">
                              ✓
                            </div>
                          )}
                        {usernameStatus === "taken" && (
                          <div className="absolute right-3 top-3 text-red-500 text-xl">
                            ✗
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={generateUsername}
                        className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm whitespace-nowrap"
                        style={{
                          fontFamily: "Clash Display",
                          fontWeight: 500,
                        }}
                      >
                        Generate from name
                      </button>
                    </div>

                    {/* Validation Error Message */}
                    {linkValidationError && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">⚠️</span>
                          <div>
                            <p
                              className="text-sm text-red-600 font-medium"
                              style={{
                                fontFamily: "Clash Display",
                                fontWeight: 500,
                              }}
                            >
                              {linkValidationError}
                            </p>
                            <p
                              className="text-xs text-red-500 mt-1"
                              style={{
                                fontFamily: "Clash Display",
                                fontWeight: 400,
                              }}
                            >
                              Examples of valid links: my-store, john-shop,
                              tech-gadgets-ng
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                      <p
                        className="text-xs text-gray-500"
                        style={{
                          fontFamily: "Clash Display",
                          fontWeight: 400,
                        }}
                      >
                        Your full store link: {username || "your-store"}
                        .tradelynk.app
                      </p>
                      {usernameError && (
                        <p className="text-xs text-red-500">{usernameError}</p>
                      )}
                    </div>
                  </div>

                  {/* Store Tagline */}
                  <div className="mb-6">
                    <GrammarChecker
                      text={storeTagline}
                      onTextChange={setStoreTagline}
                      type="tagline"
                      label="Store Tagline *"
                      maxLength={100}
                    />
                    <p
                      className="text-xs text-gray-500 mt-1"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      A catchy one-liner (10-100 chars)
                    </p>
                  </div>

                  {/* Bio */}
                  <div>
                    <GrammarChecker
                      text={bio}
                      onTextChange={setBio}
                      type="bio"
                      label="Store Bio *"
                      maxLength={500}
                    />
                    <p
                      className="text-xs text-gray-500 mt-1"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      Tell buyers about yourself and what you sell (50-500
                      chars)
                    </p>
                  </div>
                </div>

                {/* SECTION 2: Visual Branding */}
                <div className="border-b border-gray-200 pb-8">
                  <h3
                    className="text-2xl font-semibold text-black mb-2"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    Visual Branding
                  </h3>
                  <p
                    className="text-gray-600 mb-6"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    Make your storefront stand out with professional visuals
                  </p>

                  {/* Banner Image - Required */}
                  <div className="mb-8">
                    <div className="bg-linear-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                          <span className="text-xl">🖼️</span>
                        </div>
                        <div>
                          <h4
                            className="text-lg font-semibold text-black"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 600,
                            }}
                          >
                            Store Banner <span className="text-red-500">*</span>
                          </h4>
                          <p
                            className="text-sm text-gray-600 mt-1"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          >
                            A beautiful banner makes your store look
                            professional and attracts more buyers. This is the
                            first thing customers see!
                          </p>
                        </div>
                      </div>
                      <ImageUpload
                        onUploadComplete={setBannerImageUrl}
                        currentImageUrl={bannerImageUrl}
                        label=""
                        helpText="Upload a wide image (1200x400px recommended) that represents your brand"
                      />
                      {!bannerImageUrl && (
                        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                          <span>⚠️</span> Banner image is required to create
                          your storefront
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Store Logo - Optional */}
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                          <span className="text-base">🏪</span>
                        </div>
                        <div>
                          <h4
                            className="text-base font-semibold text-black"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 600,
                            }}
                          >
                            Store Logo
                          </h4>
                          <p
                            className="text-xs text-gray-500"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          >
                            Optional • Square image (300x300px)
                          </p>
                        </div>
                      </div>
                      <ImageUpload
                        onUploadComplete={setLogoUrl}
                        currentImageUrl={logoUrl}
                        label=""
                        helpText="Your store's logo or profile picture"
                      />
                    </div>

                    {/* Instagram Profile - Optional for verification */}
                    <div className="bg-linear-to-br from-pink-50 to-orange-50 rounded-xl p-5 border border-pink-100">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                        </div>
                        <div>
                          <h4
                            className="text-base font-semibold text-black"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 600,
                            }}
                          >
                            Instagram Profile
                          </h4>
                          <p
                            className="text-xs text-gray-500"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          >
                            Optional • Helps verify your business
                          </p>
                        </div>
                      </div>
                      <ImageUpload
                        onUploadComplete={setStoreScreenshotUrl}
                        currentImageUrl={storeScreenshotUrl}
                        label=""
                        helpText="Screenshot of your Instagram profile or business page"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2.5: Choose Your Theme (NEW) */}
                <div className="border-b border-gray-200 pb-8">
                  <h3
                    className="text-2xl font-semibold text-black mb-2"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    Choose Your Theme
                  </h3>
                  <p
                    className="text-gray-600 mb-6"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    Select a theme that represents your brand. You can customize
                    colors to match your style.
                  </p>

                  <ThemeSelector
                    selectedTheme={selectedTheme}
                    onThemeChange={handleThemeChange}
                    customColors={{
                      primary: primaryColor,
                      secondary: secondaryColor,
                    }}
                  />
                </div>

                {/* SECTION 3: Contact Information (NEW - Optional) */}
                <div className="border-b border-gray-200 pb-8">
                  <h3
                    className="text-2xl font-semibold text-black mb-6"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    Contact Information (Optional)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Phone Number */}
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-700 mb-2"
                        style={{
                          fontFamily: "Clash Display",
                          fontWeight: 500,
                        }}
                      >
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) =>
                          setPhoneNumber(
                            e.target.value.replace(/\D/g, "").slice(0, 11),
                          )
                        }
                        placeholder="08012345678"
                        maxLength={11}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                        style={{
                          fontFamily: "Clash Display",
                          fontWeight: 400,
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">11 digits</p>
                    </div>

                    {/* WhatsApp Number */}
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-700 mb-2"
                        style={{
                          fontFamily: "Clash Display",
                          fontWeight: 500,
                        }}
                      >
                        WhatsApp Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={whatsappNumber}
                        onChange={(e) =>
                          setWhatsappNumber(
                            e.target.value.replace(/\D/g, "").slice(0, 11),
                          )
                        }
                        placeholder="08012345678"
                        maxLength={11}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                        style={{
                          fontFamily: "Clash Display",
                          fontWeight: 400,
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">11 digits</p>
                    </div>

                    {/* Instagram Handle */}
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-700 mb-2"
                        style={{
                          fontFamily: "Clash Display",
                          fontWeight: 500,
                        }}
                      >
                        Instagram Handle (Optional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-gray-500">
                          @
                        </span>
                        <input
                          type="text"
                          value={instagramHandle}
                          onChange={(e) =>
                            setInstagramHandle(
                              e.target.value.replace(/[^a-zA-Z0-9_.]/g, ""),
                            )
                          }
                          placeholder="yourusername"
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 400,
                          }}
                        />
                      </div>
                    </div>

                    {/* Twitter Handle */}
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-700 mb-2"
                        style={{
                          fontFamily: "Clash Display",
                          fontWeight: 500,
                        }}
                      >
                        Twitter Handle (Optional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-gray-500">
                          @
                        </span>
                        <input
                          type="text"
                          value={twitterHandle}
                          onChange={(e) =>
                            setTwitterHandle(
                              e.target.value.replace(/[^a-zA-Z0-9_]/g, ""),
                            )
                          }
                          placeholder="yourusername"
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 400,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Business Information (Optional) */}
                <div className="border-b border-gray-200 pb-8">
                  <h3
                    className="text-2xl font-semibold text-black mb-6"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    Business Information (Optional)
                  </h3>

                  {/* Business Name */}
                  <div className="mb-6">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 500,
                      }}
                    >
                      Business Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g., John's Used Books"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    />
                  </div>

                  {/* Campus Address */}
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 500,
                      }}
                    >
                      Campus Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={campusAddress}
                      onChange={(e) => setCampusAddress(e.target.value)}
                      placeholder="e.g., Male Hostel Block B, Room 205"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    />
                  </div>
                </div>

                {/* SECTION 5: Bank Account Details (Required) */}
                <div className="border-b border-gray-200 pb-8">
                  <h3
                    className="text-2xl font-semibold text-black mb-6"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    Bank Account Details (Required)
                  </h3>

                  {/* Bank Name */}
                  <div className="mb-6">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 500,
                      }}
                    >
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => {
                        const selected = banks.find(
                          (b) => b.name === e.target.value,
                        );
                        setBankName(e.target.value);
                        setBankCode(selected?.code || "");
                        setAccountNumber("");
                        setAccountName("");
                        setValidationStatus("idle");
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      <option value="">Select a bank</option>
                      {banks.map((bank) => (
                        <option key={bank.code} value={bank.name}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account Number */}
                  <div className="mb-6">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 500,
                      }}
                    >
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) =>
                          setAccountNumber(e.target.value.slice(0, 10))
                        }
                        placeholder="0123456789"
                        maxLength={10}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                        style={{
                          fontFamily: "Clash Display",
                          fontWeight: 400,
                        }}
                        disabled={!bankCode}
                      />
                      {validationStatus === "validating" && (
                        <div className="absolute right-3 top-3">
                          <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
                        </div>
                      )}
                      {validationStatus === "valid" && (
                        <div className="absolute right-3 top-3 text-green-500 text-xl">
                          ✓
                        </div>
                      )}
                      {validationStatus === "invalid" && (
                        <div className="absolute right-3 top-3 text-red-500 text-xl">
                          ✗
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">10 digits</p>
                  </div>

                  {/* Account Name */}
                  <div className="mb-6">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 500,
                      }}
                    >
                      Account Name
                    </label>
                    <input
                      type="text"
                      value={accountName}
                      disabled
                      placeholder="Auto-filled after validation"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-900"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-filled when account is validated
                    </p>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p
                      className="text-sm text-gray-700"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 500,
                      }}
                    >
                      ℹ️ Why we need this:
                    </p>
                    <p
                      className="text-sm text-gray-600 mt-2"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      Your sales revenue will be sent directly to this account
                      within 24-48 hours after each sale.
                    </p>
                  </div>
                </div>

                {/* SECTION 6: Terms & Conditions */}
                <div className="pb-8">
                  <h3
                    className="text-2xl font-semibold text-black mb-6"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    Terms & Conditions
                  </h3>

                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-1 w-5 h-5"
                      />
                      <span
                        className="text-gray-700"
                        style={{
                          fontFamily: "Clash Display",
                          fontWeight: 400,
                        }}
                      >
                        I agree to the Seller Terms & Conditions{" "}
                        <span className="text-red-500">*</span>
                      </span>
                    </label>

                    <div
                      className="text-xs text-gray-500 ml-8 space-y-2"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      <p>
                        • I will only sell items allowed by marketplace policies
                      </p>
                      <p>
                        • I understand my bank details are encrypted and secure
                      </p>
                      <p>• I agree to maintain accurate product listings</p>
                    </div>
                  </div>
                </div>

                {/* Validation Errors */}
                {(usernameStatus !== "available" ||
                  validationStatus !== "valid" ||
                  !bannerImageUrl ||
                  linkValidationError) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p
                      className="text-sm font-semibold text-yellow-800 mb-2"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 600,
                      }}
                    >
                      ⚠️ Please complete the following before submitting:
                    </p>
                    <ul
                      className="text-sm text-yellow-700 space-y-1 ml-4"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      {linkValidationError && (
                        <li>• Fix the invalid characters in your store link</li>
                      )}
                      {usernameStatus !== "available" &&
                        !linkValidationError && (
                          <li>• Choose a valid and available store link</li>
                        )}
                      {!bannerImageUrl && (
                        <li>• Upload a banner image for your storefront</li>
                      )}
                      {validationStatus !== "valid" && (
                        <li>
                          • Validate your bank account number (must be 10 digits
                          and match selected bank)
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    usernameStatus !== "available" ||
                    validationStatus !== "valid" ||
                    !bannerImageUrl ||
                    !!linkValidationError
                  }
                  className="w-full py-4 px-6 bg-black hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Activating...
                    </>
                  ) : (
                    <>
                      Activate Seller Account & Create Storefront
                      <span>→</span>
                    </>
                  )}
                </button>

                {/* Footer Text */}
                <p
                  className="text-xs text-gray-600 text-center"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  By clicking, you agree to our Seller Agreement & Privacy
                  Policy. Your information is encrypted and secure.
                </p>
              </form>
            </div>
          </div>

          {/* Live Preview Sidebar - Takes 1 column (Desktop) */}
          <div className="hidden lg:block">
            <StorefrontPreview
              username={username || "your-store"}
              businessName={businessName || username || "Your Store"}
              storeTagline={storeTagline}
              bio={bio}
              theme={selectedTheme}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              logoUrl={logoUrl}
              bannerImageUrl={bannerImageUrl}
            />
          </div>
        </div>

        {/* Mobile/Tablet Preview Button - Fixed at bottom */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-linear-to-t from-white via-white to-transparent">
          <button
            type="button"
            onClick={() => setShowMobilePreview(true)}
            className="w-full py-4 px-6 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-[1.02]"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 600,
            }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Preview Your Store
            <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
              Live
            </span>
          </button>
        </div>

        {/* Mobile Preview Modal */}
        {showMobilePreview && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden animate-slide-up">
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-linear-to-r from-indigo-600 to-purple-600 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3
                      className="text-white font-semibold text-lg"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 600,
                      }}
                    >
                      Store Preview
                    </h3>
                    <p
                      className="text-white/70 text-xs"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      See how your store will look
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobilePreview(false)}
                  className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-white"
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

              {/* Preview Content */}
              <div
                className="overflow-y-auto"
                style={{ maxHeight: "calc(90vh - 80px)" }}
              >
                {/* Mini Store Card Preview */}
                <div className="p-4">
                  {/* Store URL Preview */}
                  <div className="bg-gray-100 rounded-xl p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      </div>
                      <div className="flex-1 bg-white rounded-lg px-3 py-1.5">
                        <p
                          className="text-xs text-gray-500 truncate"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 400,
                          }}
                        >
                          {username || "your-store"}.tradelynk.app
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Banner Preview */}
                  <div className="relative rounded-xl overflow-hidden mb-4 shadow-md">
                    {bannerImageUrl ? (
                      <img
                        src={bannerImageUrl}
                        alt="Store Banner"
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-32 flex items-center justify-center"
                        style={{ backgroundColor: primaryColor || "#000000" }}
                      >
                        <div className="text-center">
                          <span className="text-3xl">🏪</span>
                          <p
                            className="text-white/70 text-xs mt-1"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          >
                            Add a banner image
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Logo Overlay */}
                    <div className="absolute -bottom-6 left-4">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Store Logo"
                          className="w-16 h-16 rounded-xl border-4 border-white object-cover shadow-lg"
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-xl border-4 border-white flex items-center justify-center shadow-lg"
                          style={{ backgroundColor: primaryColor || "#000000" }}
                        >
                          <span className="text-2xl">🏪</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Store Info */}
                  <div className="pt-6 px-1">
                    <h4
                      className="text-xl font-bold text-gray-900"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 700,
                      }}
                    >
                      {businessName || username || "Your Store Name"}
                    </h4>

                    {storeTagline && (
                      <p
                        className="text-gray-600 text-sm mt-1"
                        style={{
                          fontFamily: "Clash Display",
                          fontWeight: 400,
                        }}
                      >
                        {storeTagline}
                      </p>
                    )}

                    {bio && (
                      <p
                        className="text-gray-500 text-sm mt-3 line-clamp-3"
                        style={{
                          fontFamily: "Clash Display",
                          fontWeight: 400,
                        }}
                      >
                        {bio}
                      </p>
                    )}

                    {/* Theme Preview Badge */}
                    <div className="mt-4 flex items-center gap-2">
                      <span
                        className="text-xs bg-gray-100 px-3 py-1.5 rounded-full text-gray-600"
                        style={{
                          fontFamily: "Clash Display",
                          fontWeight: 500,
                        }}
                      >
                        Theme:{" "}
                        {selectedTheme
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      <div className="flex items-center gap-1">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-200"
                          style={{ backgroundColor: primaryColor }}
                        ></div>
                        <div
                          className="w-4 h-4 rounded-full border border-gray-200"
                          style={{ backgroundColor: secondaryColor }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Sample Products Placeholder */}
                  <div className="mt-6">
                    <h5
                      className="text-sm font-semibold text-gray-700 mb-3"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 600,
                      }}
                    >
                      Your Products Will Appear Here
                    </h5>
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2].map((i) => (
                        <div
                          key={i}
                          className="bg-gray-100 rounded-xl p-3 animate-pulse"
                        >
                          <div className="bg-gray-200 rounded-lg aspect-square mb-2"></div>
                          <div className="bg-gray-200 rounded h-3 w-3/4 mb-1"></div>
                          <div className="bg-gray-200 rounded h-3 w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3">
                <button
                  onClick={() => setShowMobilePreview(false)}
                  className="w-full py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl transition-colors"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </section>
  );
}
