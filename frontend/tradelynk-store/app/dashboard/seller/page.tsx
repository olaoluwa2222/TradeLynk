// app/dashboard/seller/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import { analyticsApi, ordersApi, sellersApi } from "@/lib/api";
import { getSellerFullUrl, getDisplayUrl } from "@/lib/utils/sellerUrls";
import Link from "next/link";
import Image from "next/image";
import { ProductsTable } from "@/components/product";
import { CollectionManager } from "@/components/collections";
import { DashboardLayout } from "@/components/dashboard";
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

type DashboardTab = "overview" | "products" | "collections" | "analytics";

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

/* Skeleton loaders */
const StatCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
    <div className="h-3 bg-gray-200 rounded w-20 mb-3"></div>
    <div className="h-7 bg-gray-200 rounded w-28 mb-3"></div>
    <div className="h-2.5 bg-gray-200 rounded w-32"></div>
  </div>
);

export default function SellerDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    markStorefrontCreated,
    markFirstProductAdded,
    isOnboardingComplete,
    getOnboardingProgress,
    state: onboardingState,
  } = useOnboarding();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [sales, setSales] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [sellerUsername, setSellerUsername] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isSeller =
    user?.role === "SELLER" || user?.role === "BOTH" || user?.role === "ADMIN";

  // Mark storefront as created when user is a seller
  useEffect(() => {
    if (isSeller) {
      markStorefrontCreated();
    }
  }, [isSeller, markStorefrontCreated]);

  // Check if onboarding should show (only if not all complete)
  useEffect(() => {
    if (!isOnboardingComplete()) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [isOnboardingComplete, onboardingState]);

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

        const analyticsResponse = await analyticsApi.getSellerAnalytics();
        if (analyticsResponse.success && analyticsResponse.data) {
          setAnalytics(analyticsResponse.data);
          if (analyticsResponse.data.totalItemsPosted > 0) {
            markFirstProductAdded();
          }
        }

        try {
          const profileResponse = await sellersApi.getMySellerProfile();
          if (profileResponse.success && profileResponse.data?.username) {
            setSellerUsername(profileResponse.data.username);
          }
        } catch (err) {
          console.error("Error fetching seller profile:", err);
        }

        const salesResponse = await ordersApi.getMySales(0, 100);
        if (salesResponse.success && Array.isArray(salesResponse.data)) {
          setSales(
            salesResponse.data.filter(
              (order: any) =>
                order.status === "DELIVERED" ||
                order.status === "COMPLETED" ||
                order.status === "PAID",
            ),
          );
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(
          "Failed to load dashboard data. Please check your connection and try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, isSeller]);

  // Process revenue data
  const processRevenueData = (): RevenueDataPoint[] => {
    if (!sales || sales.length === 0) return [];
    const revenueByDate: { [key: string]: number } = {};
    sales.forEach((order) => {
      const date = new Date(order.createdAt).toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
      });
      if (!revenueByDate[date]) revenueByDate[date] = 0;
      revenueByDate[date] += order.amount; // order.amount is NAIRA
    });
    return Object.entries(revenueByDate)
      .map(([date, revenue]) => ({ date, revenue: Math.round(revenue) }))
      .slice(-30);
  };

  const getEngagementData = () => {
    if (!analytics) return [];
    return [
      { name: "Likes", value: analytics.totalLikes, color: "#0C0A09" },
      { name: "Views", value: analytics.totalViews, color: "#4B5563" },
      { name: "Chats", value: analytics.totalChats, color: "#9CA3AF" },
      { name: "Sales", value: analytics.totalSales, color: "#E5E7EB" },
    ];
  };

  const getStatusData = () => {
    if (!analytics) return [];
    return [
      { name: "Active", value: analytics.activeItems, color: "#0C0A09" },
      { name: "Sold", value: analytics.soldItems, color: "#6B7280" },
      { name: "Hidden", value: analytics.hiddenItems, color: "#D1D5DB" },
    ];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

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

  const handleCopyLink = async () => {
    if (!sellerUsername) return;
    const link = getSellerFullUrl(sellerUsername);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  // Onboarding steps
  const isEmailVerified = user?.isEmailVerified || user?.verified || false;
  const onboardingSteps = [
    {
      id: "account",
      label: "Account created",
      completed: true,
      icon: "&#128100;",
      action: null,
    },
    {
      id: "email",
      label: "Email verified",
      completed: isEmailVerified,
      icon: "&#9993;",
      action: !isEmailVerified
        ? { label: "Verify Email", href: "/verify" }
        : null,
    },
    {
      id: "store",
      label: "Store created",
      completed: isSeller || onboardingState.hasStorefront,
      icon: "&#127760;",
      action: !(isSeller || onboardingState.hasStorefront)
        ? { label: "Create Store", href: "/become-a-seller" }
        : null,
    },
    {
      id: "product",
      label: "First product added",
      completed: onboardingState.hasFirstProduct,
      icon: "&#128722;",
      action: !onboardingState.hasFirstProduct
        ? { label: "Add Product", href: "/create-item" }
        : null,
    },
    {
      id: "share",
      label: "Share your link",
      completed: onboardingState.hasSharedLink,
      icon: "&#128279;",
      action:
        !onboardingState.hasSharedLink && sellerUsername
          ? {
              label: copiedLink ? "Copied!" : "Copy Link",
              onClick: handleCopyLink,
            }
          : null,
    },
  ];

  const completedSteps = onboardingSteps.filter((s) => s.completed).length;
  const progressPercent = Math.round(
    (completedSteps / onboardingSteps.length) * 100,
  );

  /* ========================
     LOADING STATE
     ======================== */
  if (authLoading || (loading && !analytics)) {
    return (
      <DashboardLayout
        sellerUsername={sellerUsername}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t as DashboardTab)}
      >
        <div className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 h-72 animate-pulse">
              <div className="h-full bg-gray-100 rounded" />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 h-72 animate-pulse">
              <div className="h-full bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* ========================
     ERROR STATE
     ======================== */
  if (error) {
    return (
      <DashboardLayout sellerUsername={sellerUsername}>
        <div className="flex items-center justify-center min-h-[60vh] px-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
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
            </div>
            <h2
              className="text-xl font-bold text-black mb-2"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              Unable to Load Dashboard
            </h2>
            <p
              className="text-gray-600 mb-6 text-sm"
              style={{ fontFamily: "Clash Display", fontWeight: 400 }}
            >
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              disabled={retrying}
              className="px-6 py-2.5 bg-black text-white text-sm rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              {retrying ? "Retrying..." : "Try Again"}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* ========================
     NO DATA STATE
     ======================== */
  if (!analytics) {
    return (
      <DashboardLayout sellerUsername={sellerUsername}>
        <div className="flex items-center justify-center min-h-[60vh] px-6">
          <div className="max-w-md w-full text-center">
            <div className="text-5xl mb-4">&#128640;</div>
            <h2
              className="text-xl font-bold text-black mb-2"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              Let&apos;s get started!
            </h2>
            <p
              className="text-gray-600 mb-6 text-sm"
              style={{ fontFamily: "Clash Display", fontWeight: 400 }}
            >
              Post your first item to see analytics and performance metrics
            </p>
            <Link
              href="/create-item"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
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
              Add Your First Product
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const revenueData = processRevenueData();
  const engagementData = getEngagementData();
  const statusData = getStatusData();
  const netRevenue = analytics.totalRevenue; // totalRevenue is already in NAIRA, no commission

  /* ========================
     MAIN DASHBOARD
     ======================== */
  return (
    <DashboardLayout
      sellerUsername={sellerUsername}
      activeTab={activeTab}
      onTabChange={(t) => setActiveTab(t as DashboardTab)}
    >
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Collections Tab */}
        {activeTab === "collections" && user && (
          <CollectionManager
            sellerId={user.userId}
            sellerUsername={sellerUsername || ""}
          />
        )}

        {/* Products Tab */}
        {activeTab === "products" && <ProductsTable />}

        {/* Analytics Tab */}
        {activeTab === "analytics" && analytics && (
          <div className="space-y-6">
            {/* Revenue Chart — Full Width */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
              <h3
                className="text-lg font-bold text-black mb-5"
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                Revenue Over Time
              </h3>
              {processRevenueData().length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={processRevenueData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      style={{ fontSize: 11, fontFamily: "Clash Display" }}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      style={{ fontSize: 11, fontFamily: "Clash Display" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontFamily: "Clash Display",
                      }}
                      formatter={(value: any) => [
                        formatCurrency(value as number),
                        "Revenue",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#7C3AED"
                      strokeWidth={2.5}
                      dot={{ fill: "#7C3AED", r: 3 }}
                      activeDot={{ r: 5, fill: "#7C3AED" }}
                      name="Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
                  <p
                    className="text-gray-400 text-sm"
                    style={{ fontFamily: "Clash Display" }}
                  >
                    No sales data yet
                  </p>
                </div>
              )}
            </div>

            {/* Engagement + Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
                <h3
                  className="text-lg font-bold text-black mb-5"
                  style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                >
                  Engagement Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={getEngagementData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis
                      dataKey="name"
                      stroke="#9CA3AF"
                      style={{ fontSize: 11, fontFamily: "Clash Display" }}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      style={{ fontSize: 11, fontFamily: "Clash Display" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontFamily: "Clash Display",
                      }}
                    />
                    <Bar dataKey="value" name="Count" radius={[8, 8, 0, 0]}>
                      {getEngagementData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            ["#7C3AED", "#A78BFA", "#C4B5FD", "#DDD6FE"][index]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
                <h3
                  className="text-lg font-bold text-black mb-5"
                  style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                >
                  Item Status
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={getStatusData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) =>
                        `${name} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getStatusData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={["#7C3AED", "#A78BFA", "#DDD6FE"][index]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontFamily: "Clash Display",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 flex flex-wrap gap-4 justify-center">
                  {getStatusData().map((status, i) => (
                    <div key={status.name} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: ["#7C3AED", "#A78BFA", "#DDD6FE"][i],
                        }}
                      />
                      <span
                        className="text-xs text-gray-600"
                        style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                      >
                        {status.name}: {status.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                {[
                  { label: "Total Views", value: analytics.totalViews },
                  { label: "Total Likes", value: analytics.totalLikes },
                  { label: "Conversations", value: analytics.totalChats },
                  { label: "Items Posted", value: analytics.totalItemsPosted },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p
                      className="text-2xl sm:text-3xl font-bold text-black"
                      style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                    >
                      {stat.value}
                    </p>
                    <p
                      className="text-xs text-gray-500 mt-1"
                      style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                    >
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Welcome banner — clean and minimal */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2
                  className="text-xl sm:text-2xl font-bold text-black"
                  style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                >
                  Good{" "}
                  {new Date().getHours() < 12
                    ? "morning"
                    : new Date().getHours() < 17
                      ? "afternoon"
                      : "evening"}
                  , {user?.name?.split(" ")[0]} &#128075;
                </h2>
                <p
                  className="text-gray-500 text-sm mt-0.5"
                  style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                >
                  Here&apos;s what&apos;s happening with your store today
                </p>
              </div>
              <Link
                href="/create-item"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-purple-200"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add product
              </Link>
            </div>

            {/* Onboarding checklist - only if incomplete */}
            {showOnboarding && completedSteps < onboardingSteps.length && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-base font-bold text-black"
                      style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                    >
                      &#127919; Getting Started
                    </h3>
                    <p
                      className="text-xs text-gray-500 mt-0.5"
                      style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                    >
                      {completedSteps}/{onboardingSteps.length} Complete
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-sm font-bold text-black"
                      style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                    >
                      {progressPercent}%
                    </span>
                    <button
                      onClick={() => setShowOnboarding(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-gray-100 rounded-full mb-5 overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Steps */}
                <div className="space-y-2">
                  {onboardingSteps.map((step, i) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                        step.completed
                          ? "bg-green-50"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                          step.completed
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {step.completed ? (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <span
                            className="text-xs font-bold"
                            style={{ fontFamily: "Clash Display" }}
                          >
                            {i + 1}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-sm flex-1 ${step.completed ? "text-green-700 line-through" : "text-black font-medium"}`}
                        style={{
                          fontFamily: "Clash Display",
                          fontWeight: step.completed ? 400 : 500,
                        }}
                      >
                        {step.label}
                      </span>
                      {step.action &&
                        !step.completed &&
                        (step.action.hasOwnProperty("onClick") ? (
                          <button
                            onClick={(step.action as any).onClick}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-900 transition-colors"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 600,
                            }}
                          >
                            {(step.action as any).label}
                          </button>
                        ) : (
                          <Link
                            href={(step.action as any).href || "#"}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-900 transition-colors"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 600,
                            }}
                          >
                            {(step.action as any).label}
                          </Link>
                        ))}
                    </div>
                  ))}
                </div>

                {/* All done message */}
                {completedSteps === onboardingSteps.length && (
                  <div
                    className="mt-4 p-3 bg-green-500 text-white text-center rounded-lg text-sm font-semibold"
                    style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                  >
                    &#127881; All done! You&apos;re ready to sell!
                  </div>
                )}
              </div>
            )}

            {/* Store Link CTA — compact inline bar */}
            {sellerUsername && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg
                      className="w-4.5 h-4.5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-[11px] text-gray-500 font-medium uppercase tracking-wider"
                      style={{ fontFamily: "Clash Display", fontWeight: 500 }}
                    >
                      Your store
                    </p>
                    <p
                      className="text-sm font-bold text-black truncate"
                      style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                    >
                      {getDisplayUrl(sellerUsername)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopyLink}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      copiedLink
                        ? "bg-green-500 text-white"
                        : "bg-purple-600 hover:bg-purple-700 text-white"
                    }`}
                    style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                  >
                    {copiedLink ? (
                      <>
                        <svg
                          className="w-3.5 h-3.5"
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
                        Copied
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                  <a
                    href={`https://wa.me/?text=Shop%20my%20store%20on%20Tradelynk%3A%20${encodeURIComponent(getSellerFullUrl(sellerUsername))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-green-500 hover:bg-green-600 text-white transition-colors"
                    style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Share
                  </a>
                  <a
                    href={getSellerFullUrl(sellerUsername)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:border-purple-600 hover:text-purple-600 transition-colors"
                    style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Open
                  </a>
                </div>
              </div>
            )}
            {/* Stats Cards — Shopify-style grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                {
                  label: "Revenue",
                  value: formatCurrency(netRevenue),
                  sub: "Total revenue earned",
                  iconBg: "bg-purple-100",
                  icon: (
                    <svg
                      className="w-4 h-4 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ),
                  featured: true,
                },
                {
                  label: "Sales",
                  value: analytics.totalSales.toString(),
                  sub: "Completed orders",
                  iconBg: "bg-green-100",
                  icon: (
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                  ),
                },
                {
                  label: "Active Items",
                  value: analytics.activeItems.toString(),
                  sub: "Currently listed",
                  iconBg: "bg-blue-100",
                  icon: (
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  ),
                },
                {
                  label: "Conversion",
                  value: `${(analytics.conversionRate * 100).toFixed(1)}%`,
                  sub: "Views to sales",
                  iconBg: "bg-amber-100",
                  icon: (
                    <svg
                      className="w-4 h-4 text-amber-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  ),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`rounded-2xl p-4 sm:p-5 transition-all duration-200 ${
                    stat.featured
                      ? "bg-black text-white"
                      : "bg-white border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p
                      className={`text-xs sm:text-sm ${stat.featured ? "text-gray-400" : "text-gray-500"}`}
                      style={{ fontFamily: "Clash Display", fontWeight: 500 }}
                    >
                      {stat.label}
                    </p>
                    <div
                      className={`w-8 h-8 ${stat.featured ? "bg-white/10" : stat.iconBg} rounded-xl flex items-center justify-center`}
                    >
                      {stat.icon}
                    </div>
                  </div>
                  <p
                    className={`text-xl sm:text-2xl font-bold ${stat.featured ? "text-white" : "text-black"}`}
                    style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                  >
                    {stat.value}
                  </p>
                  <p
                    className={`text-[10px] sm:text-xs mt-1.5 ${stat.featured ? "text-gray-500" : "text-gray-400"}`}
                    style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                  >
                    {stat.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* Revenue Chart + Item Status — side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
              <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
                <h3
                  className="text-base font-bold text-black mb-4"
                  style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                >
                  Revenue Over Time
                </h3>
                {revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        style={{ fontSize: 11, fontFamily: "Clash Display" }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        style={{ fontSize: 11, fontFamily: "Clash Display" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #E5E7EB",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontFamily: "Clash Display",
                        }}
                        formatter={(value: any) => [
                          formatCurrency(value as number),
                          "Revenue",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#7C3AED"
                        strokeWidth={2.5}
                        dot={{ fill: "#7C3AED", r: 3 }}
                        activeDot={{ r: 5, fill: "#7C3AED" }}
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-56 flex items-center justify-center bg-gray-50 rounded-xl">
                    <p
                      className="text-gray-400 text-sm"
                      style={{ fontFamily: "Clash Display" }}
                    >
                      No sales data yet
                    </p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
                <h3
                  className="text-base font-bold text-black mb-4"
                  style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                >
                  Item Status
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) =>
                        `${name} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={65}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={["#7C3AED", "#A78BFA", "#DDD6FE"][index]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontFamily: "Clash Display",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap gap-4 justify-center">
                  {statusData.map((status, i) => (
                    <div key={status.name} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: ["#7C3AED", "#A78BFA", "#DDD6FE"][i],
                        }}
                      />
                      <span
                        className="text-xs text-gray-600"
                        style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                      >
                        {status.name}: {status.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Performing Items — 3 equal columns */}
            <div>
              <h3
                className="text-base font-bold text-black mb-4"
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                Top Performing Items
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    title: "Most Liked",
                    icon: "❤️",
                    items: analytics.topLikedItems,
                    metric: (item: TopItem) =>
                      `${item.likeCount || 0} likes · ${item.viewCount || 0} views`,
                    empty: "No liked items yet",
                  },
                  {
                    title: "Most Viewed",
                    icon: "👁️",
                    items: analytics.topViewedItems,
                    metric: (item: TopItem) =>
                      `${item.viewCount || 0} views · ${formatCurrency(item.price / 100)}`, // item.price is KOBO
                    empty: "No views yet",
                  },
                  {
                    title: "Top Revenue",
                    icon: "💰",
                    items: analytics.topRevenueItems,
                    metric: (item: TopItem) =>
                      formatCurrency(item.revenue || 0), // item.revenue is NAIRA
                    empty: "No sales yet",
                    metricColor: "text-green-600 font-semibold",
                  },
                ].map((section) => (
                  <div
                    key={section.title}
                    className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5"
                  >
                    <h4
                      className="text-sm font-bold text-black mb-3 flex items-center gap-2"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      <span>{section.icon}</span> {section.title}
                    </h4>
                    <div className="space-y-2.5">
                      {section.items && section.items.length > 0 ? (
                        section.items.slice(0, 3).map((item: TopItem) => (
                          <Link
                            key={item.itemId}
                            href={`/items/${item.itemId}`}
                            className="flex gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
                          >
                            <div className="relative w-10 h-10 shrink-0 rounded-lg bg-gray-100 overflow-hidden">
                              {item.imageUrl ? (
                                <Image
                                  src={item.imageUrl}
                                  alt={item.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                  📷
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-medium text-black truncate"
                                style={{ fontFamily: "Clash Display" }}
                              >
                                {item.title}
                              </p>
                              <p
                                className={`text-xs ${section.metricColor || "text-gray-500"}`}
                                style={{
                                  fontFamily: "Clash Display",
                                  fontWeight: section.metricColor ? 600 : 400,
                                }}
                              >
                                {section.metric(item)}
                              </p>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <p
                          className="text-gray-400 text-xs py-2"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 400,
                          }}
                        >
                          {section.empty}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            {(analytics.lastItemPosted || analytics.lastSale) && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
                <h3
                  className="text-base font-bold text-black mb-3"
                  style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                >
                  Recent Activity
                </h3>
                <div className="space-y-2">
                  {analytics.lastItemPosted && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </div>
                        <p
                          className="text-sm text-black"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 500,
                          }}
                        >
                          Last item posted
                        </p>
                      </div>
                      <p
                        className="text-xs text-gray-500 font-medium"
                        style={{ fontFamily: "Clash Display", fontWeight: 500 }}
                      >
                        {getTimeAgo(analytics.lastItemPosted)}
                      </p>
                    </div>
                  )}
                  {analytics.lastSale && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <p
                          className="text-sm text-black"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 500,
                          }}
                        >
                          Last sale
                        </p>
                      </div>
                      <p
                        className="text-xs text-gray-500 font-medium"
                        style={{ fontFamily: "Clash Display", fontWeight: 500 }}
                      >
                        {getTimeAgo(analytics.lastSale)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
