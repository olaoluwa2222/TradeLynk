// app/verify/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

type VerificationState =
  | "loading"
  | "success"
  | "error"
  | "expired"
  | "already_verified";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyEmail, resendVerification } = useAuth();

  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setState("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    // Automatically verify on page load
    handleVerification(token);
  }, [searchParams]);

  const handleVerification = async (token: string) => {
    try {
      const response = await verifyEmail(token);
      setState("success");
      setMessage(response);
    } catch (error: any) {
      const errorMsg = error.message.toLowerCase();

      // Check for specific error types
      if (errorMsg.includes("expired") || errorMsg.includes("expire")) {
        setState("expired");
        setMessage("Verification link has expired. Please request a new one.");
      } else if (
        errorMsg.includes("already verified") ||
        errorMsg.includes("already been verified")
      ) {
        setState("already_verified");
        setMessage("Email already verified. You can now login.");
      } else {
        setState("error");
        setMessage(error.message || "Invalid verification link.");
      }
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);

    try {
      await resendVerification();
      alert("Verification email sent! Please check your inbox.");
    } catch (error: any) {
      alert(error.message || "Failed to resend verification email");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Loading State */}
          {state === "loading" && (
            <div className="text-center py-8">
              <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Verifying Your Email...
              </h3>
              <p className="text-gray-600">
                Please wait while we verify your email address.
              </p>
            </div>
          )}

          {/* Success State */}
          {state === "success" && (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg
                  className="mx-auto h-16 w-16 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ✅ Email Verified Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Your account has been verified. You can now login and start
                using Campus Marketplace.
              </p>
              <Link
                href="/login"
                className="inline-block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-center"
              >
                Go to Login
              </Link>
            </div>
          )}

          {/* Already Verified State */}
          {state === "already_verified" && (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg
                  className="mx-auto h-16 w-16 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ✅ Already Verified
              </h3>
              <p className="text-gray-600 mb-6">
                Your email has already been verified. Please login to continue.
              </p>
              <Link
                href="/login"
                className="inline-block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-center"
              >
                Go to Login
              </Link>
            </div>
          )}

          {/* Expired Token State */}
          {state === "expired" && (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg
                  className="mx-auto h-16 w-16 text-yellow-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ⚠️ Verification Link Expired
              </h3>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="w-full mb-3 py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors disabled:bg-yellow-300 disabled:cursor-not-allowed"
              >
                {resendLoading ? "Sending..." : "📧 Resend Verification Email"}
              </button>
              <Link
                href="/login"
                className="block w-full py-2 px-4 text-blue-600 hover:text-blue-700 font-medium text-center"
              >
                Back to Login
              </Link>
            </div>
          )}

          {/* Error State */}
          {state === "error" && (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg
                  className="mx-auto h-16 w-16 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ❌ Verification Failed
              </h3>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="w-full mb-3 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {resendLoading ? "Sending..." : "📧 Resend Verification Email"}
              </button>
              <Link
                href="/register"
                className="block w-full py-2 px-4 text-gray-600 hover:text-gray-700 font-medium text-center"
              >
                Back to Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
