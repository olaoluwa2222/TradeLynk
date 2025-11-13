// components/UnverifiedBanner.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function UnverifiedBanner() {
  const { user, resendVerification } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Don't show if user is verified or banner is dismissed
  if (!user || user.verified || isDismissed) {
    return null;
  }

  const handleResend = async () => {
    setIsLoading(true);
    setShowSuccess(false);

    try {
      await resendVerification();
      setShowSuccess(true);

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    } catch (error: any) {
      alert(error.message || "Failed to resend verification email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              {showSuccess ? (
                <p className="text-sm font-medium text-green-700">
                  ✅ Verification email sent! Please check your inbox.
                </p>
              ) : (
                <p className="text-sm font-medium text-yellow-800">
                  ⚠️ Please verify your email to access all features. Check your
                  inbox or{" "}
                  <button
                    onClick={handleResend}
                    disabled={isLoading}
                    className="underline hover:text-yellow-900 font-semibold disabled:opacity-50"
                  >
                    {isLoading ? "sending..." : "resend verification email"}
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="flex-shrink-0 text-yellow-600 hover:text-yellow-800"
            aria-label="Dismiss"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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
    </div>
  );
}
