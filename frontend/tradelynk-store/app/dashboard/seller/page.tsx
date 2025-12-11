"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { analyticsApi, ordersApi } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TopItem {
  itemId: number;
  title: string;
  imageUrl: string;
  price: number;
  likeCount?: number;
  viewCount?: number;
  revenue?: number;
  status: string;
}

interface SellerAnalytics {
  totalItemsPosted: number;
  activeItems: number;
  soldItems: number;
  hiddenItems: number;
  totalLikes: number;
  totalViews: number;
  totalChats: number;
  totalSales: number;
  totalRevenue: number;
  averageItemPrice: number;
  conversionRate: number;
  lastItemPosted: string;
  lastSale: string;
  topLikedItems: TopItem[];
  topViewedItems: TopItem[];
  topRevenueItems: TopItem[];
}

interface Order {
  id: number;
  amount: number;
  createdAt: string;
  status: string;
}

interface RevenueDataPoint {
  date: string;
  revenue: number;
}

// Placeholder skeleton component
const StatCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
    <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
    <div className="h-3 bg-gray-200 rounded w-40"></div>
  </div>
);

const ChartSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 h-64 animate-pulse">
    <div className="h-full bg-gray-100 rounded"></div>
  </div>
);

export default function SellerDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [sales, setSales] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);

  // Check if user is seller
  const isSeller =
    user?.role === "SELLER" || user?.role === "BOTH" || user?.role === "ADMIN";

  // Redirect logic
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/dashboard/seller");
    } else if (!authLoading && isAuthenticated && !isSeller) {
      router.push("/become-a-seller");
    }
  }, [authLoading, isAuthenticated, isSeller, router]);

  // Fetch data
  useEffect(() => {
    if (!isAuthenticated || !isSeller) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch analytics
        const analyticsResponse = await analyticsApi.getSellerAnalytics();
        if (analyticsResponse.success && analyticsResponse.data) {
          setAnalytics(analyticsResponse.data);
        }

        // Fetch sales for revenue chart
        const salesResponse = await ordersApi.getMySales(0, 100);
        if (salesResponse.success && Array.isArray(salesResponse.data)) {
          setSales(
            salesResponse.data.filter(
              (order: any) =>
                order.status === "DELIVERED" ||
                order.status === "COMPLETED" ||
                order.status === "PAID"
            )
          );
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(
          "Failed to load dashboard data. Please check your connection and try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, isSeller]);

  // Process revenue data for line chart
  const processRevenueData = (): RevenueDataPoint[] => {
    if (!sales || sales.length === 0) return [];

    // Group sales by date
    const revenueByDate: { [key: string]: number } = {};

    sales.forEach((order) => {
      const date = new Date(order.createdAt).toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
      });

      if (!revenueByDate[date]) {
        revenueByDate[date] = 0;
      }

      // Add 90% of amount (seller's share)
      revenueByDate[date] += order.amount * 0.9;
    });

    // Convert to array and sort by date
    return Object.entries(revenueByDate)
      .map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue),
      }))
      .slice(-30); // Last 30 days
  };

  // Engagement data - White/Black/Gray only
  const getEngagementData = () => {
    if (!analytics) return [];
    return [
      { name: "Likes", value: analytics.totalLikes, color: "#0C0A09" },
      { name: "Views", value: analytics.totalViews, color: "#4B5563" },
      { name: "Chats", value: analytics.totalChats, color: "#9CA3AF" },
      { name: "Sales", value: analytics.totalSales, color: "#E5E7EB" },
    ];
  };

  // Item status data - White/Black/Gray only
  const getStatusData = () => {
    if (!analytics) return [];
    return [
      { name: "Active", value: analytics.activeItems, color: "#0C0A09" },
      { name: "Sold", value: analytics.soldItems, color: "#6B7280" },
      { name: "Hidden", value: analytics.hiddenItems, color: "#D1D5DB" },
    ];
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format time difference
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Show loading state
  if (authLoading || (loading && !analytics)) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-gray-200 text-white px-6 py-12 animate-pulse">
          <div className="max-w-7xl mx-auto">
            <div className="h-8 bg-white/20 rounded w-64 mb-2"></div>
            <div className="h-4 bg-white/20 rounded w-96"></div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <ChartSkeleton />
            </div>
            <ChartSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <svg
            className="mx-auto h-16 w-16 text-red-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2
            className="text-2xl font-bold mb-2"
            style={{
              color: "#0C0A09",
              fontFamily: "Clash Display",
              fontWeight: 600,
            }}
          >
            Unable to Load Dashboard
          </h2>
          <p
            className="text-gray-600 mb-6"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            disabled={retrying}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 600,
            }}
          >
            {retrying ? "Retrying..." : "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  // Show no data state
  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h2
            className="text-2xl font-bold mb-2"
            style={{
              color: "#0C0A09",
              fontFamily: "Clash Display",
              fontWeight: 600,
            }}
          >
            No Sales Yet
          </h2>
          <p
            className="text-gray-600 mb-6"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            Start posting items to see your analytics and performance metrics
          </p>
          <Link
            href="/create-item"
            className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 600,
            }}
          >
            Post Your First Item
          </Link>
        </div>
      </div>
    );
  }

  const revenueData = processRevenueData();
  const engagementData = getEngagementData();
  const statusData = getStatusData();
  const netRevenue = analytics.totalRevenue * 0.9;
  const commission = analytics.totalRevenue * 0.1;

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section - Black background with white text */}
      <div className="bg-black text-white px-6 py-12 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1
                className="text-4xl font-bold mb-2"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 700,
                }}
              >
                Welcome back, {user?.name?.split(" ")[0]}!
              </h1>
              <p
                className="text-gray-300 text-lg"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Here's how your items are performing
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <Link
              href="/create-item"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              <svg
                className="w-5 h-5"
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
              Post New Item
            </Link>
            <Link
              href="/items/my-items"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-colors"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V7a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              View All Items
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue Card - Black background */}
          <div className="bg-black text-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-default">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p
                  className="text-gray-400 text-sm mb-1"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Total Revenue
                </p>
                <p
                  className="text-3xl font-bold"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  {formatCurrency(netRevenue)}
                </p>
              </div>
              <span className="text-3xl">💰</span>
            </div>
            <p
              className="text-gray-400 text-xs"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              Your earnings after 10% commission
            </p>
            <p
              className="text-gray-300 text-xs mt-3 pt-3 border-t border-gray-700"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              Gross: {formatCurrency(analytics.totalRevenue)} | Commission:{" "}
              {formatCurrency(commission)}
            </p>
          </div>

          {/* Total Sales Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-lg hover:border-gray-400 transition-all duration-300 hover:scale-105">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p
                  className="text-gray-600 text-sm mb-1"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Total Sales
                </p>
                <p
                  className="text-3xl font-bold text-black"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  {analytics.totalSales}
                </p>
              </div>
              <span className="text-3xl">📦</span>
            </div>
            <p
              className="text-gray-500 text-xs"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              Completed orders
            </p>
          </div>

          {/* Active Items Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-lg hover:border-gray-400 transition-all duration-300 hover:scale-105">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p
                  className="text-gray-600 text-sm mb-1"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Active Items
                </p>
                <p
                  className="text-3xl font-bold text-black"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  {analytics.activeItems}
                </p>
              </div>
              <span className="text-3xl">🛍️</span>
            </div>
            <p
              className="text-gray-500 text-xs"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              Currently listed
            </p>
          </div>

          {/* Conversion Rate Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-lg hover:border-gray-400 transition-all duration-300 hover:scale-105">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p
                  className="text-gray-600 text-sm mb-1"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Conversion Rate
                </p>
                <p
                  className="text-3xl font-bold text-black"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  {(analytics.conversionRate * 100).toFixed(2)}%
                </p>
              </div>
              <span className="text-3xl">📈</span>
            </div>
            <p
              className="text-gray-500 text-xs"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              Views to sales
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue & Engagement Charts - Left Column (60%) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue Over Time Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2
                className="text-xl font-bold mb-4"
                style={{
                  color: "#0C0A09",
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Revenue Over Time
              </h2>

              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      stroke="#6B7280"
                      style={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#6B7280" style={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                      }}
                      formatter={(value: any) => [
                        formatCurrency(value as number),
                        "Revenue",
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: "#10B981", r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Revenue (₦)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded">
                  <p
                    className="text-gray-500"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    No sales yet. Post an item to get started!
                  </p>
                </div>
              )}
            </div>

            {/* Engagement Overview Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2
                className="text-xl font-bold mb-4"
                style={{
                  color: "#0C0A09",
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Engagement Overview
              </h2>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="name"
                    stroke="#6B7280"
                    style={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#6B7280" style={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="value"
                    fill="#3B82F6"
                    name="Count"
                    radius={[8, 8, 0, 0]}
                  >
                    {engagementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution Chart - Right Column (40%) */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2
              className="text-xl font-bold mb-6"
              style={{
                color: "#0C0A09",
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              Item Status
            </h2>

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Status Legend */}
            <div className="mt-6 space-y-2">
              {statusData.map((status) => (
                <div key={status.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.color }}
                  ></div>
                  <span
                    className="text-sm text-gray-600"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    {status.name}: {status.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performing Items Section */}
        <div className="mb-8">
          <h2
            className="text-2xl font-bold mb-6"
            style={{
              color: "#0C0A09",
              fontFamily: "Clash Display",
              fontWeight: 600,
            }}
          >
            Top Performing Items
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Most Liked Items */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3
                className="text-lg font-bold mb-4"
                style={{
                  color: "#0C0A09",
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                ❤️ Most Liked
              </h3>

              <div className="space-y-4">
                {analytics.topLikedItems &&
                analytics.topLikedItems.length > 0 ? (
                  analytics.topLikedItems.slice(0, 3).map((item) => (
                    <Link
                      key={item.itemId}
                      href={`/items/${item.itemId}`}
                      className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="relative w-16 h-16 flex-shrink-0 rounded bg-gray-200 overflow-hidden">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
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
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-sm truncate"
                          style={{
                            color: "#0C0A09",
                            fontFamily: "Clash Display",
                          }}
                        >
                          {item.title}
                        </p>
                        <p
                          className="text-xs text-gray-500 mt-1"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 400,
                          }}
                        >
                          ❤️ {item.likeCount || 0} likes
                        </p>
                        <p
                          className="text-xs text-gray-500"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 400,
                          }}
                        >
                          👁️ {item.viewCount || 0} views
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p
                    className="text-gray-500 text-sm"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    No liked items yet
                  </p>
                )}
              </div>
            </div>

            {/* Most Viewed Items */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3
                className="text-lg font-bold mb-4"
                style={{
                  color: "#0C0A09",
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                👁️ Most Viewed
              </h3>

              <div className="space-y-4">
                {analytics.topViewedItems &&
                analytics.topViewedItems.length > 0 ? (
                  analytics.topViewedItems.slice(0, 3).map((item) => (
                    <Link
                      key={item.itemId}
                      href={`/items/${item.itemId}`}
                      className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="relative w-16 h-16 flex-shrink-0 rounded bg-gray-200 overflow-hidden">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
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
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-sm truncate"
                          style={{
                            color: "#0C0A09",
                            fontFamily: "Clash Display",
                          }}
                        >
                          {item.title}
                        </p>
                        <p
                          className="text-xs text-gray-500 mt-1"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 400,
                          }}
                        >
                          👁️ {item.viewCount || 0} views
                        </p>
                        <p
                          className="text-xs text-green-600 font-semibold"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 500,
                          }}
                        >
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p
                    className="text-gray-500 text-sm"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    No views yet
                  </p>
                )}
              </div>
            </div>

            {/* Top Revenue Items */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3
                className="text-lg font-bold mb-4"
                style={{
                  color: "#0C0A09",
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                💰 Top Revenue
              </h3>

              <div className="space-y-4">
                {analytics.topRevenueItems &&
                analytics.topRevenueItems.length > 0 ? (
                  analytics.topRevenueItems.slice(0, 3).map((item) => (
                    <Link
                      key={item.itemId}
                      href={`/items/${item.itemId}`}
                      className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="relative w-16 h-16 flex-shrink-0 rounded bg-gray-200 overflow-hidden">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
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
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-sm truncate"
                          style={{
                            color: "#0C0A09",
                            fontFamily: "Clash Display",
                          }}
                        >
                          {item.title}
                        </p>
                        <p
                          className="text-xs text-gray-500 mt-1"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 400,
                          }}
                        >
                          Status: {item.status}
                        </p>
                        <p
                          className="text-xs text-green-600 font-bold"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 700,
                          }}
                        >
                          {formatCurrency((item.revenue || 0) * 0.9)}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p
                    className="text-gray-500 text-sm"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    No sales yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        {(analytics.lastItemPosted || analytics.lastSale) && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2
              className="text-xl font-bold mb-4"
              style={{
                color: "#0C0A09",
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              Recent Activity
            </h2>

            <div className="space-y-3">
              {analytics.lastItemPosted && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <p
                    style={{
                      color: "#0C0A09",
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    📤 Last item posted
                  </p>
                  <p
                    className="text-sm text-gray-600"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 500,
                    }}
                  >
                    {getTimeAgo(analytics.lastItemPosted)}
                  </p>
                </div>
              )}

              {analytics.lastSale && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <p
                    style={{
                      color: "#0C0A09",
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    💰 Last sale
                  </p>
                  <p
                    className="text-sm text-gray-600"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 500,
                    }}
                  >
                    {getTimeAgo(analytics.lastSale)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
