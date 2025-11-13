// app/page.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function Home() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Will be added here */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Campus Marketplace
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Buy and sell items with fellow LMU students
          </p>

          {isAuthenticated ? (
            <div className="space-y-6">
              <p className="text-lg text-gray-700">
                Welcome back,{" "}
                <span className="font-semibold">{user?.name}</span>! 👋
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/shop"
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors inline-block"
                >
                  Browse Items
                </Link>
                {(user?.role === "SELLER" ||
                  user?.role === "BOTH" ||
                  user?.role === "ADMIN") && (
                  <Link
                    href="/items/create"
                    className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors inline-block"
                  >
                    Sell Item
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 mb-8">
                Join our community to start buying and selling!
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/register"
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors inline-block"
                >
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors inline-block"
                >
                  Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Additional sections will be added here */}
      {/* Features Section */}
      {/* Services Section */}
      {/* How It Works Section */}
      {/* Footer Section */}
    </div>
  );
}
