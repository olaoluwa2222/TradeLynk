// components/onboarding/OnboardingChecklist.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/lib/hooks/useOnboarding";

interface OnboardingChecklistProps {
  variant?: "sidebar" | "floating" | "inline";
  sellerUsername?: string | null;
}

export default function OnboardingChecklist({
  variant = "inline",
  sellerUsername,
}: OnboardingChecklistProps) {
  const { user } = useAuth();
  const { state, getOnboardingProgress, markLinkShared } = useOnboarding();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const progress = getOnboardingProgress();

  // Determine which steps are completed
  const isEmailVerified = user?.isEmailVerified || user?.verified || false;
  const isSeller =
    user?.role === "SELLER" || user?.role === "BOTH" || user?.role === "ADMIN";

  const steps = [
    {
      id: "account",
      label: "Account created",
      completed: true, // Always true if they're seeing this
      action: null,
    },
    {
      id: "email",
      label: "Email verified",
      completed: isEmailVerified,
      action: !isEmailVerified ? { label: "Verify", href: "/verify" } : null,
    },
    {
      id: "website",
      label: "Website created",
      completed: isSeller || state.hasStorefront,
      action: !(isSeller || state.hasStorefront)
        ? { label: "Create", href: "/become-a-seller" }
        : null,
    },
    {
      id: "product",
      label: "First product added",
      completed: state.hasFirstProduct,
      action:
        !state.hasFirstProduct && (isSeller || state.hasStorefront)
          ? { label: "Add", href: "/create-item" }
          : null,
    },
    {
      id: "share",
      label: "Share your link",
      completed: state.hasSharedLink,
      action:
        !state.hasSharedLink &&
        (isSeller || state.hasStorefront) &&
        sellerUsername
          ? { label: "Copy", onClick: () => handleCopyLink() }
          : null,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;

  const handleCopyLink = async () => {
    if (!sellerUsername) return;

    const link = `${window.location.origin}/sellers/${sellerUsername}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      markLinkShared();
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  // Hide if all steps are completed
  useEffect(() => {
    if (completedCount >= totalCount) {
      const timer = setTimeout(() => setIsVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [completedCount, totalCount]);

  if (!isVisible) return null;

  // Floating variant (mobile)
  if (variant === "floating") {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        {/* Collapsed state */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center
                     hover:scale-105 active:scale-95 transition-transform relative"
          >
            <span className="text-lg">🎯</span>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {completedCount}
            </span>
          </button>
        )}

        {/* Expanded state */}
        {isExpanded && (
          <div className="w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-[slideUp_0.3s_ease-out]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <h4
                  className="font-bold text-black text-sm"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Getting Started
                </h4>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-4 pt-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  {completedCount}/{totalCount} Complete
                </span>
                <span
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  {progress.percentage}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="p-4 space-y-2">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`
                    flex items-center justify-between p-2 rounded-lg transition-colors
                    ${step.completed ? "bg-green-50" : "bg-gray-50"}
                  `}
                >
                  <div className="flex items-center gap-2">
                    {step.completed ? (
                      <span className="text-green-500">✅</span>
                    ) : (
                      <span className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center text-xs">
                        ⬜
                      </span>
                    )}
                    <span
                      className={`text-sm ${step.completed ? "text-gray-500 line-through" : "text-black"}`}
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: step.completed ? 400 : 500,
                      }}
                    >
                      {step.label}
                    </span>
                  </div>

                  {step.action &&
                    (step.action.href ? (
                      <Link
                        href={step.action.href}
                        className="px-2 py-1 bg-black text-white text-xs font-semibold rounded-md
                                 hover:bg-gray-800 transition-colors"
                        style={{
                          fontFamily: "Clash Display",
                          fontWeight: 600,
                        }}
                      >
                        {step.action.label}
                      </Link>
                    ) : (
                      <button
                        onClick={step.action.onClick}
                        className="px-2 py-1 bg-black text-white text-xs font-semibold rounded-md
                                 hover:bg-gray-800 transition-colors"
                        style={{
                          fontFamily: "Clash Display",
                          fontWeight: 600,
                        }}
                      >
                        {copiedLink && step.id === "share"
                          ? "Copied!"
                          : step.action.label}
                      </button>
                    ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Inline/Sidebar variant (desktop)
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <div>
            <h4
              className="font-bold text-black"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              Getting Started
            </h4>
            <p
              className="text-xs text-gray-600"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              {completedCount}/{totalCount} Complete
            </p>
          </div>
        </div>
        <div
          className="text-lg font-bold text-black"
          style={{
            fontFamily: "Clash Display",
            fontWeight: 700,
          }}
        >
          {progress.percentage}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-4">
        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="p-4 space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`
              flex items-center justify-between p-3 rounded-xl transition-all duration-300
              ${step.completed ? "bg-green-50 border border-green-100" : "bg-gray-50 border border-gray-100"}
            `}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            <div className="flex items-center gap-3">
              {step.completed ? (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
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
                </div>
              ) : (
                <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center text-gray-400 text-xs font-bold">
                  {index + 1}
                </div>
              )}
              <span
                className={`text-sm ${step.completed ? "text-gray-500" : "text-black font-medium"}`}
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: step.completed ? 400 : 500,
                }}
              >
                {step.label}
              </span>
            </div>

            {step.action &&
              (step.action.href ? (
                <Link
                  href={step.action.href}
                  className="px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-lg
                           hover:bg-gray-800 active:scale-95 transition-all"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  {step.action.label}
                </Link>
              ) : (
                <button
                  onClick={step.action.onClick}
                  className="px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-lg
                           hover:bg-gray-800 active:scale-95 transition-all"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  {copiedLink && step.id === "share"
                    ? "✓ Copied!"
                    : step.action.label}
                </button>
              ))}
          </div>
        ))}
      </div>

      {/* Completion message */}
      {completedCount >= totalCount && (
        <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center">
          <p
            className="font-bold"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 600,
            }}
          >
            🎉 All done! You're ready to sell!
          </p>
        </div>
      )}
    </div>
  );
}
