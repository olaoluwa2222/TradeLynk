"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ordersApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Sale {
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

  // Check if user is seller
  const isSeller =
    user?.role === "SELLER" || user?.role === "BOTH" || user?.role === "ADMIN";

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

          // Calculate total revenue (only delivered orders)
          const revenue = salesData
            .filter((sale: Sale) => sale.status === "DELIVERED")
            .reduce((sum: number, sale: Sale) => sum + sale.amount, 0);

          // Seller gets 90% (after 10% commission)
          setTotalRevenue(revenue * 0.9);
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

            {/* Total Revenue Card */}
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
                    Total Revenue (90%)
                  </p>
                  <p
                    className="text-4xl font-bold"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 700,
                    }}
                  >
                    ₦{(totalRevenue || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-6xl opacity-20">💰</div>
              </div>
            </div>

            {/* Delivered Orders Card */}
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
                    Delivered Orders
                  </p>
                  <p
                    className="text-5xl font-bold"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 700,
                    }}
                  >
                    {sales.filter((s) => s.status === "DELIVERED").length}
                  </p>
                </div>
                <div className="text-6xl opacity-20">✅</div>
              </div>
            </div>
          </div>
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
                  ? "All Sales"
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
              const sellerRevenue = sale.amount * 0.9; // 90% after commission

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
                    <div className="relative w-full md:w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
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
                            Your Revenue (90%)
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

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">
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
