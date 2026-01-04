"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  X,
  Maximize2,
  ShoppingBag,
  Heart,
  Eye,
  Star,
  MessageCircle,
  Package,
  TrendingUp,
  CheckCircle,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Theme } from "@/types/seller";

interface StorefrontPreviewProps {
  username: string;
  businessName: string;
  storeTagline: string;
  bio: string;
  theme: Theme;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  bannerImageUrl?: string;
}

export default function StorefrontPreview({
  username,
  businessName,
  storeTagline,
  bio,
  theme,
  primaryColor,
  secondaryColor,
  logoUrl,
  bannerImageUrl,
}: StorefrontPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  const scale = isFullscreen ? 1 : 0.35;

  return (
    <>
      {/* Mini Preview */}
      <div className="sticky top-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Eye size={14} className="text-white" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900">
                  Live Preview
                </span>
                <p className="text-xs text-gray-500">
                  See your store in action
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors group"
              title="View fullscreen"
            >
              <Maximize2
                size={16}
                className="text-gray-600 group-hover:scale-110 transition-transform"
              />
            </button>
          </div>

          {/* Preview Window */}
          <div
            className="relative overflow-hidden bg-gray-100"
            style={{ height: "420px" }}
          >
            {/* Browser Chrome */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-gray-200 flex items-center px-2 gap-1.5 z-10">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <div className="flex-1 mx-2">
                <div className="bg-white rounded h-3 flex items-center px-2">
                  <span className="text-[6px] text-gray-400 truncate">
                    tradelynk.com/sellers/{username || "yourstore"}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="origin-top-left pt-6"
              style={{
                transform: `scale(${scale})`,
                width: `${100 / scale}%`,
                height: `${100 / scale}%`,
              }}
            >
              <StorefrontContent
                username={username}
                businessName={businessName}
                storeTagline={storeTagline}
                bio={bio}
                theme={theme}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                logoUrl={logoUrl}
                bannerImageUrl={bannerImageUrl}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>
          </div>

          {/* Quick Info */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                />
                <span className="text-xs font-medium text-gray-600">
                  {theme
                    .replace("-", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              </div>
              <button
                onClick={() => setIsFullscreen(true)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Expand <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-between px-4 z-20">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600 cursor-pointer transition-colors flex items-center justify-center group"
                    title="Close"
                  >
                    <X
                      size={8}
                      className="text-red-900 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </button>
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-500" />
                  <div className="w-3.5 h-3.5 rounded-full bg-green-500" />
                </div>
                <div className="bg-gray-700 rounded-lg px-3 py-1.5 flex items-center">
                  <span className="text-xs text-gray-300">
                    tradelynk.com/sellers/{username || "yourstore"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsFullscreen(false)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <X size={16} />
                Close Preview
              </button>
            </div>
            <div className="w-full h-full pt-14 overflow-auto">
              <StorefrontContent
                username={username}
                businessName={businessName}
                storeTagline={storeTagline}
                bio={bio}
                theme={theme}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                logoUrl={logoUrl}
                bannerImageUrl={bannerImageUrl}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Storefront Content Component - Matches actual storefront
function StorefrontContent({
  username,
  businessName,
  storeTagline,
  bio,
  theme,
  primaryColor,
  secondaryColor,
  logoUrl,
  bannerImageUrl,
  activeTab,
  setActiveTab,
}: StorefrontPreviewProps & {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const tabs = [
    { id: "home", label: "Home" },
    { id: "products", label: "Products" },
    { id: "about", label: "About" },
    { id: "contact", label: "Contact" },
  ];

  const isDarkTheme = [
    "bold-vibrant",
    "minimalist-luxury",
    "campus-friendly",
    "product-showcase",
  ].includes(theme);
  const hasBanner = !!bannerImageUrl;

  // Get gradient based on theme
  const getGradient = () => {
    switch (theme) {
      case "modern-clean":
        return `linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor}10 50%, ${primaryColor}05 100%)`;
      case "bold-vibrant":
        return `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
      case "minimalist-luxury":
        return "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)";
      case "campus-friendly":
        return `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
      case "product-showcase":
        return "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #2d2d2d 100%)";
      default:
        return `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation - sticky instead of fixed for preview context */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Name */}
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div
                  className="w-9 h-9 rounded-full overflow-hidden border-2"
                  style={{ borderColor: primaryColor }}
                >
                  <Image
                    src={logoUrl}
                    alt="Logo"
                    width={36}
                    height={36}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  {businessName?.[0]?.toUpperCase() || "S"}
                </div>
              )}
              <div>
                <span
                  className="text-base font-bold text-gray-900"
                  style={{ fontFamily: "Clash Display" }}
                >
                  {businessName || "Your Store"}
                </span>
                <div className="flex items-center gap-1">
                  <CheckCircle size={10} className="text-blue-500" />
                  <span className="text-[10px] text-gray-500">Verified</span>
                </div>
              </div>
            </div>

            {/* Tab Pills */}
            <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-full">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                    activeTab === tab.id
                      ? "text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  style={
                    activeTab === tab.id
                      ? { backgroundColor: primaryColor }
                      : {}
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-14">
        {activeTab === "home" && (
          <HomeTab
            businessName={businessName}
            storeTagline={storeTagline}
            bio={bio}
            theme={theme}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            logoUrl={logoUrl}
            bannerImageUrl={bannerImageUrl}
            isDarkTheme={isDarkTheme}
            hasBanner={hasBanner}
            getGradient={getGradient}
          />
        )}

        {activeTab === "products" && (
          <ProductsTab theme={theme} primaryColor={primaryColor} />
        )}

        {activeTab === "about" && (
          <AboutTab
            bio={bio}
            businessName={businessName}
            logoUrl={logoUrl}
            theme={theme}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}

        {activeTab === "contact" && (
          <ContactTab
            theme={theme}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              }}
            >
              {businessName?.[0]?.toUpperCase() || "S"}
            </div>
            <div>
              <p className="font-bold text-sm">
                {businessName || "Your Store"}
              </p>
              <p className="text-gray-400 text-xs">Verified on TradeLynk</p>
            </div>
          </div>
          <p className="text-gray-400 text-xs">
            © 2026 {businessName || "Your Store"}. Powered by TradeLynk 🚀
          </p>
        </div>
      </footer>
    </div>
  );
}

// Home Tab - Modern with glassmorphism
function HomeTab({
  businessName,
  storeTagline,
  bio,
  theme,
  primaryColor,
  secondaryColor,
  logoUrl,
  bannerImageUrl,
  isDarkTheme,
  hasBanner,
  getGradient,
}: any) {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        {/* Background */}
        {hasBanner ? (
          <div className="absolute inset-0 z-0">
            <Image
              src={bannerImageUrl}
              alt="Banner"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
          </div>
        ) : (
          <div
            className="absolute inset-0 z-0"
            style={{ background: getGradient() }}
          >
            {/* Decorative elements */}
            <div
              className="absolute top-10 left-10 w-40 h-40 rounded-full blur-3xl opacity-60"
              style={{ background: `${primaryColor}30` }}
            />
            <div
              className="absolute bottom-10 right-10 w-60 h-60 rounded-full blur-3xl opacity-40"
              style={{ background: `${secondaryColor}20` }}
            />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
          {/* Logo */}
          <div className="mb-6">
            {logoUrl ? (
              <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                <Image
                  src={logoUrl}
                  alt="Logo"
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div
                className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                {businessName?.[0]?.toUpperCase() || "S"}
              </div>
            )}
          </div>

          {/* Store Name */}
          <h1
            className={`text-4xl md:text-5xl font-bold mb-3 ${
              hasBanner || isDarkTheme ? "text-white" : "text-gray-900"
            }`}
            style={{ fontFamily: "Clash Display" }}
          >
            {businessName || "Your Store Name"}
          </h1>

          {/* Tagline */}
          <p
            className={`text-lg mb-6 px-4 py-2 rounded-full inline-block ${
              hasBanner || isDarkTheme
                ? "bg-white/10 backdrop-blur-sm text-white/90"
                : "bg-white/60 text-gray-700"
            }`}
          >
            {storeTagline || "✨ Your amazing tagline goes here"}
          </p>

          {/* CTA */}
          <div className="flex items-center justify-center gap-3">
            <button
              className="flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-xl transition-all"
              style={{
                background: hasBanner || isDarkTheme ? "white" : primaryColor,
                color: hasBanner || isDarkTheme ? primaryColor : "white",
              }}
            >
              <MessageCircle size={18} />
              <span>Chat on WhatsApp</span>
            </button>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-4 gap-3 max-w-lg mx-auto">
            {[
              { icon: Package, value: "0", label: "Products" },
              { icon: Heart, value: "0", label: "Likes" },
              { icon: TrendingUp, value: "0", label: "Sales" },
              { icon: Star, value: "5.0", label: "Rating" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-3 text-center ${
                  hasBanner || isDarkTheme
                    ? "bg-white/10 backdrop-blur-sm"
                    : "bg-white/80 border border-gray-200/50"
                }`}
              >
                <stat.icon
                  size={16}
                  className={`mx-auto mb-1 ${
                    hasBanner || isDarkTheme ? "text-white/70" : "text-gray-500"
                  }`}
                />
                <div
                  className={`text-lg font-bold ${
                    hasBanner || isDarkTheme ? "text-white" : "text-gray-900"
                  }`}
                >
                  {stat.value}
                </div>
                <div
                  className={`text-[10px] ${
                    hasBanner || isDarkTheme ? "text-white/60" : "text-gray-500"
                  }`}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: "Clash Display" }}
              >
                Featured Products
              </h2>
              <p className="text-sm text-gray-500">
                Handpicked items just for you
              </p>
            </div>
            <button
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: primaryColor }}
            >
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all"
              >
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 relative">
                  <div className="absolute top-2 right-2 bg-white/90 px-2 py-0.5 rounded-md shadow-sm">
                    <span
                      className="text-xs font-bold"
                      style={{ color: primaryColor }}
                    >
                      ₦0
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/60 px-1.5 py-0.5 rounded">
                    <span className="text-white text-[10px]">New</span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="h-3 bg-gray-200 rounded mb-1.5" />
                  <div className="h-2 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview */}
      {bio && (
        <section className="py-12 px-6 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-3xl mx-auto">
            <div
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}08, ${secondaryColor}05)`,
              }}
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl"
                style={{ background: `${primaryColor}10` }}
              />
              <div className="relative">
                <Sparkles
                  size={24}
                  className="mb-3"
                  style={{ color: primaryColor }}
                />
                <h3
                  className="text-xl font-bold mb-2 text-gray-900"
                  style={{ fontFamily: "Clash Display" }}
                >
                  About {businessName || "Us"}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {bio || "Tell your story here..."}
                </p>
                <button
                  className="mt-3 text-sm font-medium flex items-center gap-1"
                  style={{ color: primaryColor }}
                >
                  Read More <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// Products Tab
function ProductsTab({ theme, primaryColor }: any) {
  return (
    <div className="py-12 px-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "Clash Display" }}
          >
            All Products
          </h2>
          <p className="text-sm text-gray-500">0 items available</p>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
            >
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50" />
              <div className="p-3">
                <div className="h-3 bg-gray-200 rounded mb-1.5" />
                <div className="h-2 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// About Tab
function AboutTab({
  bio,
  businessName,
  logoUrl,
  theme,
  primaryColor,
  secondaryColor,
}: any) {
  return (
    <div className="py-12 px-6 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-xl overflow-hidden shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            }}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Logo"
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                {businessName?.[0]?.toUpperCase() || "S"}
              </div>
            )}
          </div>
          <h2
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "Clash Display" }}
          >
            About {businessName || "Us"}
          </h2>
          <div className="flex items-center justify-center gap-1 mt-2">
            <CheckCircle size={14} className="text-blue-500" />
            <span className="text-xs text-gray-500">Verified Seller</span>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
          <h3 className="text-lg font-bold mb-3 text-gray-900">Our Story</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {bio || "This seller hasn't added a bio yet. Check back soon!"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Package, value: "0", label: "Products" },
            { icon: Heart, value: "0", label: "Likes" },
            { icon: TrendingUp, value: "0", label: "Sales" },
            { icon: Star, value: "2026", label: "Joined" },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100"
            >
              <stat.icon
                size={18}
                className="mx-auto mb-1"
                style={{ color: primaryColor }}
              />
              <div className="text-lg font-bold text-gray-900">
                {stat.value}
              </div>
              <div className="text-[10px] text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Contact Tab
function ContactTab({ theme, primaryColor, secondaryColor }: any) {
  return (
    <div className="py-12 px-6 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "Clash Display" }}
          >
            Get In Touch
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            We'd love to hear from you
          </p>
        </div>

        <div className="grid grid-cols-5 gap-6">
          {/* Form */}
          <div className="col-span-3 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              Send a Message
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
              <input
                type="email"
                placeholder="Your Email"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
              <textarea
                placeholder="Your Message"
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none"
              />
              <button
                className="w-full py-2.5 rounded-lg font-bold text-white text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                <MessageCircle size={16} />
                Send via WhatsApp
              </button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="col-span-2 space-y-4">
            {/* Quick Connect */}
            <div
              className="rounded-2xl p-5 text-white"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              }}
            >
              <h3 className="font-bold mb-2">Quick Connect</h3>
              <p className="text-sm opacity-90 mb-4">Get instant responses</p>
              <button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 font-bold rounded-lg text-sm">
                <MessageCircle size={14} />
                Chat Now
              </button>
            </div>

            {/* Details */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold mb-3 text-gray-900 text-sm">
                Contact Details
              </h3>
              <div className="space-y-3">
                {[
                  { icon: Phone, label: "Phone", value: "+234 XXX XXX XXXX" },
                  { icon: Mail, label: "Email", value: "hello@store.com" },
                  { icon: MapPin, label: "Location", value: "Lagos, Nigeria" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <item.icon size={14} style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">{item.label}</p>
                      <p className="text-xs font-medium text-gray-900">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
