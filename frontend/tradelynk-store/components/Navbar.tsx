// components/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { itemsApi, ordersApi, chatsApi } from "@/lib/api";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Notification counts
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // ✅ Show verification badge if user is not verified
  const showVerificationBadge = isAuthenticated && user && !user.verified;

  // ✅ Check if user is a seller
  const isSeller =
    user?.role === "SELLER" || user?.role === "BOTH" || user?.role === "ADMIN";

  // Fetch notification counts
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchNotifications = async () => {
      try {
        setNotificationsLoading(true);

        // Fetch unread messages count using dedicated endpoint
        try {
          const unreadResponse = await chatsApi.getUnreadCount();
          console.log("📧 Unread count response:", unreadResponse);
          if (unreadResponse.success) {
            // The endpoint returns { success: true, unreadCount: X }
            const totalUnread = unreadResponse.unreadCount || 0;
            console.log("📧 Total unread messages:", totalUnread);
            setUnreadMessages(totalUnread);
          }
        } catch (err) {
          console.error("❌ Error fetching unread count:", err);
        }

        // Fetch pending orders count
        const ordersResponse = await ordersApi.getMyPurchases(0, 100);
        if (ordersResponse.success && Array.isArray(ordersResponse.data)) {
          const pendingCount = ordersResponse.data.filter(
            (order: any) => order.status === "PENDING_DELIVERY"
          ).length;
          setPendingOrders(pendingCount);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setNotificationsLoading(false);
      }
    };

    fetchNotifications();
    // Poll for new messages every 60 seconds to minimize backend load
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/items?search=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    router.push(`/items?search=${encodeURIComponent(suggestion)}`);
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }

      try {
        setIsLoadingSuggestions(true);
        const response = await itemsApi.searchItems(searchQuery, 0, 5);
        const items = response.data;

        if (items) {
          const names = items.map(
            (item: any) => item.name || item.title
          ) as string[];
          setSuggestions(names);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white border-b border-gray-300 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex justify-between items-center gap-4 sm:gap-6">
          {/* Logo Section */}
          <Link
            href="/"
            className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/Logo Icon.png"
              alt="Campus Marketplace Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span
              className="text-lg font-bold hidden sm:inline"
              style={{
                color: "#0C0A09",
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              Tradelynk
            </span>
          </Link>

          {/* Search Bar - Center */}
          <div className="flex-1 max-w-md hidden sm:block" ref={searchRef}>
            <div className="relative">
              <form onSubmit={handleSearch} className="relative">
                <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 hover:border-gray-400 focus-within:border-black focus-within:bg-white transition-all">
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() =>
                      searchQuery.trim().length > 0 && setShowSuggestions(true)
                    }
                    className="w-full bg-transparent outline-none text-sm placeholder-gray-500 ml-3"
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
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                      {isLoadingSuggestions ? (
                        <div className="px-4 py-3 text-center text-sm text-gray-500">
                          Loading...
                        </div>
                      ) : suggestions.length > 0 ? (
                        <ul>
                          {suggestions.map((suggestion, index) => (
                            <li key={index}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchQuery(suggestion);
                                  setShowSuggestions(false);
                                  router.push(
                                    `/items?search=${encodeURIComponent(
                                      suggestion
                                    )}`
                                  );
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-2 text-sm"
                                style={{
                                  fontFamily: "Clash Display",
                                  fontWeight: 400,
                                }}
                              >
                                <svg
                                  className="w-4 h-4 text-gray-400 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                  />
                                </svg>
                                {suggestion}
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
          <div className="flex items-center gap-1 sm:gap-4">
            {/* Messages Icon with Badge */}
            {isAuthenticated && (
              <Link
                href="/chat"
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-all group"
                title="Messages"
              >
                <svg
                  className="w-6 h-6 text-gray-700 group-hover:text-black transition-colors"
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
                {unreadMessages > 0 && (
                  <span className="absolute top-0 right-0 flex items-center justify-center h-5 w-5 bg-black text-white text-xs font-bold rounded-full scale-100 hover:scale-110 transition-transform shadow-sm">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </Link>
            )}

            {/* Orders Icon with Badge */}
            {isAuthenticated && (
              <Link
                href="/orders/purchases"
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-all group"
                title="My Orders"
              >
                <svg
                  className="w-6 h-6 text-gray-700 group-hover:text-black transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {pendingOrders > 0 && (
                  <span className="absolute top-0 right-0 flex items-center justify-center h-5 w-5 bg-gray-700 text-white text-xs font-bold rounded-full scale-100 hover:scale-110 transition-transform shadow-sm">
                    {pendingOrders > 9 ? "9+" : pendingOrders}
                  </span>
                )}
              </Link>
            )}

            {/* Sell Item Button */}
            {isAuthenticated && isSeller && (
              <Link
                href="/create-item"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-all"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="text-sm">Sell</span>
              </Link>
            )}

            {/* Auth Section */}
            {isAuthenticated ? (
              <div
                ref={profileRef}
                className="relative flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-300"
                onMouseEnter={() => setShowProfileDropdown(true)}
                onMouseLeave={() => setShowProfileDropdown(false)}
              >
                {/* Profile Button */}
                <button className="flex items-center gap-2 hover:opacity-75 transition-opacity py-2">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span
                      className="text-sm font-semibold leading-none"
                      style={{ color: "#0C0A09", fontFamily: "Clash Display" }}
                    >
                      {user?.name?.split(" ")[0]}
                    </span>
                    {showVerificationBadge && (
                      <span className="text-xs text-yellow-600 font-medium">
                        ⚠️ Verify
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 hidden sm:block transition-transform ${
                      showProfileDropdown ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-300 rounded-lg shadow-xl z-50 overflow-hidden">
                    {/* My Profile */}
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileDropdown(false)}
                      className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100"
                      style={{
                        color: "#0C0A09",
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      👤 My Profile
                    </Link>

                    {/* My Orders */}
                    <Link
                      href="/orders/purchases"
                      onClick={() => setShowProfileDropdown(false)}
                      className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100"
                      style={{
                        color: "#0C0A09",
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      📦 My Orders
                    </Link>

                    {/* My Sales - Only for sellers */}
                    {isSeller && (
                      <Link
                        href="/orders/sales"
                        onClick={() => setShowProfileDropdown(false)}
                        className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100"
                        style={{
                          color: "#0C0A09",
                          fontFamily: "Clash Display",
                          fontWeight: 400,
                        }}
                      >
                        💰 My Sales
                      </Link>
                    )}

                    {/* Seller Dashboard - Only for sellers */}
                    {isSeller && (
                      <Link
                        href="/dashboard/seller"
                        onClick={() => setShowProfileDropdown(false)}
                        className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100"
                        style={{
                          color: "#0C0A09",
                          fontFamily: "Clash Display",
                          fontWeight: 400,
                        }}
                      >
                        📊 Dashboard
                      </Link>
                    )}

                    {/* Settings */}
                    <Link
                      href="/settings"
                      onClick={() => setShowProfileDropdown(false)}
                      className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100"
                      style={{
                        color: "#0C0A09",
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      ⚙️ Settings
                    </Link>

                    {/* Logout */}
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-50 transition-colors rounded-b-lg"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-300">
                <Link
                  href="/login"
                  className="px-2 sm:px-3 py-2 text-sm transition-colors hover:opacity-75"
                  style={{
                    color: "#0C0A09",
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-3 sm:px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-gray-900 transition-colors"
                  style={{
                    backgroundColor: "#0C0A09",
                    fontFamily: "Clash Display",
                  }}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar - Below navbar on mobile */}
        <div className="block sm:hidden mt-3" ref={searchRef}>
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5">
              <svg
                className="w-5 h-5 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() =>
                  searchQuery.trim().length > 0 && setShowSuggestions(true)
                }
                className="w-full bg-transparent outline-none text-sm placeholder-gray-500 ml-3"
                style={{
                  color: "#0C0A09",
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              />
            </div>

            {/* Mobile Suggestions Dropdown */}
            {showSuggestions &&
              (suggestions.length > 0 || isLoadingSuggestions) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  {isLoadingSuggestions ? (
                    <div className="px-4 py-3 text-center text-sm text-gray-500">
                      Loading...
                    </div>
                  ) : suggestions.length > 0 ? (
                    <ul>
                      {suggestions.map((suggestion, index) => (
                        <li key={index}>
                          <button
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-2 text-sm"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          >
                            <svg
                              className="w-4 h-4 text-gray-400 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                            {suggestion}
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
    </nav>
  );
}
