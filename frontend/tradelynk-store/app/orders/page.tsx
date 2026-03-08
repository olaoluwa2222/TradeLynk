"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { ordersApi } from "@/lib/api";
import { OrderStatus } from "@/types/orders";

/* ── Types ── */
interface OrderItem {
  id: number;
  amount: number;
  deliveryAddress: string;
  status: OrderStatus;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  disputedAt?: string;
  item: {
    id: number;
    title: string;
    price: number;
    imageUrls: string | string[];
  };
  buyer: { id: number; name: string; email: string };
  seller: { id: number; name: string; email: string };
  payment?: { paystackReference: string; status: string; paidAt: string };
}

/* ── Helpers ── */
function getImageUrl(urls: string | string[]): string {
  if (Array.isArray(urls) && urls.length > 0) return urls[0];
  if (typeof urls === "string") {
    try {
      const p = JSON.parse(urls);
      if (Array.isArray(p) && p.length > 0) return p[0];
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const STATUS_MAP: Record<
  string,
  { bg: string; text: string; label: string; dot: string }
> = {
  PAYMENT_HELD: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    label: "Payment Held",
    dot: "bg-amber-500",
  },
  SHIPPED: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    label: "Shipped",
    dot: "bg-blue-500",
  },
  DELIVERED: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    label: "Delivered",
    dot: "bg-emerald-500",
  },
  COMPLETED: {
    bg: "bg-green-50",
    text: "text-green-700",
    label: "Completed",
    dot: "bg-green-500",
  },
  DISPUTED: {
    bg: "bg-red-50",
    text: "text-red-700",
    label: "Disputed",
    dot: "bg-red-500",
  },
  REFUNDED: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    label: "Refunded",
    dot: "bg-gray-400",
  },
  CANCELLED: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    label: "Cancelled",
    dot: "bg-gray-400",
  },
};

const TABS = [
  { key: "ALL", label: "All" },
  { key: "PAYMENT_HELD", label: "Pending" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "COMPLETED", label: "Completed" },
  { key: "DISPUTED", label: "Disputed" },
];

type ViewMode = "purchases" | "sales";

