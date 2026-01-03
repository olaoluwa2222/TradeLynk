"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { sellersApi, itemsApi } from "@/lib/api";
import { StorefrontData } from "@/types/seller";
import Link from "next/link";

export default function SellerStorefrontPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [storefront, setStorefront] = useState<StorefrontData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [activeSection, setActiveSection] = useState("home");

  // Refs for scroll navigation
  const homeRef = useRef<HTMLElement>(null);
  const productsRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const fetchStorefront = async () => {
      try {
        setIsLoading(true);
        const response = await sellersApi.getStorefront(username);

        if (response.success && response.data) {
          setStorefront(response.data);
        } else {
          setError("Storefront not found");
        }
      } catch (err: any) {
        console.error("Error fetching storefront:", err);
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

  // Scroll to section
  const scrollToSection = (section: "home" | "products" | "contact") => {
    setActiveSection(section);

    const refs = {
      home: homeRef,
      products: productsRef,
      contact: contactRef,
    };

    refs[section].current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Intersection Observer for active section
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "-50% 0px -50% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, options);

    if (homeRef.current) observer.observe(homeRef.current);
    if (productsRef.current) observer.observe(productsRef.current);
    if (contactRef.current) observer.observe(contactRef.current);

    return () => observer.disconnect();
  }, [storefront]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
          <p
            className="text-gray-600"
            style={{ fontFamily: "Clash Display", fontWeight: 500 }}
          >
            Loading storefront...
          </p>
        </div>
      </div>
    );
  }

  if (error || !storefront) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h1
            className="text-3xl font-bold text-black mb-3"
            style={{ fontFamily: "Clash Display", fontWeight: 700 }}
          >
            Storefront Not Found
          </h1>
          <p
            className="text-gray-600 mb-6"
            style={{ fontFamily: "Clash Display", fontWeight: 400 }}
          >
            {error ||
              "This seller doesn't exist or hasn't set up their storefront yet."}
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition-colors"
            style={{ fontFamily: "Clash Display", fontWeight: 600 }}
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Banner */}
      <section className="relative">
        {/* Banner Image */}
        <div
          className="w-full h-[400px] bg-gradient-to-r from-gray-800 to-gray-900 relative overflow-hidden"
          style={{
            backgroundImage: storefront.bannerImageUrl
              ? `url(${storefront.bannerImageUrl})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {!storefront.bannerImageUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/20 text-9xl">🏪</div>
            </div>
          )}
        </div>

        {/* Store Logo & Info Overlay */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-20 mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Logo */}
                <div className="flex-shrink-0">
                  {storefront.logoUrl ? (
                    <img
                      src={storefront.logoUrl}
                      alt={storefront.businessName || storefront.name}
                      className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white text-4xl font-bold">
                      {storefront.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Store Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1
                      className="text-3xl md:text-4xl font-bold text-black"
                      style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                    >
                      {storefront.businessName || storefront.name}
                    </h1>
                    {storefront.isVerified && (
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  {storefront.storeTagline && (
                    <p
                      className="text-lg text-gray-600 mb-3"
                      style={{ fontFamily: "Clash Display", fontWeight: 500 }}
                    >
                      {storefront.storeTagline}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Member since{" "}
                      {new Date(storefront.memberSince).getFullYear()}
                    </span>
                    <span>@{username}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Navigation */}
      <nav className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center gap-8 py-4">
            {[
              { id: "home", label: "Home", icon: "🏠" },
              { id: "products", label: "Products", icon: "📦" },
              { id: "contact", label: "Contact", icon: "📞" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeSection === item.id
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Home/About Section */}
        <section id="home" ref={homeRef} className="mb-16 scroll-mt-20">
          <h2
            className="text-3xl font-bold text-black mb-6"
            style={{ fontFamily: "Clash Display", fontWeight: 700 }}
          >
            About This Store
          </h2>

          {/* Bio */}
          {storefront.bio && (
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <p
                className="text-gray-700 leading-relaxed whitespace-pre-line"
                style={{ fontFamily: "Clash Display", fontWeight: 400 }}
              >
                {storefront.bio}
              </p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
              <div
                className="text-4xl font-bold text-black mb-2"
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                {storefront.totalItems}
              </div>
              <div
                className="text-gray-600 text-sm"
                style={{ fontFamily: "Clash Display", fontWeight: 500 }}
              >
                Items Listed
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
              <div
                className="text-4xl font-bold text-black mb-2"
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                {storefront.totalLikes}
              </div>
              <div
                className="text-gray-600 text-sm"
                style={{ fontFamily: "Clash Display", fontWeight: 500 }}
              >
                Total Likes
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
              <div
                className="text-4xl font-bold text-black mb-2"
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                {storefront.totalSales}
              </div>
              <div
                className="text-gray-600 text-sm"
                style={{ fontFamily: "Clash Display", fontWeight: 500 }}
              >
                Total Sales
              </div>
            </div>
          </div>

          {/* Social Links */}
          {(storefront.instagramHandle || storefront.twitterHandle) && (
            <div className="flex gap-4 justify-center">
              {storefront.instagramHandle && (
                <a
                  href={`https://instagram.com/${storefront.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                  style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  Instagram
                </a>
              )}

              {storefront.twitterHandle && (
                <a
                  href={`https://twitter.com/${storefront.twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                  style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                  Twitter
                </a>
              )}
            </div>
          )}
        </section>

        {/* Products Section */}
        <section id="products" ref={productsRef} className="mb-16 scroll-mt-20">
          <h2
            className="text-3xl font-bold text-black mb-6"
            style={{ fontFamily: "Clash Display", fontWeight: 700 }}
          >
            Products
          </h2>

          {storefront.items && storefront.items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {storefront.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all group"
                >
                  {/* Item Image */}
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">
                        📦
                      </div>
                    )}
                  </div>

                  {/* Item Info */}
                  <div className="p-4">
                    <h3
                      className="font-semibold text-black mb-2 line-clamp-2"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-2xl font-bold text-black"
                        style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                      >
                        ₦{item.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        ❤️ {item.likeCount}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <div className="text-6xl mb-4">📭</div>
              <p
                className="text-gray-600 text-lg"
                style={{ fontFamily: "Clash Display", fontWeight: 500 }}
              >
                No items listed yet
              </p>
            </div>
          )}
        </section>

        {/* Contact Section */}
        <section id="contact" ref={contactRef} className="mb-16 scroll-mt-20">
          <h2
            className="text-3xl font-bold text-black mb-6"
            style={{ fontFamily: "Clash Display", fontWeight: 700 }}
          >
            Contact Seller
          </h2>

          <div className="bg-gray-50 rounded-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl">
                  📧
                </div>
                <div>
                  <div
                    className="font-semibold text-black mb-1"
                    style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                  >
                    Email
                  </div>
                  <a
                    href={`mailto:${storefront.email}`}
                    className="text-blue-600 hover:underline"
                    style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                  >
                    {storefront.email}
                  </a>
                </div>
              </div>

              {/* Phone Number */}
              {storefront.phoneNumber && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl">
                    📱
                  </div>
                  <div>
                    <div
                      className="font-semibold text-black mb-1"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      Phone
                    </div>
                    <a
                      href={`tel:${storefront.phoneNumber}`}
                      className="text-blue-600 hover:underline"
                      style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                    >
                      {storefront.phoneNumber}
                    </a>
                  </div>
                </div>
              )}

              {/* WhatsApp */}
              {storefront.whatsappNumber && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-xl">
                    💬
                  </div>
                  <div>
                    <div
                      className="font-semibold text-black mb-1"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      WhatsApp
                    </div>
                    <a
                      href={`https://wa.me/${storefront.whatsappNumber.replace(
                        /^0/,
                        "234"
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      Message on WhatsApp
                    </a>
                  </div>
                </div>
              )}

              {/* Campus Address */}
              {storefront.address && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl">
                    📍
                  </div>
                  <div>
                    <div
                      className="font-semibold text-black mb-1"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      Campus Location
                    </div>
                    <p
                      className="text-gray-700"
                      style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                    >
                      {storefront.address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
