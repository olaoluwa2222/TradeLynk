"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ordersApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface OrderDetail {
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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const isBuyer = user && order && user.userId === order.buyer.id;
  const isSeller = user && order && user.userId === order.seller.id;

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/orders/${orderId}`);
    }
  }, [isAuthenticated, authLoading, router, orderId]);

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !isAuthenticated) return;

      try {
        setLoading(true);
        const response = await ordersApi.getOrderById(Number(orderId));

        if (response.success) {
          setOrder(response.data);
        } else {
          throw new Error(response.message || "Failed to load order");
        }
      } catch (err: any) {
        console.error("Error fetching order:", err);
        setError(err.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      fetchOrder();
    }
  }, [orderId, isAuthenticated, authLoading]);

  // Mark as delivered
  const handleMarkDelivered = async () => {
    if (!order || !isBuyer) return;

    if (!confirm("Confirm that you have received this item?")) return;

    try {
      setActionLoading(true);
      const response = await ordersApi.markAsDelivered(order.id);

      if (response.success) {
        setOrder({
          ...order,
          status: "DELIVERED",
          deliveredAt: new Date().toISOString(),
        });
        alert("✅ Order marked as delivered!");
      } else {
        throw new Error(response.message || "Failed to mark as delivered");
      }
    } catch (err: any) {
      console.error("Error marking as delivered:", err);
      alert(err.message || "Failed to update order status");
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel order
  const handleCancelOrder = async () => {
    if (!order) return;

    const reason = prompt("Please provide a reason for cancellation:");
    if (!reason) return;

    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      setActionLoading(true);
      const response = await ordersApi.cancelOrder(order.orderId, reason);

      if (response.success) {
        setOrder({ ...order, status: "CANCELLED" });
        alert("❌ Order cancelled");
      } else {
        throw new Error(response.message || "Failed to cancel order");
      }
    } catch (err: any) {
      console.error("Error cancelling order:", err);
      alert(err.message || "Failed to cancel order");
    } finally {
      setActionLoading(false);
    }
  };

  // Get status badge
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
        return { bg: "bg-gray-100", text: "text-gray-800", label: status };
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
            style={{ fontFamily: "Clash Display", fontWeight: 400 }}
          >
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="text-6xl mb-6">⚠️</div>
            <h1
              className="text-3xl font-bold text-black mb-4"
              style={{ fontFamily: "Clash Display", fontWeight: 700 }}
            >
              Order Not Found
            </h1>
            <p
              className="text-gray-600 mb-8"
              style={{ fontFamily: "Clash Display", fontWeight: 400 }}
            >
              {error || "The order you're looking for doesn't exist"}
            </p>
            <Link
              href={isSeller ? "/orders/sales" : "/orders/purchases"}
              className="inline-block px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(order.status);
  const sellerRevenue = isSeller ? order.amount * 0.9 : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={isSeller ? "/orders/sales" : "/orders/purchases"}
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-4"
            style={{ fontFamily: "Clash Display", fontWeight: 500 }}
          >
            ← Back to {isSeller ? "Sales" : "Orders"}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-3xl font-bold"
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                Order #{order.orderId}
              </h1>
              <p
                className="text-gray-300 mt-2"
                style={{ fontFamily: "Clash Display", fontWeight: 400 }}
              >
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <span
              className={`px-6 py-3 rounded-full text-sm font-semibold ${statusBadge.bg} ${statusBadge.text}`}
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              {statusBadge.label}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Item Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2
                className="text-xl font-bold text-black mb-4"
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                Item Details
              </h2>
              <div className="flex gap-6">
                <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={(() => {
                      try {
                        if (typeof order.item.imageUrls === "string") {
                          const urls = JSON.parse(order.item.imageUrls);
                          return Array.isArray(urls) && urls.length > 0
                            ? urls[0]
                            : "/placeholder.jpg";
                        }
                        return "/placeholder.jpg";
                      } catch {
                        return "/placeholder.jpg";
                      }
                    })()}
                    alt={order.item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3
                    className="text-lg font-bold text-black mb-2"
                    style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                  >
                    {order.item.title}
                  </h3>
                  <p
                    className="text-2xl font-bold text-black"
                    style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                  >
                    ₦{(order.item.price || 0).toLocaleString()}
                  </p>
                  <Link
                    href={`/items/${order.item.id}`}
                    className="mt-4 inline-block text-sm text-blue-600 hover:underline"
                    style={{ fontFamily: "Clash Display", fontWeight: 500 }}
                  >
                    View Item →
                  </Link>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2
                className="text-xl font-bold text-black mb-4"
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                Delivery Information
              </h2>
              <div className="space-y-4">
                <div>
                  <p
                    className="text-sm text-gray-600 mb-1"
                    style={{ fontFamily: "Clash Display", fontWeight: 500 }}
                  >
                    Delivery Address
                  </p>
                  <p
                    className="text-black"
                    style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                  >
                    {order.deliveryAddress}
                  </p>
                </div>
                {order.deliveredAt && (
                  <div>
                    <p
                      className="text-sm text-gray-600 mb-1"
                      style={{ fontFamily: "Clash Display", fontWeight: 500 }}
                    >
                      Delivered On
                    </p>
                    <p
                      className="text-black"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      {new Date(order.deliveredAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2
                className="text-xl font-bold text-black mb-4"
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                {isBuyer ? "Seller" : "Buyer"} Information
              </h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
                  <span className="text-white font-bold">
                    {(isBuyer ? order.seller.name : order.buyer.name)
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
                <div>
                  <p
                    className="font-bold text-black"
                    style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                  >
                    {isBuyer ? order.seller.name : order.buyer.name}
                  </p>
                  <p
                    className="text-sm text-gray-600"
                    style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                  >
                    {isBuyer ? order.seller.email : order.buyer.email}
                  </p>
                </div>
              </div>
              <Link
                href={`/chat?${
                  isBuyer
                    ? `sellerId=${order.seller.id}`
                    : `buyerId=${order.buyer.id}`
                }&itemId=${order.item.id}`}
                className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 font-semibold"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                💬 Send Message
              </Link>
            </div>
          </div>

          {/* Right - Payment & Actions */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2
                className="text-xl font-bold text-black mb-4"
                style={{ fontFamily: "Clash Display", fontWeight: 700 }}
              >
                Payment Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <p
                    className="text-gray-600"
                    style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                  >
                    Item Price
                  </p>
                  <p
                    className="font-semibold"
                    style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                  >
                    ₦{order.amount.toLocaleString()}
                  </p>
                </div>
                {isSeller && sellerRevenue && (
                  <>
                    <div className="flex justify-between text-sm">
                      <p
                        className="text-gray-500"
                        style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                      >
                        Platform Fee (10%)
                      </p>
                      <p
                        className="text-gray-500"
                        style={{ fontFamily: "Clash Display", fontWeight: 500 }}
                      >
                        -₦{(order.amount * 0.1).toLocaleString()}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-gray-200 flex justify-between">
                      <p
                        className="font-bold text-black"
                        style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                      >
                        Your Revenue
                      </p>
                      <p
                        className="font-bold text-green-600 text-xl"
                        style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                      >
                        ₦{sellerRevenue.toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            {order.status === "PENDING_DELIVERY" && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2
                  className="text-xl font-bold text-black mb-4"
                  style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                >
                  Actions
                </h2>
                <div className="space-y-3">
                  {isBuyer && (
                    <button
                      onClick={handleMarkDelivered}
                      disabled={actionLoading}
                      className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      {actionLoading ? "Processing..." : "✅ Mark as Delivered"}
                    </button>
                  )}
                  <button
                    onClick={handleCancelOrder}
                    disabled={actionLoading}
                    className="w-full py-3 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                  >
                    {actionLoading ? "Processing..." : "❌ Cancel Order"}
                  </button>
                </div>
              </div>
            )}

            {/* Help */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3
                className="font-bold text-blue-900 mb-2"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                Need Help?
              </h3>
              <p
                className="text-sm text-blue-800 mb-4"
                style={{ fontFamily: "Clash Display", fontWeight: 400 }}
              >
                Contact support for any issues with this order
              </p>
              <a
                href="mailto:support@campus-marketplace.com"
                className="text-sm text-blue-600 hover:underline font-semibold"
                style={{ fontFamily: "Clash Display", fontWeight: 600 }}
              >
                support@campus-marketplace.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
