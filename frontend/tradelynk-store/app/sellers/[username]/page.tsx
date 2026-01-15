"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { sellersApi, itemsApi } from "@/lib/api";
import { StorefrontData } from "@/types/seller";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  ShoppingBag,
  Heart,
  Eye,
  Calendar,
  MapPin,
  Phone,
  MessageCircle,
  Instagram,
  Twitter,
  Facebook,
  Mail,
  ExternalLink,
  CheckCircle,
  Star,
  ArrowRight,
  Sparkles,
  Package,
  Users,
  TrendingUp,
  ChevronRight,
  Grid3X3,
  LayoutGrid,
  Plus,
} from "lucide-react";
import FeedbackButton from "@/components/FeedbackButton";

export default function SellerStorefrontPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { user } = useAuth();

  const [storefront, setStorefront] = useState<StorefrontData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState("home");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [scrollY, setScrollY] = useState(0);

  // Check if current user is the store owner
  const isOwner =
    user && storefront ? user.userId === storefront.userId : false;

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchStorefront = async () => {
      try {
        setIsLoading(true);
        const response = await sellersApi.getStorefront(username);

        if (response.success && response.data) {
          const storefrontData = response.data;

          try {
            const itemsResponse = await itemsApi.getItemsBySeller(
              storefrontData.userId
            );

            if (itemsResponse.success && itemsResponse.data) {
              const transformedItems = itemsResponse.data.map((item: any) => ({
                ...item,
                imageUrl:
                  item.imageUrls && item.imageUrls.length > 0
                    ? item.imageUrls[0]
                    : undefined,
              }));
              storefrontData.items = transformedItems;
            }
          } catch (itemsErr) {
            storefrontData.items = [];
          }

          setStorefront(storefrontData);
        } else {
          setError("Storefront not found");
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError("Seller not found");
        } else {
          setError("Failed to load storefront");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      fetchStorefront();
    }
  }, [username]);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document
      .querySelectorAll(".fade-in-section")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeTab, storefront]);

  if (isLoading) return <LoadingState />;
  if (error || !storefront) return <ErrorState error={error} />;

  const theme = storefront.theme || "modern-clean";
  const primaryColor = storefront.primaryColor || "#000000";
  const secondaryColor = storefront.secondaryColor || "#6366F1";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        storefront={storefront}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        primaryColor={primaryColor}
        scrollY={scrollY}
        isOwner={isOwner}
      />

      <main>
        {activeTab === "home" && (
          <HomeTab
            storefront={storefront}
            theme={theme}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            scrollY={scrollY}
          />
        )}
        {activeTab === "products" && (
          <ProductsTab
            storefront={storefront}
            theme={theme}
            primaryColor={primaryColor}
            isOwner={isOwner}
          />
        )}
        {activeTab === "about" && (
          <AboutTab
            storefront={storefront}
            theme={theme}
            primaryColor={primaryColor}
          />
        )}
        {activeTab === "contact" && (
          <ContactTab
            storefront={storefront}
            theme={theme}
            primaryColor={primaryColor}
            contactForm={contactForm}
            setContactForm={setContactForm}
          />
        )}
      </main>

      <Footer
        storefront={storefront}
        primaryColor={primaryColor}
        theme={theme}
      />

      {/* Feedback Button - Visible to store owner */}
      {isOwner && <FeedbackButton username={username} />}
    </div>
  );
}

