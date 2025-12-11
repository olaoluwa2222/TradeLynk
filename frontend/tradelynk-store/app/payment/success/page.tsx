"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { paymentsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface PaymentVerification {
  success: boolean;
  message: string;
  orderId?: number;
  itemTitle?: string;
  amount?: number;
  sellerName?: string;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const reference = searchParams.get("reference");

  const [verifying, setVerifying] = useState(true);
  const [verification, setVerification] = useState<PaymentVerification | null>(
    null
  );
  const [error, setError] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Verify payment on mount
  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) {
        setError("No payment reference provided");
        setVerifying(false);
        return;
      }

      try {
        setVerifying(true);
        const response = await paymentsApi.verifyPayment(reference);

        if (response.success) {
          setVerification({
            success: true,
            message: response.message || "Payment successful",
            orderId: response.data?.orderId,
            itemTitle: response.data?.itemTitle,
            amount: response.data?.amount,
            sellerName: response.data?.sellerName,
          });
        } else {
          throw new Error(response.message || "Payment verification failed");
        }
      } catch (err: any) {
        console.error("Payment verification error:", err);
        setError(err.message || "Failed to verify payment");
      } finally {
        setVerifying(false);
      }
    };

    if (reference && !authLoading && isAuthenticated) {
      verifyPayment();
    }
  }, [reference, authLoading, isAuthenticated]);

  // Loading state
  if (verifying || authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-black border-t-transparent rounded-full mx-auto mb-6"></div>
          <h2
            className="text-2xl font-bold text-black mb-2"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            Verifying Payment...
          </h2>
          <p
            className="text-gray-600"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            Please wait while we confirm your transaction
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !verification?.success) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="text-8xl mb-6">❌</div>
            <h1
              className="text-4xl font-bold text-black mb-4"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              Payment Verification Failed
            </h1>
            <p
              className="text-lg text-gray-600 mb-8"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              {error ||
                "We couldn't verify your payment. Please contact support."}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/items"
                className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Browse Items
              </Link>
              <Link
                href="/orders/purchases"
                className="px-8 py-3 border-2 border-black text-black rounded-lg hover:bg-gray-50 transition-colors"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                My Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Success Animation */}
        <div className="text-center mb-12">
          <div className="inline-block relative">
            <div className="text-8xl mb-6 animate-bounce">✅</div>
            <div className="absolute -top-4 -right-4">
              <div className="w-24 h-24 bg-green-100 rounded-full animate-ping opacity-75"></div>
            </div>
          </div>

          <h1
            className="text-5xl font-bold text-black mb-4"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            Payment Successful!
          </h1>
          <p
            className="text-xl text-gray-600"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            Your order has been placed successfully
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 mb-8 border border-green-200">
          <h2
            className="text-2xl font-bold text-black mb-6"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            Order Details
          </h2>

          <div className="space-y-4">
            {verification.orderId && (
              <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                <p
                  className="text-gray-600"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  Order ID
                </p>
                <p
                  className="font-bold text-black"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  #{verification.orderId}
                </p>
              </div>
            )}

            {verification.itemTitle && (
              <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                <p
                  className="text-gray-600"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  Item
                </p>
                <p
                  className="font-bold text-black text-right"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  {verification.itemTitle}
                </p>
              </div>
            )}

            {verification.amount && (
              <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                <p
                  className="text-gray-600"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  Amount Paid
                </p>
                <p
                  className="font-bold text-green-600 text-2xl"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  ₦{verification.amount.toLocaleString()}
                </p>
              </div>
            )}

            {verification.sellerName && (
              <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                <p
                  className="text-gray-600"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  Seller
                </p>
                <p
                  className="font-bold text-black"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  {verification.sellerName}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center p-4 bg-white rounded-lg">
              <p
                className="text-gray-600"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 500,
                }}
              >
                Payment Reference
              </p>
              <p
                className="font-mono text-sm text-gray-800"
                style={{
                  fontFamily: "monospace",
                  fontWeight: 500,
                }}
              >
                {reference}
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3
            className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            <span>📋</span>
            What's Next?
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">1.</span>
              <p
                className="text-blue-900"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                The seller has been notified and will contact you via chat to
                arrange delivery
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">2.</span>
              <p
                className="text-blue-900"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Check your "My Orders" page to track your order status
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">3.</span>
              <p
                className="text-blue-900"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                After receiving your item, mark it as "Delivered" to complete
                the transaction
              </p>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/orders/purchases"
            className="w-full py-4 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            📦 View My Orders
            <span>→</span>
          </Link>
          <Link
            href="/items"
            className="w-full py-4 border-2 border-black text-black font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            🛍️ Continue Shopping
          </Link>
        </div>

        {/* Support Info */}
        <div className="mt-8 text-center">
          <p
            className="text-sm text-gray-500"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            Need help? Contact us at{" "}
            <a
              href="mailto:support@campus-marketplace.com"
              className="text-black font-semibold hover:underline"
            >
              support@campus-marketplace.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
