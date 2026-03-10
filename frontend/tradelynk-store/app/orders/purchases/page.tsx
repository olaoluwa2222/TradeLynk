"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ordersApi, paymentsApi } from "@/lib/api";
import { startChatWithSeller } from "@/lib/utils/chatHelpers";
import { useAuth } from "@/hooks/useAuth";
import DisputeModal from "@/components/DisputeModal";
import { OrderStatus } from "@/types/orders";

interface Order {
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
    imageUrls: string | string[];
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

export default function MyOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [chatLoading, setChatLoading] = useState<number | null>(null);
  const [disputeModalOrder, setDisputeModalOrder] = useState<Order | null>(
    null,
  );
  const [actionError, setActionError] = useState<string>("");
  const [actionSuccess, setActionSuccess] = useState<string>("");
  const [pendingPayments, setPendingPayments] = useState<
    Array<{
      reference: string;
      itemTitle: string;
      amount: number;
      createdAt: string;
    }>
  >([]);
  const [verifyingRef, setVerifyingRef] = useState<string | null>(null);

  // Check for pending unverified payments in localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("pendingPayments") || "[]",
      );
      const recent = stored.filter((p: any) => {
        const createdAt = new Date(p.createdAt).getTime();
        return Date.now() - createdAt < 24 * 60 * 60 * 1000;
      });
      if (recent.length > 0) {
        setPendingPayments(recent);
      }
    } catch (e) {}
  }, []);

  // Auto-verify pending payments when the page loads
  useEffect(() => {
    if (!isAuthenticated || pendingPayments.length === 0) return;

    const autoVerify = async () => {
      for (const payment of pendingPayments) {
        try {
          const response = await paymentsApi.verifyPayment(payment.reference);
          if (response.success) {
            // Payment was verified — remove from pending and refresh orders
            const stored = JSON.parse(
              localStorage.getItem("pendingPayments") || "[]",
            );
            const updated = stored.filter(
              (p: any) => p.reference !== payment.reference,
            );
            localStorage.setItem("pendingPayments", JSON.stringify(updated));
            setPendingPayments((prev) =>
              prev.filter((p) => p.reference !== payment.reference),
            );
            setActionSuccess(
              `Payment for "${payment.itemTitle}" was recovered and your order has been created!`,
            );
            // Refresh orders list
            try {
              const ordersResponse = await ordersApi.getMyPurchases(
                currentPage,
                10,
              );
              if (ordersResponse.success) {
                const ordersData = Array.isArray(ordersResponse.data)
                  ? ordersResponse.data
                  : ordersResponse.data.data || [];
                const filteredOrders =
                  filterStatus === "ALL"
                    ? ordersData
                    : ordersData.filter(
                        (order: Order) => order.status === filterStatus,
                      );
                setOrders(filteredOrders);
              }
            } catch (e) {}
          }
        } catch (e) {
          // Verification failed — payment might not have been completed, leave it in pending
        }
      }
    };

    autoVerify();
  }, [isAuthenticated, pendingPayments.length]);

  // Manual verify handler for pending payment banner
  const handleVerifyPending = async (reference: string) => {
    setVerifyingRef(reference);
    try {
      const response = await paymentsApi.verifyPayment(reference);
      if (response.success) {
        const stored = JSON.parse(
          localStorage.getItem("pendingPayments") || "[]",
        );
        const updated = stored.filter((p: any) => p.reference !== reference);
        localStorage.setItem("pendingPayments", JSON.stringify(updated));
        setPendingPayments((prev) =>
          prev.filter((p) => p.reference !== reference),
        );
        setActionSuccess("Payment verified! Your order has been created.");
        // Refresh orders
        const ordersResponse = await ordersApi.getMyPurchases(currentPage, 10);
        if (ordersResponse.success) {
          const ordersData = Array.isArray(ordersResponse.data)
            ? ordersResponse.data
            : ordersResponse.data.data || [];
          const filteredOrders =
            filterStatus === "ALL"
              ? ordersData
              : ordersData.filter(
                  (order: Order) => order.status === filterStatus,
                );
          setOrders(filteredOrders);
        }
      } else {
        setActionError(
          "Could not verify this payment. It may not have been completed, or try again in a few minutes.",
        );
      }
    } catch (err: any) {
      setActionError(
        err.response?.data?.message ||
          "Verification failed. Try again or visit Payment Recovery page.",
      );
    } finally {
      setVerifyingRef(null);
    }
  };

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/orders/purchases");
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        const response = await ordersApi.getMyPurchases(currentPage, 10);

        if (response.success) {
          // The API returns data array directly
          const ordersData = Array.isArray(response.data)
            ? response.data
            : response.data.data || [];

          // Apply filter
          const filteredOrders =
            filterStatus === "ALL"
              ? ordersData
              : ordersData.filter(
                  (order: Order) => order.status === filterStatus,
                );

          setOrders(filteredOrders);
          setTotalPages(response.totalPages || 1);
        } else {
          throw new Error(response.message || "Failed to load orders");
        }
      } catch (err: any) {
        console.error("Error fetching orders:", err);
        setError(err.message || "Failed to load your orders");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, authLoading, currentPage, filterStatus]);

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAYMENT_HELD":
      case "PROCESSING":
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          label: "📦 Processing",
        };
      case "SHIPPED":
        return {
          bg: "bg-purple-100",
          text: "text-purple-800",
          label: "🚚 On the way",
        };
      case "DELIVERED":
      case "COMPLETED":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          label: "✅ Delivered",
        };
      case "DISPUTED":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          label: "⚠️ Issue Raised",
        };
      case "REFUNDED":
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          label: "↩️ Refunded",
        };
      case "CANCELLED":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          label: "❌ Cancelled",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          label: status,
        };
    }
  };

  // Get progress step for order timeline (3-step: Ordered → Shipped → Delivered)
  const getProgressStep = (status: string): number => {
    switch (status) {
      case "PAYMENT_HELD":
      case "PROCESSING":
        return 1;
      case "SHIPPED":
        return 2;
      case "DELIVERED":
      case "COMPLETED":
        return 3;
      case "DISPUTED":
      case "REFUNDED":
      case "CANCELLED":
        return -1;
      default:
        return 0;
    }
  };

  // Handle dispute submission success
  const handleDisputeSuccess = () => {
    setDisputeModalOrder(null);
    setActionSuccess(
      "Your dispute has been submitted. We'll review it within 24-48 hours.",
    );
    // Refresh orders
    setTimeout(() => {
      window.location.reload();
    }, 2000);
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
            Loading your orders...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1
            className="text-4xl font-bold mb-2"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            My Orders
          </h1>
          <p
            className="text-gray-300"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            Track and manage your purchases
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success/Error Messages */}
        {actionSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p
              className="text-green-700 text-sm"
              style={{ fontFamily: "Clash Display", fontWeight: 500 }}
            >
              ✅ {actionSuccess}
            </p>
          </div>
        )}
        {actionError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p
              className="text-red-600 text-sm"
              style={{ fontFamily: "Clash Display", fontWeight: 500 }}
            >
              ❌ {actionError}
            </p>
          </div>
        )}

        {/* Pending Payments Banner */}
        {pendingPayments.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-300 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3
                className="font-bold text-yellow-900 flex items-center gap-2"
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                ⚠️ Unverified Payments Detected
              </h3>
              <Link
                href="/payment/recover"
                className="text-sm text-yellow-800 underline hover:text-yellow-900 font-semibold"
              >
                Payment Recovery →
              </Link>
            </div>
            <p className="text-yellow-800 text-sm mb-3">
              We found payments that weren&apos;t confirmed yet. If you
              completed these payments, click &quot;Verify&quot; to create your
              order.
            </p>
            <div className="space-y-2">
              {pendingPayments.map((p) => (
                <div
                  key={p.reference}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white rounded-lg p-3 border border-yellow-200 gap-2"
                >
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {p.itemTitle}
                    </p>
                    <p className="text-xs text-gray-500">
                      ₦{p.amount?.toLocaleString()} • Ref:{" "}
                      <span className="font-mono">{p.reference}</span> •{" "}
                      {new Date(p.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleVerifyPending(p.reference)}
                    disabled={!!verifyingRef}
                    className="px-4 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 font-semibold whitespace-nowrap"
                  >
                    {verifyingRef === p.reference
                      ? "Verifying..."
                      : "Verify Payment"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-3">
          {[
            { key: "ALL", label: "All Orders" },
            { key: "PROCESSING", label: "Processing" },
            { key: "SHIPPED", label: "On the Way" },
            { key: "COMPLETED", label: "Delivered" },
            { key: "CANCELLED", label: "Cancelled" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                filterStatus === key
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">📦</div>
            <h2
              className="text-2xl font-bold text-black mb-4"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              No Orders Yet
            </h2>
            <p
              className="text-gray-600 mb-8"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              Start shopping to see your orders here
            </p>
            <Link
              href="/items"
              className="inline-block px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              Browse Items
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusBadge = getStatusBadge(order.status);

              // Parse imageUrls if it's a string
              let imageUrl = "/placeholder.jpg";
              try {
                if (typeof order.item.imageUrls === "string") {
                  const urls = JSON.parse(order.item.imageUrls);
                  imageUrl =
                    Array.isArray(urls) && urls.length > 0
                      ? urls[0]
                      : "/placeholder.jpg";
                } else if (Array.isArray(order.item.imageUrls)) {
                  imageUrl =
                    order.item.imageUrls.length > 0
                      ? order.item.imageUrls[0]
                      : "/placeholder.jpg";
                }
              } catch (e) {
                console.error("Error parsing image URLs:", e);
              }

              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Item Image */}
                    <div className="relative w-full md:w-32 h-32 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={order.item.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Order Details */}
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
                            Order #{order.id}
                          </p>
                          <h3
                            className="text-xl font-bold text-black mb-2"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 700,
                            }}
                          >
                            {order.item.title}
                          </h3>
                          <p
                            className="text-sm text-gray-600 mb-2"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          >
                            Seller: {order.seller.name}
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

                      {/* Order Progress Tracker */}
                      {getProgressStep(order.status) > 0 && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            {[
                              "Payment",
                              "Shipped",
                              "Delivered",
                              "Completed",
                            ].map((step, index) => {
                              const currentStep = getProgressStep(order.status);
                              const stepNumber = index + 1;
                              const isCompleted = stepNumber < currentStep;
                              const isCurrent = stepNumber === currentStep;
                              const isPending = stepNumber > currentStep;

                              return (
                                <div key={step} className="flex items-center">
                                  <div className="flex flex-col items-center">
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                        isCompleted
                                          ? "bg-green-500 text-white"
                                          : isCurrent
                                            ? "bg-black text-white"
                                            : "bg-gray-200 text-gray-500"
                                      }`}
                                    >
                                      {isCompleted ? "✓" : stepNumber}
                                    </div>
                                    <span
                                      className={`text-xs mt-1 ${
                                        isCompleted || isCurrent
                                          ? "text-black font-semibold"
                                          : "text-gray-400"
                                      }`}
                                      style={{
                                        fontFamily: "Clash Display",
                                        fontWeight: isCurrent ? 600 : 400,
                                      }}
                                    >
                                      {step}
                                    </span>
                                  </div>
                                  {index < 3 && (
                                    <div
                                      className={`w-8 md:w-12 h-0.5 mx-1 ${
                                        stepNumber < currentStep
                                          ? "bg-green-500"
                                          : "bg-gray-200"
                                      }`}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Cancellation / Refund notice */}
                      {(order.status === "CANCELLED" ||
                        order.status === "REFUNDED") && (
                        <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <p
                            className="text-sm text-gray-700"
                            style={{ fontFamily: "Clash Display", fontWeight: 500 }}
                          >
                            {order.status === "REFUNDED"
                              ? "↩️ A refund has been processed for this order."
                              : `❌ This order was cancelled.${
                                  order.cancellationReason
                                    ? " Reason: " + order.cancellationReason
                                    : ""
                                }`}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p
                            className="text-xs text-gray-500 mb-1"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          >
                            Amount Paid
                          </p>
                          <p
                            className="text-lg font-bold text-black"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 700,
                            }}
                          >
                            ₦{order.amount.toLocaleString()}
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
                            Order Date
                          </p>
                          <p
                            className="text-sm text-black"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 500,
                            }}
                          >
                            {new Date(order.createdAt).toLocaleDateString()}
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
                            Delivery Address
                          </p>
                          <p
                            className="text-sm text-black"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 500,
                            }}
                          >
                            {order.deliveryAddress}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">

                        <Link
                          href={`/orders/${order.id}`}
                          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-semibold"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 600,
                          }}
                        >
                          View Details →
                        </Link>
                        <button
                          onClick={async () => {
                            try {
                              setChatLoading(order.id);
                              await startChatWithSeller(
                                order.item.id,
                                order.seller.id,
                                router,
                              );
                            } catch (err: any) {
                              console.error("Error starting chat:", err);
                              setActionError(
                                err.message ||
                                  "Failed to start chat. Please try again.",
                              );
                            } finally {
                              setChatLoading(null);
                            }
                          }}
                          disabled={chatLoading === order.id}
                          className="px-6 py-2 border-2 border-black text-black rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 600,
                          }}
                        >
                          {chatLoading === order.id ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full inline-block mr-2"></div>
                              Loading...
                            </>
                          ) : (
                            <>💬 Message Seller</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dispute Modal */}
        {disputeModalOrder && (
          <DisputeModal
            orderId={disputeModalOrder.id}
            itemTitle={disputeModalOrder.item.title}
            onClose={() => setDisputeModalOrder(null)}
            onSuccess={handleDisputeSuccess}
          />
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
