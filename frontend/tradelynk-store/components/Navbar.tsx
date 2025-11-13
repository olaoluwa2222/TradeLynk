// components/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  // ✅ Show verification badge if user is not verified
  const showVerificationBadge = isAuthenticated && user && !user.verified;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/Logo Icon.png"
              alt="Campus Marketplace Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span
              className="text-lg font-normal"
              style={{
                color: "#0C0A09",
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              Campus
            </span>
          </Link>

          {/* Center Navigation Links */}
          <div className="flex items-center gap-3 flex-1 mx-8">
            <div className="relative w-full max-w-sm">
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
                <Image
                  src="/search 01.png"
                  alt="Search"
                  width={20}
                  height={20}
                  className="w-5 h-5 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="ml-3 w-full bg-transparent outline-none text-sm placeholder-gray-400"
                  style={{
                    color: "#0C0A09",
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Section - Icons & Auth */}
          <div className="flex items-center gap-6">
            {/* Cart/Bag Icon */}
            <button className="hover:opacity-75 transition-opacity">
              <Image
                src="/search 2.png"
                alt="Cart"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </button>

            {/* Profile/User Icon */}
            <button className="hover:opacity-75 transition-opacity">
              <Image
                src="/shopping bag.png"
                alt="Profile"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </button>

            {/* Contact Us Button */}
            <Link
              href="/contact"
              className="flex items-center justify-between px-1 py-1 rounded-full bg-black"
            >
              <span
                className="text-sm font-normal mr-4 pl-3"
                style={{
                  color: "white",
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Become a Seller
              </span>
              <div className="bg-white rounded-full p-2 flex items-center justify-center">
                <Image
                  src="/arrow-right.png"
                  alt="Arrow"
                  width={16}
                  height={16}
                  className="w-5 h-5"
                  color="#0C0A09"
                />
              </div>
            </Link>

            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-300">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-medium"
                    style={{ color: "#0C0A09" }}
                  >
                    {user?.name}
                  </span>
                  {/* ✅ Verification Badge */}
                  {showVerificationBadge && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
                      ⚠️
                    </span>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                  style={{ backgroundColor: "#0C0A09" }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-300">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium transition-colors"
                  style={{ color: "#0C0A09" }}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                  style={{ backgroundColor: "#0C0A09" }}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