export default function UnifiedOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F6F7] flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-3 border-black border-t-transparent rounded-full" />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const { user, isAuthenticated, isSeller, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialView =
    searchParams.get("view") === "sales" ? "sales" : "purchases";
  const initialTab = searchParams.get("status") || "ALL";

  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [allOrders, setAllOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    shipped: 0,
    completed: 0,
    disputed: 0,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/orders");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res =
        viewMode === "purchases"
          ? await ordersApi.getMyPurchases(page, 50)
          : await ordersApi.getMySales(page, 50);

      if (res.success) {
        let data: OrderItem[] = [];
        if (Array.isArray(res.data)) {
          data = res.data;
        } else if (res.data?.content) {
          data = res.data.content;
          setTotalPages(res.data.totalPages || 1);
        } else if (res.data?.data) {
          data = Array.isArray(res.data.data) ? res.data.data : [];
        }

        setAllOrders(data);

        // Compute stats
        setStats({
          total: data.length,
          pending: data.filter((o) => o.status === "PAYMENT_HELD").length,
          shipped: data.filter((o) => o.status === "SHIPPED").length,
          completed: data.filter(
            (o) => o.status === "COMPLETED" || o.status === "DELIVERED",
          ).length,
          disputed: data.filter((o) => o.status === "DISPUTED").length,
        });
      }
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, viewMode, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter orders by tab + search
  useEffect(() => {
    let filtered = allOrders;
    if (activeTab !== "ALL") {
      filtered = filtered.filter((o) => o.status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.item?.title?.toLowerCase().includes(q) ||
          o.buyer?.name?.toLowerCase().includes(q) ||
          o.seller?.name?.toLowerCase().includes(q) ||
          String(o.id).includes(q),
      );
    }
    setOrders(filtered);
  }, [allOrders, activeTab, searchQuery]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F6F6F7] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-3 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6F7]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h1
                className="text-base font-bold text-black"
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                Orders
              </h1>
            </div>
            <Link
              href={isSeller ? "/dashboard/seller" : "/dashboard/buyer"}
              className="text-sm text-gray-500 hover:text-black transition-colors"
              style={{ fontFamily: "Clash Display", fontWeight: 500 }}
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* View toggle (Purchases / Sales) */}
        {isSeller && (
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 w-fit mb-6">
            {(["purchases", "sales"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setViewMode(mode);
                  setPage(0);
                  setActiveTab("ALL");
                }}
                className={`px-4 py-2 text-sm rounded-lg font-semibold transition-all ${
                  viewMode === mode
                    ? "bg-black text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: viewMode === mode ? 600 : 400,
                }}
              >
                {mode === "purchases" ? "My Purchases" : "My Sales"}
              </button>
            ))}
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, color: "text-gray-900" },
            { label: "Pending", value: stats.pending, color: "text-amber-600" },
            { label: "Shipped", value: stats.shipped, color: "text-blue-600" },
            { label: "Disputed", value: stats.disputed, color: "text-red-600" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-100 p-4"
            >
              <p
                className="text-xs text-gray-500 mb-1"
                style={{ fontFamily: "Clash Display", fontWeight: 400 }}
              >
                {stat.label}
              </p>
              <p
                className={`text-xl font-bold ${stat.color}`}
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Search + Tabs */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-sm">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${viewMode}...`}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 transition-all placeholder:text-gray-400"
                style={{ fontFamily: "Clash Display", fontWeight: 400 }}
              />
            </div>
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-0.5 px-4 border-b border-gray-100 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => {
              const count =
                tab.key === "ALL"
                  ? allOrders.length
                  : allOrders.filter((o) => o.status === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-3 text-sm border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? "border-black text-black font-semibold"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: activeTab === tab.key ? 600 : 400,
                  }}
                >
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        activeTab === tab.key
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Orders list */}
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-8">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 py-4 animate-pulse"
                  >
                    <div className="w-14 h-14 bg-gray-100 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                    <div className="h-6 w-20 bg-gray-100 rounded-full" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-4xl mb-3">
                  {viewMode === "purchases" ? "📦" : "💰"}
                </p>
                <p
                  className="text-gray-500 text-sm mb-1"
                  style={{ fontFamily: "Clash Display", fontWeight: 500 }}
                >
                  {activeTab !== "ALL"
                    ? `No ${TABS.find((t) => t.key === activeTab)?.label?.toLowerCase() || ""} orders`
                    : viewMode === "purchases"
                      ? "No orders yet"
                      : "No sales yet"}
                </p>
                <p
                  className="text-gray-400 text-xs mb-4"
                  style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                >
                  {viewMode === "purchases"
                    ? "When you buy something, it will appear here."
                    : "When someone buys from you, it will appear here."}
                </p>
                {viewMode === "purchases" && (
                  <Link
                    href="/items"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black rounded-lg hover:bg-gray-800 transition"
                    style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                  >
                    Browse Products
                  </Link>
                )}
              </div>
            ) : (
              orders.map((order) => {
                const badge =
                  STATUS_MAP[order.status] || STATUS_MAP.PAYMENT_HELD;
                const counterparty =
                  viewMode === "purchases" ? order.seller : order.buyer;
                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50/80 transition-colors group"
                  >
                    {/* Product image */}
                    <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                      <Image
                        src={getImageUrl(order.item?.imageUrls)}
                        alt={order.item?.title || "Product"}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p
                            className="text-sm font-semibold text-gray-900 truncate group-hover:text-black"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 600,
                            }}
                          >
                            {order.item?.title}
                          </p>
                          <p
                            className="text-xs text-gray-400 mt-0.5 truncate"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          >
                            {viewMode === "purchases" ? "Seller" : "Buyer"}:{" "}
                            {counterparty?.name} · #{order.id}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className="text-sm font-bold text-gray-900"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 700,
                            }}
                          >
                            {formatPrice(order.amount)}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {timeAgo(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}
                          />
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    {/* Chevron */}
                    <svg
                      className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0"
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
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 transition"
                style={{ fontFamily: "Clash Display" }}
              >
                Previous
              </button>
              <span
                className="text-xs text-gray-500"
                style={{ fontFamily: "Clash Display" }}
              >
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 transition"
                style={{ fontFamily: "Clash Display" }}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="mt-6 flex items-center justify-between">
          <Link
            href="/orders/purchases"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            style={{ fontFamily: "Clash Display" }}
          >
            Detailed purchases view →
          </Link>
          {isSeller && (
            <Link
              href="/orders/sales"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              style={{ fontFamily: "Clash Display" }}
            >
              Detailed sales view →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
