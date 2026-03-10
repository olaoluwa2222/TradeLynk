// app/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const dashboardHref =
    user?.role === "SELLER" || user?.role === "BOTH" || user?.role === "ADMIN"
      ? "/dashboard/seller"
      : "/dashboard/buyer";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-triggered animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll(".fade-in-section").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  const faqs = [
    {
      q: "Is Tradelynk only for Instagram sellers?",
      a: "While Tradelynk is optimized for Instagram sellers, anyone selling products online - especially through social media and WhatsApp - can benefit from our storefront and AI sales assistant.",
    },
    {
      q: "How quickly can I set up my storefront?",
      a: "You can set up your Tradelynk storefront and activate your WhatsApp AI Sales Assistant in under 5 minutes. Our intuitive interface makes it easy to upload products, customize your store, and connect your WhatsApp number - no technical skills needed.",
    },
    {
      q: "Do I need to be tech-savvy to use Tradelynk?",
      a: "Not at all! If you can use Instagram and WhatsApp, you can use Tradelynk. Our platform is designed for ease of use with a simple, intuitive interface.",
    },
    {
      q: "How does the AI handle complex questions?",
      a: "Our AI is trained to understand and respond to a wide range of customer inquiries - from product details to payment options. For highly complex questions that require human intervention, the AI seamlessly hands over the conversation to you.",
    },
    {
      q: "Is my customer data safe?",
      a: "Absolutely. We prioritize security and privacy. Tradelynk employs robust security measures to protect all data, ensuring a safe and trustworthy selling environment.",
    },
    {
      q: "How much does Tradelynk cost?",
      a: "Tradelynk offers affordable plans starting from N5,000/month. Our pricing is designed to provide incredible value by saving you time and significantly increasing your sales.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ============================
          NAVIGATION
          ============================ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span
                className={`text-xl font-bold transition-colors duration-300 ${
                  scrolled ? "text-black" : "text-white"
                }`}
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                Tradelynk
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-300 hover:opacity-80 ${
                    scrolled ? "text-gray-700" : "text-white/80"
                  }`}
                  style={{ fontFamily: "Clash Display", fontWeight: 500 }}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href={dashboardHref}
                    className={`text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-300 ${
                      scrolled
                        ? "text-gray-700 hover:text-black"
                        : "text-white/80 hover:text-white"
                    }`}
                    style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="text-sm font-semibold px-6 py-2.5 rounded-lg bg-white text-black hover:bg-gray-100 transition-all duration-300"
                    style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-300 ${
                      scrolled
                        ? "text-gray-700 hover:text-black"
                        : "text-white/80 hover:text-white"
                    }`}
                    style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm font-semibold px-6 py-2.5 rounded-lg bg-white text-black hover:bg-gray-100 transition-all duration-300"
                    style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 ${scrolled ? "text-black" : "text-white"}`}
            >
              {mobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
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
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
                  style={{ fontFamily: "Clash Display", fontWeight: 500 }}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      href={dashboardHref}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center px-4 py-3 text-sm font-semibold text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="text-center px-4 py-3 text-sm font-semibold text-white rounded-lg bg-black hover:bg-gray-900"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-center px-4 py-3 text-sm font-semibold text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      className="text-center px-4 py-3 text-sm font-semibold text-white rounded-lg bg-black hover:bg-gray-900"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ============================
          HERO SECTION
          ============================ */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-black">
        {/* Background gradient effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]"></div>
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          ></div>
        </div>

        {/* Right side image panel (desktop only) */}
        <div className="absolute right-0 top-0 h-full w-2/5 hidden lg:block overflow-hidden">
          <Image
            src="/woman-orange-oversized-jacket-street-style-apparel-rear-view.jpg"
            alt="Sell fashion on Tradelynk"
            fill
            className="object-cover object-center opacity-60"
            priority
          />
          {/* Gradient fade from left */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
          {/* Gradient fade from bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

          {/* Floating product card */}
          <div className="absolute bottom-24 right-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white max-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span
                className="text-xs text-green-300 font-semibold"
                style={{ fontFamily: "Clash Display" }}
              >
                New order!
              </span>
            </div>
            <p
              className="text-sm font-bold"
              style={{ fontFamily: "Clash Display" }}
            >
              Oversized Jacket
            </p>
            <p
              className="text-xs text-gray-300"
              style={{ fontFamily: "Clash Display" }}
            >
              Buyer just paid ₦18,000
            </p>
          </div>

          {/* Floating store visits badge */}
          <div className="absolute top-32 right-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white">
            <p
              className="text-xs text-gray-300 mb-1"
              style={{ fontFamily: "Clash Display" }}
            >
              Store visits today
            </p>
            <p
              className="text-2xl font-bold"
              style={{ fontFamily: "Clash Display" }}
            >
              1,247
            </p>
            <p
              className="text-xs text-green-400"
              style={{ fontFamily: "Clash Display" }}
            >
              ↑ 34% vs yesterday
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20 lg:pt-40 lg:pb-32 w-full">
          <div className="lg:max-w-[58%]">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 mb-8 animate-fade-in-up">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span
                className="text-white/80 text-xs sm:text-sm font-medium"
                style={{ fontFamily: "Clash Display", fontWeight: 500 }}
              >
                Built for Instagram Sellers &#127469;&#127468;
              </span>
            </div>

            {/* Headline */}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6 animate-fade-in-up delay-100"
              style={{ fontFamily: "Clash Display", fontWeight: 700 }}
            >
              Stop Losing Sales to Slow Replies
            </h1>

            {/* Subheadline */}
            <p
              className="text-lg sm:text-xl text-gray-300 leading-relaxed max-w-2xl mb-10 animate-fade-in-up delay-200"
              style={{ fontFamily: "Clash Display", fontWeight: 400 }}
            >
              Tradelynk gives you a professional storefront and an AI Sales
              Assistant that works 24/7 on WhatsApp &mdash; so you never miss a
              customer again.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10 animate-fade-in-up delay-300">
              <Link
                href="/register"
                className="px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 text-base inline-flex items-center justify-center gap-2"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                Start Selling Smarter
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="px-8 py-4 bg-transparent text-white font-semibold rounded-lg border-2 border-white/20 hover:bg-white/10 transition-all duration-300 text-base inline-block"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                See How It Works
              </a>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400 animate-fade-in-up delay-400">
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Free to start
              </span>
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Setup in 5 mins
              </span>
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                No tech skills needed
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================
          SOCIAL PROOF BAR
          ============================ */}
      <section className="py-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: "Clash Display", fontWeight: 400 }}
            >
              Trusted by{" "}
              <span className="font-bold text-black">
                500+ Instagram sellers
              </span>{" "}
              across Nigeria
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className="text-yellow-400 text-lg">
                  &#9733;
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================
          PRODUCT CATEGORIES SHOWCASE
          ============================ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p
            className="text-center text-sm text-gray-500 mb-8 uppercase tracking-widest font-semibold"
            style={{ fontFamily: "Clash Display" }}
          >
            What Nigerian sellers list on Tradelynk
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                img: "/woman-orange-oversized-jacket-street-style-apparel-rear-view.jpg",
                label: "Fashion & Clothing",
                count: "2,400+ items",
              },
              {
                img: "/pasta-spaghetti-with-shrimps-tomato-sauce-served-plate-dark-surface-closeup.jpg",
                label: "Food & Meals",
                count: "890+ items",
              },
              {
                img: "/black-friday-assortment-with-shopping-carts.jpg",
                label: "Electronics & Gadgets",
                count: "1,100+ items",
              },
              {
                img: "/growtika-mlpsHpUUCHY-unsplash.jpg",
                label: "Beauty & Skincare",
                count: "760+ items",
              },
            ].map(({ img, label, count }) => (
              <Link
                key={label}
                href="/items"
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] block"
              >
                <Image
                  src={img}
                  alt={label}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p
                    className="text-white font-bold text-sm"
                    style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-white/60 text-xs"
                    style={{ fontFamily: "Clash Display" }}
                  >
                    {count}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================
          PAIN SECTION
          ============================ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 fade-in-section">
            <p
              className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-3"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              Sound familiar?
            </p>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-black"
              style={{ fontFamily: "Clash Display", fontWeight: 700 }}
            >
              Selling on Instagram is exhausting
            </h2>
            <p
              className="text-gray-600 text-lg leading-relaxed"
              style={{ fontFamily: "Clash Display", fontWeight: 400 }}
            >
              You spend hours every day answering the same questions, losing
              sales while you sleep, and watching customers leave because you
              replied too late.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 fade-in-section">
            {/* Pain 1 */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-xl transition-all duration-500 border border-transparent hover:border-gray-200">
              <div className="text-4xl mb-5">&#128172;</div>
              <h3
                className="text-lg font-bold mb-2 text-black"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                &quot;Price?&quot; &quot;Available?&quot; &quot;More pics?&quot;
              </h3>
              <p
                className="text-gray-600 text-sm leading-relaxed mb-6"
                style={{ fontFamily: "Clash Display", fontWeight: 400 }}
              >
                You type the same answers hundreds of times a week. It is
                draining, and it is holding your business back from growing.
              </p>
              <div className="pt-4 border-t border-gray-200">
                <p
                  className="text-2xl font-bold text-red-500"
                  style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                >
                  73%
                </p>
                <p
                  className="text-xs text-gray-500 mt-1"
                  style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                >
                  of seller time wasted on repetitive DMs
                </p>
              </div>
            </div>

            {/* Pain 2 */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-xl transition-all duration-500 border border-transparent hover:border-gray-200">
              <div className="text-4xl mb-5">&#9200;</div>
              <h3
                className="text-lg font-bold mb-2 text-black"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                Customers don&apos;t wait
              </h3>
              <p
                className="text-gray-600 text-sm leading-relaxed mb-6"
                style={{ fontFamily: "Clash Display", fontWeight: 400 }}
              >
                A buyer messages 5 sellers at once. The first to reply gets the
                sale. If you are slow, you lose - even if your product is
                better.
              </p>
              <div className="pt-4 border-t border-gray-200">
                <p
                  className="text-2xl font-bold text-orange-500"
                  style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                >
                  60%
                </p>
                <p
                  className="text-xs text-gray-500 mt-1"
                  style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                >
                  of sales lost due to late replies
                </p>
              </div>
            </div>

            {/* Pain 3 */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-xl transition-all duration-500 border border-transparent hover:border-gray-200">
              <div className="text-4xl mb-5">&#128564;</div>
              <h3
                className="text-lg font-bold mb-2 text-black"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                You can&apos;t be online 24/7
              </h3>
              <p
                className="text-gray-600 text-sm leading-relaxed mb-6"
                style={{ fontFamily: "Clash Display", fontWeight: 400 }}
              >
                While you sleep, eat, or handle other orders, potential
                customers are messaging you - and getting no response.
              </p>
              <div className="pt-4 border-t border-gray-200">
                <p
                  className="text-2xl font-bold text-amber-500"
                  style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                >
                  N210K+
                </p>
                <p
                  className="text-xs text-gray-500 mt-1"
                  style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                >
                  average monthly revenue missed from off-hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================
          SOLUTION SECTION
          ============================ */}
      <section className="w-full py-20 relative overflow-hidden" id="features">
        {/* Background */}
        <div className="absolute inset-0 bg-black"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <div className="text-center mb-16 fade-in-section">
            <p
              className="text-sm font-semibold text-purple-400 uppercase tracking-wide mb-3"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              The Solution
            </p>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 700 }}
            >
              Two powerful tools. One simple platform.
            </h2>
            <div className="h-1 w-20 bg-purple-600 mx-auto"></div>
          </div>

          {/* Two Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 fade-in-section">
            {/* Card 1 — Storefront */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8 hover:border-purple-600/40 transition-all duration-200 flex flex-col gap-5">
              <div className="text-5xl">&#127978;</div>
              <div>
                <h3
                  className="text-2xl font-bold text-white mb-3"
                  style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                >
                  Your Professional Storefront
                </h3>
                <p
                  className="text-gray-400 text-sm leading-relaxed"
                  style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                >
                  Get your own store link like{" "}
                  <span className="text-purple-400 font-mono text-xs bg-purple-950/40 px-2 py-0.5 rounded">
                    yourstore.tradelynk.app
                  </span>
                  . Upload products, organize collections, and share one link
                  instead of sending photos one by one.
                </p>
              </div>
              <ul className="space-y-2">
                {[
                  "Launch in 5 minutes",
                  "Share on Instagram bio",
                  "Customers can order directly",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-gray-300"
                    style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                  >
                    <span className="text-green-400 font-bold">&#10003;</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-4 border-t border-[#2A2A2A]">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  Available Now — Free
                </span>
              </div>
            </div>

            {/* Card 2 — WhatsApp AI */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8 hover:border-purple-600/40 transition-all duration-200 flex flex-col gap-5 relative overflow-hidden">
              {/* Coming Soon ribbon */}
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-purple-300 bg-purple-600/20 px-3 py-1.5 rounded-full border border-purple-600/30">
                  &#128274; Pro — Coming Soon
                </span>
              </div>
              <div className="text-5xl">&#129302;</div>
              <div>
                <h3
                  className="text-2xl font-bold text-white mb-3"
                  style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                >
                  Your 24/7 WhatsApp AI
                </h3>
                <p
                  className="text-gray-400 text-sm leading-relaxed"
                  style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                >
                  AI that replies to customers, sends product details, and
                  generates payment links — even while you sleep.
                </p>
              </div>
              <ul className="space-y-2">
                {[
                  "Auto-replies instantly",
                  "Handles unlimited chats",
                  "Works at 3AM",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-gray-300"
                    style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                  >
                    <span className="text-purple-400 font-bold">&#10003;</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-4 border-t border-[#2A2A2A]">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-purple-300 hover:text-purple-200 transition-colors"
                  style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                >
                  Join the waitlist &#8594;
                </Link>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16 fade-in-section">
            <Link
              href="/register"
              className="inline-block px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-900/30"
              style={{ fontFamily: "Clash Display", fontWeight: 700 }}
            >
              Start Selling Smarter &#8594;
            </Link>
          </div>
        </div>
      </section>

      {/* ============================
          HOW IT WORKS
          ============================ */}
      <section className="w-full py-20 bg-white" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <div className="text-center mb-16 fade-in-section">
            <p
              className="text-sm font-semibold text-blue-500 uppercase tracking-wide mb-3"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              Simple Setup
            </p>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-black"
              style={{ fontFamily: "Clash Display", fontWeight: 700 }}
            >
              Up and running in 3 easy steps
            </h2>
            <p
              className="text-gray-600 text-lg"
              style={{ fontFamily: "Clash Display", fontWeight: 400 }}
            >
              No coding. No complicated setup. Just connect and start selling.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start fade-in-section">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center mb-6 shadow-lg transform hover:scale-110 transition-transform duration-300">
                <span
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                >
                  01
                </span>
              </div>
              <h3
                className="text-2xl font-bold mb-3 text-black"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                Add Your Products
              </h3>
              <p
                className="text-gray-600 leading-relaxed"
                style={{ fontFamily: "Clash Display", fontWeight: 400 }}
              >
                Upload your products with photos, prices, and descriptions. Your
                store is ready to share in minutes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center mb-6 shadow-lg transform hover:scale-110 transition-transform duration-300">
                <span
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                >
                  02
                </span>
              </div>
              <h3
                className="text-2xl font-bold mb-3 text-black"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                Connect WhatsApp
              </h3>
              <p
                className="text-gray-600 leading-relaxed"
                style={{ fontFamily: "Clash Display", fontWeight: 400 }}
              >
                Link your WhatsApp business number. Our AI instantly learns
                about your products and pricing.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center mb-6 shadow-lg transform hover:scale-110 transition-transform duration-300">
                <span
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                >
                  03
                </span>
              </div>
              <h3
                className="text-2xl font-bold mb-3 text-black"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                Watch Sales Roll In
              </h3>
              <p
                className="text-gray-600 leading-relaxed"
                style={{ fontFamily: "Clash Display", fontWeight: 400 }}
              >
                Share your store link. The AI handles customer conversations and
                drives sales - automatically.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16 fade-in-section">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{ fontFamily: "Clash Display", fontWeight: 700 }}
            >
              Get Started Free
              <span>&#8594;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================
          TESTIMONIALS
          ============================ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 fade-in-section">
            <p
              className="text-sm font-semibold text-purple-500 uppercase tracking-wide mb-3"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              Testimonials
            </p>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-black"
              style={{ fontFamily: "Clash Display", fontWeight: 700 }}
            >
              Loved by sellers just like you
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 fade-in-section">
            {[
              {
                name: "Amaka O.",
                role: "Clothing Seller",
                handle: "@amaka_styles",
                img: "/woman-orange-oversized-jacket-street-style-apparel-rear-view.jpg",
                text: "I used to spend 6 hours a day replying to DMs. Now my AI assistant handles everything while I focus on sourcing new designs. My sales tripled in the first month!",
              },
              {
                name: "Blessing K.",
                role: "Hair and Beauty",
                handle: "@blessinghair_ng",
                img: "/growtika-mlpsHpUUCHY-unsplash.jpg",
                text: "The AI is so professional. Customers cannot even tell it is not me replying. I just share my link and they can see everything without asking me 'price?' for the hundredth time.",
              },
              {
                name: "David J.",
                role: "Sneaker Seller",
                handle: "@djkicks_",
                img: "/dennis-brendel-YLNMXzXk8zs-unsplash.jpg",
                text: "I was losing sales every night because I could not reply at 2AM. Now the AI handles late-night customers and I wake up to new orders. Worth every naira.",
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-500"
              >
                {/* Image strip */}
                <div className="relative h-32 w-full">
                  <Image
                    src={testimonial.img}
                    alt={testimonial.name}
                    fill
                    className="object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/60"></div>
                </div>
                <div className="p-7 -mt-6 relative">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <span key={j} className="text-yellow-400 text-lg">
                        &#9733;
                      </span>
                    ))}
                  </div>
                  <p
                    className="text-gray-700 leading-relaxed mb-6 text-sm"
                    style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                  >
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold text-black"
                        style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                      >
                        {testimonial.name}
                      </p>
                      <p
                        className="text-xs text-gray-500"
                        style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                      >
                        {testimonial.role} &mdash; {testimonial.handle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================
          PRICING
          ============================ */}
      <section className="w-full py-20 bg-white" id="pricing">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 fade-in-section">
            <p
              className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-3"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              Pricing
            </p>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-black"
              style={{ fontFamily: "Clash Display", fontWeight: 700 }}
            >
              Simple, affordable pricing
            </h2>
            <p
              className="text-gray-600 text-lg"
              style={{ fontFamily: "Clash Display", fontWeight: 400 }}
            >
              Less than what you lose from one missed sale. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 fade-in-section">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:shadow-xl transition-all duration-500">
              <h3
                className="text-lg font-bold mb-1 text-black"
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                Free
              </h3>
              <p
                className="text-sm text-gray-500 mb-6"
                style={{ fontFamily: "Clash Display", fontWeight: 400 }}
              >
                Your professional storefront, no credit card needed
              </p>
              <div className="flex items-baseline gap-1 mb-6">
                <span
                  className="text-4xl font-bold text-black"
                  style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                >
                  &#8358;0
                </span>
                <span
                  className="text-gray-500 text-sm"
                  style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                >
                  /month
                </span>
              </div>
              <Link
                href="/register"
                className="block w-full text-center py-3.5 rounded-xl border-2 border-black text-black font-semibold hover:bg-black hover:text-white transition-all duration-300"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                Get Started Free
              </Link>
              <div className="mt-8 space-y-3">
                {[
                  "Storefront link (yourstore.tradelynk.app)",
                  "Upload unlimited products",
                  "Receive orders directly",
                  "Share your store link",
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <svg
                      className="w-4 h-4 text-green-500 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span
                      className="text-sm text-gray-700"
                      style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                    >
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Plan */}
            <div className="relative bg-[#0F0F0F] text-white rounded-2xl p-8 hover:shadow-2xl transition-all duration-500 border border-purple-600/30">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-purple-600 text-white text-xs font-semibold shadow-lg whitespace-nowrap">
                Pro — Coming Soon
              </div>
              <h3
                className="text-lg font-bold mb-1"
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                Pro
              </h3>
              <p
                className="text-sm text-gray-400 mb-6"
                style={{ fontFamily: "Clash Display", fontWeight: 400 }}
              >
                Everything in Free + WhatsApp AI Sales Assistant
              </p>
              <div className="flex items-baseline gap-1 mb-6">
                <span
                  className="text-4xl font-bold"
                  style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                >
                  &#8358;7,500
                </span>
                <span
                  className="text-gray-400 text-sm"
                  style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                >
                  /month
                </span>
              </div>
              <Link
                href="/register"
                className="block w-full text-center py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all duration-300"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                Join Waitlist
              </Link>
              <div className="mt-8 space-y-3">
                {[
                  "Everything in Free",
                  "WhatsApp AI Sales Assistant",
                  "Auto-replies 24/7",
                  "Generate payment links",
                  "Handle unlimited chats",
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <svg
                      className="w-4 h-4 text-purple-400 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span
                      className="text-sm text-gray-300"
                      style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                    >
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================
          FAQ
          ============================ */}
      <section className="w-full py-20 bg-gray-50" id="faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 fade-in-section">
            <p
              className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              FAQ
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-black"
              style={{ fontFamily: "Clash Display", fontWeight: 700 }}
            >
              Got questions?
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 px-6 sm:px-8 fade-in-section">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-gray-200 last:border-0">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between py-5 text-left"
                >
                  <span
                    className="text-base sm:text-lg font-semibold pr-4 text-black"
                    style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                  >
                    {faq.q}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 shrink-0 transition-transform duration-300 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="pb-5">
                    <p
                      className="text-gray-600 leading-relaxed"
                      style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                    >
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================
          FINAL CTA
          ============================ */}
      <section className="w-full py-24 relative overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/black-friday-sales-sign-neon-light.jpg"
            alt="Start selling"
            fill
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/80"></div>
        </div>
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[150px]"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="space-y-8 fade-in-section">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight"
              style={{ fontFamily: "Clash Display", fontWeight: 700 }}
            >
              Ready to stop losing sales and start selling smarter?
            </h2>

            <p
              className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto"
              style={{ fontFamily: "Clash Display", fontWeight: 400 }}
            >
              Join hundreds of Instagram sellers who use Tradelynk to grow their
              business on autopilot.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                Get Started Free
                <span>&#8594;</span>
              </Link>
            </div>

            <p
              className="text-sm text-gray-500"
              style={{ fontFamily: "Clash Display", fontWeight: 400 }}
            >
              No credit card required &mdash; Free plan available &mdash; Setup
              in 5 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
