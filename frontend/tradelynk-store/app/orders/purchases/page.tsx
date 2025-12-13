"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ordersApi } from "@/lib/api";
import { startChatWithSeller } from "@/lib/utils/chatHelpers";
import { useAuth } from "@/hooks/useAuth";

interface Order {
  id: number;
  amount: number;
  deliveryAddress: string;
  status: "PENDING_DELIVERY" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  deliveredAt?: string;
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
                  (order: Order) => order.status === filterStatus
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
      case "PENDING_DELIVERY":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          label: "⏳ Pending Delivery",
        };
      case "DELIVERED":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          label: "✅ Delivered",
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
        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-3">
          {["ALL", "PENDING_DELIVERY", "DELIVERED", "CANCELLED"].map(
            (status) => (
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
                  ? "All Orders"
                  : status === "PENDING_DELIVERY"
                  ? "Pending"
                  : status === "DELIVERED"
                  ? "Delivered"
                  : "Cancelled"}
              </button>
            )
          )}
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
                    <div className="relative w-full md:w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
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
                                router
                              );
                            } catch (err: any) {
                              console.error("Error starting chat:", err);
                              alert(
                                err.message ||
                                  "Failed to start chat. Please try again."
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