// ============================================
// NAVIGATION - Modern with scroll effects
// ============================================
function Navigation({
  storefront,
  activeTab,
  setActiveTab,
  theme,
  primaryColor,
  scrollY,
  isOwner,
}: any) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isScrolled = scrollY > 50;

  const getNavBg = () => {
    if (isScrolled) {
      return theme === "product-showcase"
        ? "bg-gray-900/95 backdrop-blur-xl"
        : "bg-white/95 backdrop-blur-xl shadow-lg";
    }
    return theme === "product-showcase"
      ? "bg-gray-900/80 backdrop-blur-md"
      : "bg-white/90 backdrop-blur-md shadow-sm";
  };

  const getTextColor = () => {
    return theme === "product-showcase" ? "text-white" : "text-gray-900";
  };

  const tabs = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "products", label: "Products", icon: "🛍️" },
    { id: "about", label: "About", icon: "ℹ️" },
    { id: "contact", label: "Contact", icon: "📧" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${getNavBg()}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`flex items-center justify-between transition-all duration-300 ${
              isScrolled ? "h-14" : "h-16"
            }`}
          >
            {/* Logo & Store Name */}
            <div className="flex items-center gap-3 animate-fade-in-up">
              {storefront.logoUrl ? (
                <div
                  className={`rounded-full overflow-hidden border-2 shadow-sm transition-all duration-300 ${
                    isScrolled ? "w-8 h-8" : "w-10 h-10"
                  }`}
                  style={{ borderColor: primaryColor }}
                >
                  <Image
                    src={storefront.logoUrl}
                    alt="Logo"
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div
                  className={`rounded-xl flex items-center justify-center text-white font-bold shadow-lg transition-all duration-300 ${
                    isScrolled ? "w-8 h-8 text-sm" : "w-10 h-10 text-base"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${
                      storefront.secondaryColor || "#6366F1"
                    })`,
                  }}
                >
                  {storefront.businessName?.[0]?.toUpperCase() || "S"}
                </div>
              )}
              {/* Show store name on mobile too */}
              <div>
                <h1
                  className={`font-bold transition-all duration-300 ${
                    isScrolled ? "text-sm sm:text-base" : "text-base sm:text-lg"
                  } ${getTextColor()}`}
                  style={{ fontFamily: "Clash Display" }}
                >
                  {storefront.businessName || storefront.name}
                </h1>
                {storefront.isVerified && (
                  <div className="flex items-center gap-1">
                    <CheckCircle size={10} className="text-blue-500" />
                    <span
                      className={`text-xs ${
                        theme === "product-showcase"
                          ? "text-gray-300"
                          : "text-gray-500"
                      }`}
                    >
                      Verified
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Tabs + Settings */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-1 bg-gray-100/80 backdrop-blur-sm p-1 rounded-full">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    data-tab={tab.id}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                      activeTab === tab.id
                        ? "text-white shadow-lg"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
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

              {/* Edit Button for Owner */}
              {isOwner && (
                <Link
                  href={`/sellers/${storefront.username}/settings`}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-black text-white hover:bg-gray-800 transition-all"
                >
                  <span>⚙️</span>
                  <span>Edit</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-all ${
                theme === "product-showcase"
                  ? "bg-white/10 hover:bg-white/20"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              aria-label="Toggle menu"
            >
              <div className="w-5 h-5 flex flex-col justify-center items-center gap-1">
                <span
                  className={`block w-5 h-0.5 transition-all duration-300 ${
                    theme === "product-showcase" ? "bg-white" : "bg-gray-700"
                  } ${mobileMenuOpen ? "rotate-45 translate-y-1.5" : ""}`}
                />
                <span
                  className={`block w-5 h-0.5 transition-all duration-300 ${
                    theme === "product-showcase" ? "bg-white" : "bg-gray-700"
                  } ${mobileMenuOpen ? "opacity-0" : ""}`}
                />
                <span
                  className={`block w-5 h-0.5 transition-all duration-300 ${
                    theme === "product-showcase" ? "bg-white" : "bg-gray-700"
                  } ${mobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`md:hidden fixed inset-x-0 top-14 transition-all duration-300 overflow-hidden ${
            mobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          } ${
            theme === "product-showcase"
              ? "bg-gray-900/98"
              : "bg-white/98 border-t border-gray-200"
          } backdrop-blur-xl shadow-2xl`}
        >
          <div className="px-4 py-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left font-medium transition-all ${
                  activeTab === tab.id
                    ? "text-white shadow-lg"
                    : theme === "product-showcase"
                    ? "text-gray-300 hover:bg-white/10"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                style={
                  activeTab === tab.id ? { backgroundColor: primaryColor } : {}
                }
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="text-base">{tab.label}</span>
              </button>
            ))}

            {/* Divider */}
            <div
              className={`my-3 border-t ${
                theme === "product-showcase"
                  ? "border-gray-700"
                  : "border-gray-200"
              }`}
            />

            {/* Settings - Only for store owner */}
            {isOwner && (
              <Link
                href={`/sellers/${storefront.username}/settings`}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left font-medium transition-all ${
                  theme === "product-showcase"
                    ? "text-gray-300 hover:bg-white/10"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="text-xl">⚙️</span>
                <span className="text-base">Edit My Website</span>
              </Link>
            )}

            {/* Back to TradeLynk */}
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left font-medium transition-all ${
                theme === "product-showcase"
                  ? "text-gray-400 hover:bg-white/10"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <span className="text-xl">🏪</span>
              <span className="text-base">Back to TradeLynk</span>
            </Link>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[-1]"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </nav>
    </>
  );
}

// ============================================
// HOME TAB - Hero with glassmorphism fallback
// ============================================
function HomeTab({
  storefront,
  theme,
  primaryColor,
  secondaryColor,
  scrollY,
}: any) {
  const hasBanner = !!storefront.bannerImageUrl;
  const featuredItems = storefront.items?.slice(0, 4) || [];

  // Dynamic gradient based on theme
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

  const isDarkTheme = [
    "bold-vibrant",
    "minimalist-luxury",
    "campus-friendly",
    "product-showcase",
  ].includes(theme);

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        {/* Background Layer */}
        {hasBanner ? (
          <>
            <div
              className="absolute inset-0 z-0"
              style={{ transform: `translateY(${scrollY * 0.3}px)` }}
            >
              <Image
                src={storefront.bannerImageUrl}
                alt="Banner"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
            </div>
          </>
        ) : (
          <div
            className="absolute inset-0 z-0"
            style={{ background: getGradient() }}
          >
            {/* Decorative elements for non-banner */}
            <div className="absolute inset-0 grid-pattern opacity-30" />
            <div
              className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-float"
              style={{ background: `${primaryColor}20` }}
            />
            <div
              className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-float delay-200"
              style={{ background: `${secondaryColor}15` }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl"
              style={{
                background: `radial-gradient(circle, ${primaryColor}10 0%, transparent 70%)`,
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {/* Store Logo */}
          <div
            className="mb-8 inline-block animate-fade-in-up"
            style={{ transform: `translateY(${scrollY * -0.1}px)` }}
          >
            {storefront.logoUrl ? (
              <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 glass">
                <Image
                  src={storefront.logoUrl}
                  alt="Logo"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div
                className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                {storefront.businessName?.[0]?.toUpperCase() || "S"}
              </div>
            )}
          </div>

          {/* Store Name */}
          <h1
            className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 animate-fade-in-up ${
              hasBanner || isDarkTheme ? "text-white" : "text-gray-900"
            }`}
            style={{
              fontFamily: "Clash Display",
              transform: `translateY(${scrollY * -0.15}px)`,
              animationDelay: "0.1s",
            }}
          >
            {storefront.businessName || storefront.name}
          </h1>

          {/* Tagline with glass effect */}
          <div
            className="animate-fade-in-up inline-block"
            style={{
              animationDelay: "0.2s",
              transform: `translateY(${scrollY * -0.1}px)`,
            }}
          >
            <p
              className={`text-lg sm:text-xl md:text-2xl mb-8 px-6 py-3 rounded-full inline-block ${
                hasBanner || isDarkTheme
                  ? "glass text-white/90"
                  : "bg-white/60 backdrop-blur-sm text-gray-700"
              }`}
            >
              {storefront.storeTagline || "✨ Welcome to my store"}
            </p>
          </div>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            {storefront.whatsappNumber && (
              <a
                href={`https://wa.me/${storefront.whatsappNumber.replace(
                  /^0/,
                  "234"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 px-8 py-4 rounded-full font-bold shadow-xl hover:shadow-2xl transition-all hover-lift btn-modern"
                style={{
                  background: hasBanner || isDarkTheme ? "white" : primaryColor,
                  color: hasBanner || isDarkTheme ? primaryColor : "white",
                }}
              >
                <MessageCircle size={20} />
                <span>Chat on WhatsApp</span>
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </a>
            )}
            <button
              onClick={() =>
                document
                  .getElementById("featured-products")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className={`flex items-center gap-2 px-6 py-4 rounded-full font-medium transition-all ${
                hasBanner || isDarkTheme
                  ? "text-white border-2 border-white/30 hover:bg-white/10"
                  : "text-gray-700 border-2 border-gray-300 hover:bg-gray-100"
              }`}
            >
              <ShoppingBag size={18} />
              <span>Browse Products</span>
            </button>
          </div>

          {/* Quick Stats - Floating Cards */}
          <div
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            {[
              {
                icon: Package,
                value: storefront.totalItems || 0,
                label: "Products",
              },
              {
                icon: Heart,
                value: storefront.totalLikes || 0,
                label: "Likes",
              },
              {
                icon: TrendingUp,
                value: storefront.totalSales || 0,
                label: "Sales",
              },
              { icon: Star, value: "5.0", label: "Rating" },
            ].map((stat, idx) => (
              <div
                key={stat.label}
                className={`${
                  hasBanner || isDarkTheme
                    ? "glass"
                    : "bg-white/80 backdrop-blur-sm border border-gray-200/50"
                } rounded-2xl p-4 text-center hover-lift`}
                style={{ animationDelay: `${0.4 + idx * 0.1}s` }}
              >
                <stat.icon
                  size={20}
                  className={`mx-auto mb-2 ${
                    hasBanner || isDarkTheme ? "text-white/70" : "text-gray-500"
                  }`}
                />
                <div
                  className={`text-2xl font-bold ${
                    hasBanner || isDarkTheme ? "text-white" : "text-gray-900"
                  }`}
                  style={{ fontFamily: "Clash Display" }}
                >
                  {stat.value}
                </div>
                <div
                  className={`text-xs ${
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

      {/* Featured Products Section */}
      {featuredItems.length > 0 && (
        <section
          id="featured-products"
          className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10 fade-in-section">
              <div>
                <h2
                  className="text-3xl md:text-4xl font-bold text-gray-900"
                  style={{ fontFamily: "Clash Display" }}
                >
                  Featured Products
                </h2>
                <p className="text-gray-500 mt-2">
                  Handpicked items just for you
                </p>
              </div>
              <button
                onClick={() => {
                  const el = document.querySelector(
                    '[data-tab="products"]'
                  ) as HTMLElement;
                  el?.click();
                }}
                className="hidden sm:flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all"
                style={{ color: primaryColor }}
              >
                View All <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredItems.map((item: any, idx: number) => (
                <div
                  key={item.id}
                  className="fade-in-section"
                  style={{ transitionDelay: `${idx * 0.1}s` }}
                >
                  <ProductCard
                    item={item}
                    theme={theme}
                    primaryColor={primaryColor}
                    compact
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Preview Section */}
      {storefront.bio && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-4xl mx-auto">
            <div
              className="fade-in-section relative overflow-hidden rounded-3xl p-8 md:p-12"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}08, ${secondaryColor}05)`,
              }}
            >
              <div
                className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl"
                style={{ background: `${primaryColor}10` }}
              />
              <div className="relative">
                <Sparkles
                  size={32}
                  className="mb-4"
                  style={{ color: primaryColor }}
                />
                <h3
                  className="text-2xl md:text-3xl font-bold mb-4 text-gray-900"
                  style={{ fontFamily: "Clash Display" }}
                >
                  About {storefront.businessName || storefront.name}
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg line-clamp-3">
                  {storefront.bio}
                </p>
                <button
                  onClick={() => {
                    const el = document.querySelector(
                      '[data-tab="about"]'
                    ) as HTMLElement;
                    el?.click();
                  }}
                  className="mt-6 inline-flex items-center gap-2 font-medium hover:gap-3 transition-all"
                  style={{ color: primaryColor }}
                >
                  Read More <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ============================================
// PRODUCTS TAB - Modern grid with filters
// ============================================
function ProductsTab({ storefront, theme, primaryColor, isOwner }: any) {
  const items = storefront.items || [];
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");

  return (
    <div className="pt-20 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 fade-in-section">
          <div>
            <h2
              className="text-3xl md:text-4xl font-bold text-gray-900"
              style={{ fontFamily: "Clash Display" }}
            >
              All Products
            </h2>
            <p className="text-gray-500 mt-1">{items.length} items available</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Owner: Create Item Button */}
            {isOwner && (
              <Link
                href="/create-item"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                }}
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Add Product</span>
                <span className="sm:hidden">Add</span>
              </Link>
            )}

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
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 fade-in-section">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">No products listed yet</p>
            <p className="text-gray-400 text-sm mt-2">
              {isOwner
                ? "Start adding products to your store!"
                : "Check back soon!"}
            </p>
            {isOwner && (
              <Link
                href="/create-item"
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                }}
              >
                <Plus size={20} />
                Create Your First Product
              </Link>
            )}
          </div>
        ) : (
          <div
            className={`grid gap-4 md:gap-6 ${
              viewMode === "compact"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            }`}
          >
            {items.map((item: any, idx: number) => (
              <div
                key={item.id}
                className="fade-in-section"
                style={{ transitionDelay: `${Math.min(idx * 0.05, 0.3)}s` }}
              >
                <ProductCard
                  item={item}
                  theme={theme}
                  primaryColor={primaryColor}
                  compact={viewMode === "compact"}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// ABOUT TAB - Modern layout
// ============================================
function AboutTab({ storefront, theme, primaryColor }: any) {
  return (
    <div className="pt-20 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 fade-in-section">
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden shadow-xl"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${
                storefront.secondaryColor || "#6366F1"
              })`,
            }}
          >
            {storefront.logoUrl ? (
              <Image
                src={storefront.logoUrl}
                alt="Logo"
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                {storefront.businessName?.[0]?.toUpperCase() || "S"}
              </div>
            )}
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold text-gray-900"
            style={{ fontFamily: "Clash Display" }}
          >
            About {storefront.businessName || storefront.name}
          </h2>
          {storefront.isVerified && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <CheckCircle size={18} className="text-blue-500" />
              <span className="text-gray-500">Verified Seller</span>
            </div>
          )}
        </div>

        {/* Bio Card */}
        <div
          className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-100 mb-8 fade-in-section"
          style={{ transitionDelay: "0.1s" }}
        >
          <h3
            className="text-xl font-bold mb-4 text-gray-900"
            style={{ fontFamily: "Clash Display" }}
          >
            Our Story
          </h3>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-lg">
            {storefront.bio || "This seller hasn't added a bio yet."}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: Package,
              value: storefront.totalItems || 0,
              label: "Products",
            },
            { icon: Heart, value: storefront.totalLikes || 0, label: "Likes" },
            { icon: Users, value: storefront.totalSales || 0, label: "Sales" },
            {
              icon: Calendar,
              value: new Date(storefront.memberSince).getFullYear(),
              label: "Joined",
            },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-5 text-center shadow-lg border border-gray-100 hover-lift fade-in-section"
              style={{ transitionDelay: `${0.2 + idx * 0.1}s` }}
            >
              <stat.icon
                size={24}
                className="mx-auto mb-2"
                style={{ color: primaryColor }}
              />
              <div
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: "Clash Display" }}
              >
                {stat.value}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Location & Info */}
        {storefront.address && (
          <div
            className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 mb-8 fade-in-section"
            style={{ transitionDelay: "0.4s" }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <MapPin size={24} style={{ color: primaryColor }} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Location</h4>
                <p className="text-gray-600">{storefront.address}</p>
              </div>
            </div>
          </div>
        )}

        {/* Social Links */}
        {(storefront.instagramHandle ||
          storefront.twitterHandle ||
          storefront.facebookHandle) && (
          <div
            className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 fade-in-section"
            style={{ transitionDelay: "0.5s" }}
          >
            <h3
              className="text-xl font-bold mb-6 text-gray-900"
              style={{ fontFamily: "Clash Display" }}
            >
              Follow Us
            </h3>
            <div className="flex flex-wrap gap-3">
              {storefront.instagramHandle && (
                <a
                  href={`https://instagram.com/${storefront.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white font-medium hover-lift"
                >
                  <Instagram size={20} />
                  <span>Instagram</span>
                </a>
              )}
              {storefront.twitterHandle && (
                <a
                  href={`https://twitter.com/${storefront.twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-black text-white font-medium hover-lift"
                >
                  <Twitter size={20} />
                  <span>Twitter</span>
                </a>
              )}
              {storefront.facebookHandle && (
                <a
                  href={`https://facebook.com/${storefront.facebookHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-medium hover-lift"
                >
                  <Facebook size={20} />
                  <span>Facebook</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// CONTACT TAB - Modern split layout
// ============================================
function ContactTab({
  storefront,
  theme,
  primaryColor,
  contactForm,
  setContactForm,
}: any) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = `Hi, I'm ${contactForm.name} (${contactForm.email}). ${contactForm.message}`;
    const whatsappUrl = `https://wa.me/${storefront.whatsappNumber?.replace(
      /^0/,
      "234"
    )}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="pt-20 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 fade-in-section">
          <h2
            className="text-3xl md:text-4xl font-bold text-gray-900"
            style={{ fontFamily: "Clash Display" }}
          >
            Get In Touch
          </h2>
          <p className="text-gray-500 mt-2">We'd love to hear from you</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Contact Form */}
          <div
            className="lg:col-span-3 bg-white rounded-3xl p-8 shadow-xl border border-gray-100 fade-in-section"
            style={{ transitionDelay: "0.1s" }}
          >
            <h3
              className="text-xl font-bold mb-6 text-gray-900"
              style={{ fontFamily: "Clash Display" }}
            >
              Send a Message
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
                  style={{ "--tw-ring-color": primaryColor } as any}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Email
                </label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, email: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
                  style={{ "--tw-ring-color": primaryColor } as any}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, message: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all resize-none"
                  placeholder="Hi! I'm interested in..."
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full py-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all hover-lift btn-modern flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                <MessageCircle size={20} />
                Send via WhatsApp
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Quick Contact Card */}
            <div
              className="rounded-3xl p-8 text-white shadow-xl hover-lift fade-in-section"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${
                  storefront.secondaryColor || "#6366F1"
                })`,
                transitionDelay: "0.2s",
              }}
            >
              <h3
                className="text-xl font-bold mb-4"
                style={{ fontFamily: "Clash Display" }}
              >
                Quick Connect
              </h3>
              <p className="opacity-90 mb-6">
                Get instant responses via WhatsApp
              </p>
              {storefront.whatsappNumber && (
                <a
                  href={`https://wa.me/${storefront.whatsappNumber.replace(
                    /^0/,
                    "234"
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-bold rounded-xl hover:shadow-xl transition-all"
                >
                  <MessageCircle size={20} />
                  <span>Chat Now</span>
                  <ExternalLink size={16} />
                </a>
              )}
            </div>

            {/* Contact Details */}
            <div
              className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 fade-in-section"
              style={{ transitionDelay: "0.3s" }}
            >
              <h3 className="text-lg font-bold mb-4 text-gray-900">
                Contact Details
              </h3>
              <div className="space-y-4">
                {storefront.phoneNumber && (
                  <a
                    href={`tel:${storefront.phoneNumber}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <Phone size={18} style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">
                        {storefront.phoneNumber}
                      </p>
                    </div>
                  </a>
                )}
                {storefront.email && (
                  <a
                    href={`mailto:${storefront.email}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <Mail size={18} style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">
                        {storefront.email}
                      </p>
                    </div>
                  </a>
                )}
                {storefront.address && (
                  <div className="flex items-center gap-3 p-3 rounded-xl">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <MapPin size={18} style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="font-medium text-gray-900">
                        {storefront.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PRODUCT CARD - Modern compact design
// ============================================
function ProductCard({ item, theme, primaryColor, compact = false }: any) {
  return (
    <Link href={`/items/${item.id}`}>
      <div className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 hover-lift cursor-pointer">
        {/* Image Container */}
        <div
          className={`relative overflow-hidden bg-gray-100 ${
            compact ? "aspect-square" : "aspect-[4/3]"
          }`}
        >
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-cover product-image-zoom"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <ShoppingBag size={compact ? 24 : 32} className="text-gray-300" />
            </div>
          )}

          {/* Price Badge */}
          <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-lg">
            <span className="font-bold text-sm" style={{ color: primaryColor }}>
              ₦{item.price.toLocaleString()}
            </span>
          </div>

          {/* Condition Badge */}
          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md">
            <span className="text-white text-xs font-medium">
              {item.condition}
            </span>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
            <span className="text-white text-sm font-medium flex items-center gap-1">
              <Eye size={14} /> View Details
            </span>
          </div>
        </div>

        {/* Content */}
        <div className={`${compact ? "p-3" : "p-4"}`}>
          <h3
            className={`font-bold text-gray-900 line-clamp-1 ${
              compact ? "text-sm" : "text-base"
            }`}
            style={{ fontFamily: "Clash Display" }}
          >
            {item.title}
          </h3>
          {!compact && (
            <p className="text-xs text-gray-500 line-clamp-1 mt-1">
              {item.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-gray-400">
              <Heart size={12} />
              <span className="text-xs">{item.likeCount || 0}</span>
            </div>
            <ChevronRight
              size={14}
              className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================
// FOOTER - Modern minimal
// ============================================
function Footer({ storefront, primaryColor, theme }: any) {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            {storefront.logoUrl ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden">
                <Image
                  src={storefront.logoUrl}
                  alt="Logo"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${
                    storefront.secondaryColor || "#6366F1"
                  })`,
                }}
              >
                {storefront.businessName?.[0]?.toUpperCase() || "S"}
              </div>
            )}
            <div>
              <p className="font-bold" style={{ fontFamily: "Clash Display" }}>
                {storefront.businessName || storefront.name}
              </p>
              <p className="text-gray-400 text-xs">
                Verified Seller on TradeLynk
              </p>
            </div>
          </div>

          {/* Social */}
          <div className="flex items-center gap-3">
            {storefront.instagramHandle && (
              <a
                href={`https://instagram.com/${storefront.instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Instagram size={18} />
              </a>
            )}
            {storefront.twitterHandle && (
              <a
                href={`https://twitter.com/${storefront.twitterHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Twitter size={18} />
              </a>
            )}
            {storefront.facebookHandle && (
              <a
                href={`https://facebook.com/${storefront.facebookHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Facebook size={18} />
              </a>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>
            © {new Date().getFullYear()}{" "}
            {storefront.businessName || storefront.name}. All rights reserved.
          </p>
          <p className="flex items-center gap-2">
            Powered by <span className="text-white font-medium">TradeLynk</span>{" "}
            🚀
          </p>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// LOADING STATE - Modern skeleton
// ============================================
function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-black animate-spin"></div>
        </div>
        <p
          className="text-gray-600 font-medium"
          style={{ fontFamily: "Clash Display" }}
        >
          Loading storefront...
        </p>
        <p className="text-gray-400 text-sm mt-1">Just a moment</p>
      </div>
    </div>
  );
}

// ============================================
// ERROR STATE - Modern design
// ============================================
function ErrorState({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={40} className="text-gray-400" />
        </div>
        <h1
          className="text-5xl font-bold text-gray-900 mb-4"
          style={{ fontFamily: "Clash Display" }}
        >
          404
        </h1>
        <p className="text-xl text-gray-600 mb-2">Store Not Found</p>
        <p className="text-gray-400 mb-8">{error}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors hover-lift"
        >
          <ArrowRight size={18} className="rotate-180" />
          Go Back Home
        </Link>
      </div>
    </div>
  );
}
