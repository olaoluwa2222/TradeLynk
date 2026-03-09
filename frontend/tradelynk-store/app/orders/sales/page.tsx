"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ordersApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { OrderStatus } from "@/types/orders";

interface Sale {
  id: number;
  amount: number;
  deliveryAddress: string;
  status: OrderStatus;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  disputedAt?: string;
  refundedAt?: string;
  autoCompletedAt?: string;
  cancellationReason?: string;
  item: {
    id: number;
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    imageUrls: string;
  };
  buyer: {
    id: number;
    name: string;
    email: string;
    profilePictureUrl?: string;
  };
  seller: {
    id: number;
    name: string;
    email: string;
    profilePictureUrl?: string;
  };
  payment: {
    id: number;
    paystackReference: string;
    status: string;
    paidAt: string;
  };
}

export default function MySalesPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingRevenue, setPendingRevenue] = useState(0);
  const [markingShipped, setMarkingShipped] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string>("");
  const [actionSuccess, setActionSuccess] = useState<string>("");

  // No platform fee — sellers receive 100% of the sale amount

  // Check if user is seller
  const isSeller =
    user?.role === "SELLER" || user?.role === "BOTH" || user?.role === "ADMIN";

  // Clear messages after 5 seconds
  useEffect(() => {
    if (actionError || actionSuccess) {
      const timer = setTimeout(() => {
        setActionError("");
        setActionSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [actionError, actionSuccess]);

  // Redirect if not seller
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/orders/sales");
    } else if (!authLoading && isAuthenticated && !isSeller) {
      router.push("/become-a-seller");
    }
  }, [isAuthenticated, authLoading, isSeller, router]);

  // Fetch sales
  useEffect(() => {
    const fetchSales = async () => {
      if (!isAuthenticated || !isSeller) return;

      try {
        setLoading(true);
        const response = await ordersApi.getMySales(currentPage, 10);

        console.log("Sales response:", response);

        if (response.success) {
          // The API returns data array directly
          const salesData = Array.isArray(response.data)
            ? response.data
            : response.data.data || [];

          // Apply filter
          const filteredSales =
            filterStatus === "ALL"
              ? salesData
              : salesData.filter((sale: Sale) => sale.status === filterStatus);

          setSales(filteredSales);
          setTotalPages(response.totalPages || 1);

          // Calculate total revenue (only COMPLETED orders - money actually paid out)
          const completedRevenue = salesData
            .filter((sale: Sale) => sale.status === "COMPLETED")
            .reduce((sum: number, sale: Sale) => sum + sale.amount, 0);

          // order.amount is NAIRA — no commission deduction
          setTotalRevenue(completedRevenue);

          // Calculate pending revenue (SHIPPED, DELIVERED — awaiting completion)
          const pendingAmount = salesData
            .filter(
              (sale: Sale) =>
                sale.status === "PAYMENT_HELD" ||
                sale.status === "SHIPPED" ||
                sale.status === "DELIVERED",
            )
            .reduce((sum: number, sale: Sale) => sum + sale.amount, 0);

          setPendingRevenue(pendingAmount);
        } else {
          throw new Error(response.message || "Failed to load sales");
        }
      } catch (err: any) {
        console.error("Error fetching sales:", err);
        setError(err.message || "Failed to load your sales");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && isAuthenticated && isSeller) {
      fetchSales();
    }
  }, [isAuthenticated, authLoading, isSeller, currentPage, filterStatus]);

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAYMENT_HELD":
        return {
          bg: "bg-amber-100",
          text: "text-amber-800",
          label: "💰 Payment Held",
        };
      case "SHIPPED":
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          label: "🚚 Shipped",
        };
      case "DELIVERED":
        return {
          bg: "bg-emerald-100",
          text: "text-emerald-800",
          label: "✅ Delivered",
        };
      case "COMPLETED":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          label: "💸 Completed",
        };
      case "DISPUTED":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          label: "⚠️ Disputed",
        };
      case "REFUNDED":
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          label: "💵 Refunded",
        };
      case "CANCELLED":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          label: "❌ Cancelled",
        };
      case "PENDING_DELIVERY":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          label: "⏳ Pending Delivery",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          label: status,
        };
    }
  };

  // Get payment status for display
  const getPaymentStatus = (status: string) => {
    switch (status) {
      case "PAYMENT_HELD":
      case "SHIPPED":
        return { label: "💰 In Escrow", color: "text-amber-600" };
      case "DELIVERED":
        return { label: "⏳ Pending Release", color: "text-blue-600" };
      case "COMPLETED":
        return { label: "✅ Paid Out", color: "text-green-600" };
      case "DISPUTED":
        return { label: "⚠️ On Hold", color: "text-red-600" };
      case "REFUNDED":
        return { label: "💸 Refunded", color: "text-gray-600" };
      case "CANCELLED":
        return { label: "❌ Cancelled", color: "text-gray-600" };
      default:
        return { label: "Unknown", color: "text-gray-600" };
    }
  };

  // Calculate days until auto-complete (5 days from shipped date)
  const getDaysUntilAutoComplete = (shippedAt?: string) => {
    if (!shippedAt) return null;
    const shippedDate = new Date(shippedAt);
    const autoCompleteDate = new Date(
      shippedDate.getTime() + 5 * 24 * 60 * 60 * 1000,
    );
    const now = new Date();
    const daysRemaining = Math.ceil(
      (autoCompleteDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysRemaining > 0 ? daysRemaining : 0;
  };

  // Handle mark as shipped
  const handleMarkAsShipped = async (orderId: number) => {
    setMarkingShipped(orderId);
    setActionError("");
    setActionSuccess("");

    try {
      const response = await ordersApi.markAsShipped(orderId);
      if (response.success) {
        setActionSuccess(
          "Order marked as shipped! The buyer has been notified.",
        );
        // Update order status locally
        setSales((prev) =>
          prev.map((sale) =>
            sale.id === orderId
              ? {
                  ...sale,
                  status: "SHIPPED" as OrderStatus,
                  shippedAt: new Date().toISOString(),
                }
              : sale,
          ),
        );
        // Refresh after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(response.message || "Failed to mark as shipped");
      }
    } catch (err: any) {
      console.error("Error marking as shipped:", err);
      setActionError(
        err.message || "Failed to mark as shipped. Please try again.",
      );
    } finally {
      setMarkingShipped(null);
    }
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
          <p
            className="text-gray-600"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            Loading your sales...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Stats - Black & White Design */}
      <div className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1
            className="text-5xl font-bold mb-8"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            My Sales
          </h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Sales Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-white/70 text-sm uppercase tracking-wider mb-2"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 500,
                    }}
                  >
                    Total Sales
                  </p>
                  <p
                    className="text-5xl font-bold"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 700,
                    }}
                  >
                    {sales.length}
                  </p>
                </div>
                <div className="text-6xl opacity-20">📦</div>
              </div>
            </div>

            {/* Paid Out (Completed) Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-white/70 text-sm uppercase tracking-wider mb-2"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 500,
                    }}
                  >
                    Revenue Earned
                  </p>
                  <p
                    className="text-4xl font-bold text-green-400"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 700,
                    }}
                  >
                    ₦{(totalRevenue || 0).toLocaleString()}
                  </p>
                  <p
                    className="text-white/50 text-xs mt-1"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    {sales.filter((s) => s.status === "COMPLETED").length}{" "}
                    completed orders
                  </p>
                </div>
                <div className="text-6xl opacity-20">💰</div>
              </div>
            </div>

            {/* Held in Escrow Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-white/70 text-sm uppercase tracking-wider mb-2"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 500,
                    }}
                  >
                    In Escrow
                  </p>
                  <p
                    className="text-4xl font-bold text-amber-400"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 700,
                    }}
                  >
                    ₦{(pendingRevenue || 0).toLocaleString()}
                  </p>
                  <p
                    className="text-white/50 text-xs mt-1"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    {
                      sales.filter((s) =>
                        ["PAYMENT_HELD", "SHIPPED", "DELIVERED"].includes(
                          s.status,
                        ),
                      ).length
                    }{" "}
                    pending orders
                  </p>
                </div>
                <div className="text-6xl opacity-20">⏳</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Action Messages */}
        {actionSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p
              className="text-green-700"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 500,
              }}
            >
              ✅ {actionSuccess}
            </p>
          </div>
        )}
        {actionError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p
              className="text-red-700"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 500,
              }}
            >
              ❌ {actionError}
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-3">
          {[
            "ALL",
            "PAYMENT_HELD",
            "SHIPPED",
            "DELIVERED",
            "COMPLETED",
            "DISPUTED",
          ].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                filterStatus === status
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              {status === "ALL"
                ? "All Sales"
                : status === "PAYMENT_HELD"
                  ? "💰 Payment Held"
                  : status === "SHIPPED"
                    ? "🚚 Shipped"
                    : status === "DELIVERED"
                      ? "✅ Delivered"
                      : status === "COMPLETED"
                        ? "💸 Completed"
                        : "⚠️ Disputed"}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Sales List */}
        {sales.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">💰</div>
            <h2
              className="text-2xl font-bold text-black mb-4"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              No Sales Yet
            </h2>
            <p
              className="text-gray-600 mb-8"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              Start listing items to see your sales here
            </p>
            <Link
              href="/items/create"
              className="inline-block px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              Post Item
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {sales.map((sale) => {
              const statusBadge = getStatusBadge(sale.status);
              const paymentStatus = getPaymentStatus(sale.status);
              const sellerRevenue = sale.amount; // sale.amount is NAIRA, no commission
              const daysRemaining = getDaysUntilAutoComplete(sale.shippedAt);

              // Parse imageUrls if it's a string
              let imageUrl = "/placeholder.jpg";
              try {
                if (typeof sale.item.imageUrls === "string") {
                  const urls = JSON.parse(sale.item.imageUrls);
                  imageUrl =
                    Array.isArray(urls) && urls.length > 0
                      ? urls[0]
                      : "/placeholder.jpg";
                }
              } catch (e) {
                console.error("Error parsing image URLs:", e);
              }

              return (
                <div
                  key={sale.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Item Image */}
                    <div className="relative w-full md:w-32 h-32 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={sale.item.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Sale Details */}
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                        <div>
                          <p
                            className="text-xs text-gray-500 mb-1"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          >
                            Sale #{sale.id}
                          </p>
                          <h3
                            className="text-xl font-bold text-black mb-2"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 700,
                            }}
                          >
                            {sale.item.title}
                          </h3>
                          <p
                            className="text-sm text-gray-600 mb-2"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          >
                            Buyer: {sale.buyer.name}
                          </p>
                        </div>
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-semibold ${statusBadge.bg} ${statusBadge.text}`}
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 600,
                          }}
                        >
                          {statusBadge.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p
                            className="text-xs text-gray-500 mb-1"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          >
                            Sale Amount
                          </p>
                          <p
                            className="text-lg font-bold text-black"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 700,
                            }}
                          >
                            ₦{sale.amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-xs text-gray-500 mb-1"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          >
                            You&apos;ll Get
                          </p>
                          <p
                            className="text-lg font-bold text-green-600"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 700,
                            }}
                          >
                            ₦{sellerRevenue.toLocaleString()}
                          </p>
                          <p
                            className={`text-xs mt-1 ${paymentStatus.color}`}
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 500,
                            }}
                          >
                            {paymentStatus.label}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-xs text-gray-500 mb-1"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          >
                            Sale Date
                          </p>
                          <p
                            className="text-sm text-black"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 500,
                            }}
                          >
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-xs text-gray-500 mb-1"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          >
                            Delivery To
                          </p>
                          <p
                            className="text-sm text-black"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 500,
                            }}
                          >
                            {sale.deliveryAddress}
                          </p>
                        </div>
                      </div>

                      {/* Auto-complete countdown for shipped orders */}
                      {sale.status === "SHIPPED" && daysRemaining !== null && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p
                            className="text-sm text-blue-700"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 500,
                            }}
                          >
                            ⏳ Auto-completes in {daysRemaining} day
                            {daysRemaining !== 1 ? "s" : ""} if buyer
                            doesn&apos;t confirm
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">
                        {/* Mark as Shipped button for PAYMENT_HELD orders */}
                        {sale.status === "PAYMENT_HELD" && (
                          <button
                            onClick={() => handleMarkAsShipped(sale.id)}
                            disabled={markingShipped === sale.id}
                            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 600,
                            }}
                          >
                            {markingShipped === sale.id ? (
                              <>
                                <span className="animate-spin">⏳</span>
                                Marking...
                              </>
                            ) : (
                              "📦 Mark as Shipped"
                            )}
                          </button>
                        )}
                        <Link
                          href={`/orders/${sale.id}`}
                          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-semibold"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 600,
                          }}
                        >
                          View Details →
                        </Link>
                        <Link
                          href={`/chat?buyerId=${sale.buyer.id}&itemId=${sale.item.id}`}
                          className="px-6 py-2 border-2 border-black text-black rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 600,
                          }}
                        >
                          💬 Message Buyer
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              ← Previous
            </button>
            <span
              className="px-4 py-2"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 500,
              }}
            >
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={currentPage >= totalPages - 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
