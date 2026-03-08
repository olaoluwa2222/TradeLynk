"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { itemsApi, ordersApi } from "@/lib/api";
import BuyerDashboardLayout from "@/components/dashboard/BuyerDashboardLayout";

interface TrendingItem {
  id: number;
  title: string;
  price: number;
  imageUrls: string[] | string;
  sellerName?: string;
  category?: string;
  slug?: string;
}

interface RecentOrder {
  id: number;
  amount: number;
  status: string;
  createdAt: string;
  item: {
    id: number;
    title: string;
    imageUrls: string | string[];
  };
  seller: {
    name: string;
  };
}

function getImageUrl(urls: string | string[]): string {
  if (Array.isArray(urls) && urls.length > 0) return urls[0];
  if (typeof urls === "string") {
    try {
      const parsed = JSON.parse(urls);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch {
      return urls;
    }
  }
  return "/placeholder-product.png";
}

function formatPrice(price: number): string {
  const naira = price >= 100 ? Math.floor(price / 100) : price;
  return `₦${naira.toLocaleString()}`;
}

const statusColors: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  PAYMENT_HELD: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    label: "Payment Held",
  },
  SHIPPED: { bg: "bg-blue-50", text: "text-blue-700", label: "Shipped" },
  DELIVERED: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    label: "Delivered",
  },
  COMPLETED: { bg: "bg-green-50", text: "text-green-700", label: "Completed" },
  DISPUTED: { bg: "bg-red-50", text: "text-red-700", label: "Disputed" },
  CANCELLED: { bg: "bg-gray-50", text: "text-gray-700", label: "Cancelled" },
};

export default function BuyerDashboard() {
  const { user, isAuthenticated, isSeller, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [greeting, setGreeting] = useState("");

  // Greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/dashboard/buyer");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch trending items
  const fetchTrending = useCallback(async () => {
    try {
      setLoadingTrending(true);
      const res = await itemsApi.getTrendingItems(7, 8);
      if (res.success) {
        setTrending(Array.isArray(res.data) ? res.data : []);
      }
    } catch (e) {
      console.error("Failed to fetch trending:", e);
    } finally {
      setLoadingTrending(false);
    }
  }, []);

  // Fetch recent orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const res = await ordersApi.getMyPurchases(0, 5);
      if (res.success) {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setRecentOrders(data);
      }
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrending();
      fetchOrders();
    }
  }, [isAuthenticated, fetchTrending, fetchOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/items?search=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  if (authLoading) {
    return (
      <BuyerDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-10 w-10 border-3 border-black border-t-transparent rounded-full" />
        </div>
      </BuyerDashboardLayout>
    );
  }

  return (
    <BuyerDashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1
            className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1"
            style={{ fontFamily: "Clash Display", fontWeight: 700 }}
          >
            {greeting}, {user?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p
            className="text-gray-500 text-sm"
            style={{ fontFamily: "Clash Display", fontWeight: 400 }}
          >
            Discover products and track your orders
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-10">
          <div className="relative max-w-2xl">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for products, categories, or sellers..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 transition-all placeholder:text-gray-400"
              style={{ fontFamily: "Clash Display", fontWeight: 400 }}
            />
          </div>
        </form>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            {
              label: "Browse All",
              href: "/items",
              icon: "🛍️",
              color: "bg-purple-50 hover:bg-purple-100 border-purple-100",
            },
            {
              label: "My Orders",
              href: "/orders/purchases",
              icon: "📦",
              color: "bg-blue-50 hover:bg-blue-100 border-blue-100",
            },
            {
              label: "Messages",
              href: "/chat",
              icon: "💬",
              color: "bg-green-50 hover:bg-green-100 border-green-100",
            },
            {
              label: isSeller ? "Seller Dashboard" : "Start Selling",
              href: isSeller ? "/dashboard/seller" : "/become-a-seller",
              icon: isSeller ? "📊" : "⚡",
              color: "bg-amber-50 hover:bg-amber-100 border-amber-100",
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${action.color}`}
            >
              <span className="text-2xl">{action.icon}</span>
              <span
                className="text-sm font-semibold text-gray-800"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                {action.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-bold text-gray-900"
              style={{ fontFamily: "Clash Display", fontWeight: 700 }}
            >
              Recent Orders
            </h2>
            <Link
              href="/orders/purchases"
              className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
            >
              View all →
            </Link>
          </div>

          {loadingOrders ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse"
                >
                  <div className="flex gap-3">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
              <p className="text-4xl mb-3">📦</p>
              <p
                className="text-gray-500 text-sm mb-3"
                style={{ fontFamily: "Clash Display", fontWeight: 400 }}
              >
                No orders yet. Start shopping!
              </p>
              <Link
                href="/items"
                className="inline-flex items-center gap-2 text-sm font-semibold text-black hover:underline"
              >
                Browse Products →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentOrders.slice(0, 4).map((order) => {
                const badge =
                  statusColors[order.status] || statusColors.PAYMENT_HELD;
                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="flex gap-3">
                      <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={getImageUrl(order.item?.imageUrls)}
                          alt={order.item?.title || "Product"}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-black">
                          {order.item?.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatPrice(order.amount)} ·{" "}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        <span
                          className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Trending Products */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-bold text-gray-900"
              style={{ fontFamily: "Clash Display", fontWeight: 700 }}
            >
              Trending Products 🔥
            </h2>
            <Link
              href="/items"
              className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
            >
              See all →
            </Link>
          </div>

          {loadingTrending ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-gray-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : trending.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p
                className="text-gray-500 text-sm"
                style={{ fontFamily: "Clash Display", fontWeight: 400 }}
              >
                No trending products right now. Check back later!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {trending.map((item) => (
                <Link
                  key={item.id}
                  href={item.slug ? `/items/${item.slug}` : `/items/${item.id}`}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:shadow-md transition-all duration-300 group"
                >
                  <div className="aspect-square bg-gray-50 overflow-hidden">
                    <Image
                      src={getImageUrl(item.imageUrls)}
                      alt={item.title}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-400 truncate">
                      {item.sellerName || item.category}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 truncate mt-0.5 group-hover:text-black">
                      {item.title}
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Become a seller CTA (only for buyers) */}
        {!isSeller && (
          <div className="bg-linear-to-r from-gray-900 to-black rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Start your business
              </p>
              <h3
                className="text-xl sm:text-2xl font-bold mb-2"
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                Ready to start selling?
              </h3>
              <p
                className="text-gray-300 text-sm mb-5 max-w-md"
                style={{ fontFamily: "Clash Display", fontWeight: 400 }}
              >
                Get your own storefront, manage products, and reach customers
                across Nigeria. Free to start.
              </p>
              <Link
                href="/become-a-seller"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-100 transition-all"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                Become a Seller
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </div>
    </BuyerDashboardLayout>
  );
}
