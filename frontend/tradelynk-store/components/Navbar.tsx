// components/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { itemsApi } from "@/lib/api";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // ✅ Show verification badge if user is not verified
  const showVerificationBadge = isAuthenticated && user && !user.verified;

  // Fetch suggestions when user types
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        fetchSuggestions(searchQuery);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Fetch suggestions from API
  const fetchSuggestions = async (query: string) => {
    try {
      setIsLoadingSuggestions(true);
      const data = await itemsApi.getSearchSuggestions(query);

      if (data.success && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    // Redirect to items page with search query
    router.push(`/items?search=${encodeURIComponent(suggestion)}`);
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/items?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          <div className="flex items-center flex-1 mx-8">
            <div className="relative w-full" ref={searchRef}>
              {/* Clean search bar with subtle shadow and light border */}
              <form onSubmit={handleSearch} className="relative">
                <div className="flex items-center bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
                  <Image
                    src="/search 01.png"
                    alt="Search"
                    width={20}
                    height={20}
                    className="w-5 h-5 text-gray-400 shrink-0"
                  />
                  <input
                    type="text"
                    placeholder="What are you looking for?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() =>
                      searchQuery.trim().length > 0 && setShowSuggestions(true)
                    }
                    className="w-full bg-transparent outline-none text-sm placeholder-gray-400 ml-4"
                    style={{
                      color: "#0C0A09",
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  />
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions &&
                  (suggestions.length > 0 || isLoadingSuggestions) && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                      {isLoadingSuggestions ? (
                        <div className="px-5 py-4 text-center text-sm text-gray-500">
                          Loading suggestions...
                        </div>
                      ) : suggestions.length > 0 ? (
                        <ul>
                          {suggestions.map((suggestion, index) => (
                            <li key={index}>
                              <button
                                type="button"
                                onClick={() =>
                                  handleSuggestionClick(suggestion)
                                }
                                className="w-full text-left px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-2"
                              >
                                <Image
                                  src="/search 01.png"
                                  alt="Search"
                                  width={16}
                                  height={16}
                                  className="w-4 h-4 text-gray-400"
                                />
                                <span
                                  className="text-sm"
                                  style={{
                                    color: "#0C0A09",
                                    fontFamily: "Clash Display",
                                    fontWeight: 400,
                                  }}
                                >
                                  {suggestion}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  )}
              </form>
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

            {/* Chat Icon - Show only if logged in */}
            {isAuthenticated && (
              <Link
                href="/chat"
                className="hover:opacity-75 transition-opacity relative"
                title="Messages"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </Link>
            )}

            {/* Contact Us Button */}
            <Link
              href="/become-a-seller"
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
