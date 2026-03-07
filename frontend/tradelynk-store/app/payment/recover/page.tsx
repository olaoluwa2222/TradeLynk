"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { paymentsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface PendingPayment {
  reference: string;
  itemId: number;
  itemTitle: string;
  amount: number;
  createdAt: string;
  paymentUrl?: string;
}

interface VerificationResult {
  success: boolean;
  message: string;
  orderId?: number;
  itemTitle?: string;
  amount?: number;
}

export default function PaymentRecoveryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [manualReference, setManualReference] = useState("");
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/payment/recover");
    }
  }, [isAuthenticated, authLoading, router]);

  // Load pending payments from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("pendingPayments") || "[]",
      );
      // Only show payments from the last 24 hours
      const recent = stored.filter((p: PendingPayment) => {
        const createdAt = new Date(p.createdAt).getTime();
        const now = Date.now();
        return now - createdAt < 24 * 60 * 60 * 1000; // 24 hours
      });
      setPendingPayments(recent);
    } catch (e) {
      setPendingPayments([]);
    }
  }, []);

  const verifyReference = async (reference: string) => {
    if (!reference.trim()) {
      setError("Please enter a payment reference");
      return;
    }

    setVerifying(reference);
    setError("");
    setResult(null);

    try {
      const response = await paymentsApi.verifyPayment(reference.trim());

      if (response.success) {
        setResult({
          success: true,
          message: response.message || "Payment verified successfully!",
          orderId: response.data?.orderId,
          itemTitle: response.data?.itemTitle,
          amount: response.data?.amount,
        });

        // Remove from pending payments
        try {
          const stored = JSON.parse(
            localStorage.getItem("pendingPayments") || "[]",
          );
          const updated = stored.filter(
            (p: PendingPayment) => p.reference !== reference,
          );
          localStorage.setItem("pendingPayments", JSON.stringify(updated));
          setPendingPayments((prev) =>
            prev.filter((p) => p.reference !== reference),
          );
        } catch (e) {}
      } else {
        setError(
          response.message ||
            "Payment could not be verified. It may still be processing — please try again in a few minutes.",
        );
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Verification failed. Please try again or contact support.";
      setError(msg);
    } finally {
      setVerifying(null);
    }
  };

  const clearPendingPayment = (reference: string) => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("pendingPayments") || "[]",
      );
      const updated = stored.filter(
        (p: PendingPayment) => p.reference !== reference,
      );
      localStorage.setItem("pendingPayments", JSON.stringify(updated));
      setPendingPayments((prev) =>
        prev.filter((p) => p.reference !== reference),
      );
    } catch (e) {}
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🔍</div>
          <h1
            className="text-4xl font-bold text-black mb-3"
            style={{ fontFamily: "Clash Display", fontWeight: 700 }}
          >
            Payment Recovery
          </h1>
          <p
            className="text-gray-600 text-lg max-w-lg mx-auto"
            style={{ fontFamily: "Clash Display", fontWeight: 400 }}
          >
            Made a payment but can&apos;t see your order? Enter your Paystack
            reference below and we&apos;ll verify it.
          </p>
        </div>

        {/* Success Result */}
        {result?.success && (
          <div className="bg-green-50 border border-green-300 rounded-2xl p-6 mb-8 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h2
              className="text-2xl font-bold text-green-900 mb-2"
              style={{ fontFamily: "Clash Display", fontWeight: 700 }}
            >
              Payment Verified!
            </h2>
            <p className="text-green-800 mb-1">{result.message}</p>
            {result.orderId && (
              <p className="text-green-700 font-semibold">
                Order #{result.orderId} — {result.itemTitle}
              </p>
            )}
            {result.amount && (
              <p className="text-green-600 text-xl font-bold mt-2">
                ₦{result.amount.toLocaleString()}
              </p>
            )}
            <Link
              href="/orders/purchases"
              className="inline-block mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              📦 View My Orders →
            </Link>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Manual Reference Input */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2
            className="text-xl font-bold text-black mb-4"
            style={{ fontFamily: "Clash Display", fontWeight: 700 }}
          >
            Enter Payment Reference
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            You can find this in your Paystack email receipt or bank statement.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={manualReference}
              onChange={(e) => setManualReference(e.target.value)}
              placeholder="e.g. eqxzc7sqgj"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-mono text-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter") verifyReference(manualReference);
              }}
            />
            <button
              onClick={() => verifyReference(manualReference)}
              disabled={!!verifying || !manualReference.trim()}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              style={{ fontFamily: "Clash Display", fontWeight: 600 }}
            >
              {verifying === manualReference ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Verifying...
                </span>
              ) : (
                "Verify Payment"
              )}
            </button>
          </div>
        </div>

        {/* Pending Payments from localStorage */}
        {pendingPayments.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
            <h2
              className="text-xl font-bold text-black mb-2"
              style={{ fontFamily: "Clash Display", fontWeight: 700 }}
            >
              Recent Pending Payments
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              These payments were initiated but we haven&apos;t confirmed they
              were completed yet.
            </p>
            <div className="space-y-3">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.reference}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl gap-3"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {payment.itemTitle}
                    </p>
                    <p className="text-sm text-gray-600">
                      ₦{payment.amount?.toLocaleString()} •{" "}
                      <span className="font-mono text-xs">
                        {payment.reference}
                      </span>{" "}
                      • {new Date(payment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => verifyReference(payment.reference)}
                      disabled={!!verifying}
                      className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 font-semibold"
                    >
                      {verifying === payment.reference ? (
                        <span className="flex items-center gap-1">
                          <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                          Verifying
                        </span>
                      ) : (
                        "Verify"
                      )}
                    </button>
                    <button
                      onClick={() => clearPendingPayment(payment.reference)}
                      className="px-3 py-2 text-gray-400 hover:text-red-500 text-sm transition-colors"
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3
            className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2"
            style={{ fontFamily: "Clash Display", fontWeight: 700 }}
          >
            💡 What could have happened?
          </h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">•</span>
              Your browser may have closed before we could confirm the payment
              with our server.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">•</span>
              There may have been a temporary network issue during verification.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">•</span>
              Paystack may still be processing the payment — try again in a few
              minutes.
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-blue-800 text-sm">
              If the problem persists, contact us at{" "}
              <a
                href="mailto:tradelynk.commerce@gmail.com"
                className="font-bold underline"
              >
                tradelynk.commerce@gmail.com
              </a>{" "}
              with your payment reference and we&apos;ll resolve it immediately.
            </p>
          </div>
        </div>

        {/* Back Links */}
        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/orders/purchases"
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-semibold"
            style={{ fontFamily: "Clash Display", fontWeight: 600 }}
          >
            📦 My Orders
          </Link>
          <Link
            href="/items"
            className="px-6 py-3 border-2 border-black text-black rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            style={{ fontFamily: "Clash Display", fontWeight: 600 }}
          >
            🛍️ Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
