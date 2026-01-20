// app/reset-password/page.tsx
"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authApi } from "@/lib/api";

type ResetState =
  | "loading"
  | "invalid_token"
  | "expired_token"
  | "used_token"
  | "ready"
  | "submitting"
  | "success"
  | "error";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [state, setState] = useState<ResetState>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });

  const images = [
    "/2304.i203.047.S.m004.c13.keys locks realistic.jpg",
    "/11190420.jpg",
    "/cybersecurity-breach-concept-with-shattered-padlock (1).jpg",
  ];

  // Image carousel effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setState("invalid_token");
      setMessage(
        "No reset token provided. Please request a new password reset link.",
      );
      return;
    }

    verifyToken(token);
  }, [token]);

  // Check password strength
  useEffect(() => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    });
  }, [password]);

  const verifyToken = async (token: string) => {
    try {
      const response = await authApi.verifyResetToken(token);
      if (response.data.valid) {
        setState("ready");
        setEmail(response.data.email);
      } else {
        setState("invalid_token");
        setMessage("This reset link is invalid.");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "";

      if (errorMessage.toLowerCase().includes("expired")) {
        setState("expired_token");
        setMessage(
          "This password reset link has expired. Please request a new one.",
        );
      } else if (
        errorMessage.toLowerCase().includes("already been used") ||
        errorMessage.toLowerCase().includes("already used")
      ) {
        setState("used_token");
        setMessage("This password reset link has already been used.");
      } else {
        setState("invalid_token");
        setMessage("This reset link is invalid or has expired.");
      }
    }
  };

  const isPasswordValid = () => {
    return (
      passwordStrength.hasMinLength &&
      passwordStrength.hasUppercase &&
      passwordStrength.hasLowercase &&
      passwordStrength.hasNumber
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");

    // Validation
    if (!password || !confirmPassword) {
      setMessage("Please fill in all fields");
      setState("error");
      return;
    }

    if (!isPasswordValid()) {
      setMessage("Please ensure your password meets all requirements");
      setState("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setState("error");
      return;
    }

    setState("submitting");

    try {
      await authApi.resetPassword(token!, password);
      setState("success");
    } catch (err: any) {
      setState("error");
      setMessage(
        err.response?.data?.message ||
          err.message ||
          "Failed to reset password. Please try again.",
      );
    }
  };

  const getStrengthPercentage = () => {
    const checks = Object.values(passwordStrength).filter(Boolean).length;
    return (checks / 4) * 100;
  };

  const getStrengthColor = () => {
    const percentage = getStrengthPercentage();
    if (percentage === 100) return "bg-green-500";
    if (percentage >= 75) return "bg-yellow-500";
    if (percentage >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  // Render error states
  const renderErrorState = () => {
    const isExpired = state === "expired_token";
    const isUsed = state === "used_token";

    return (
      <div className="space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div
            className={`w-20 h-20 rounded-full ${isExpired ? "bg-amber-100" : "bg-red-100"} flex items-center justify-center`}
          >
            {isExpired ? (
              <svg
                className="w-10 h-10 text-amber-600"
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
            ) : isUsed ? (
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            ) : (
              <svg
                className="w-10 h-10 text-red-600"
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
            )}
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center">
          <h3
            className="text-xl font-semibold text-gray-900 mb-2"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 600,
            }}
          >
            {isExpired
              ? "Link Expired"
              : isUsed
                ? "Link Already Used"
                : "Invalid Link"}
          </h3>
          <p
            className="text-gray-600 text-sm"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/forgot-password"
            className="block w-full py-3.5 px-4 bg-black hover:bg-gray-900 text-white font-semibold rounded-xl transition-colors text-center"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 600,
            }}
          >
            Request New Reset Link
          </Link>
          <Link
            href="/login"
            className="block w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-colors text-center"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 500,
            }}
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  };

  // Render success state
  const renderSuccessState = () => (
    <div className="space-y-6">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          {/* Pulse effect */}
          <div className="absolute inset-0 w-20 h-20 rounded-full bg-green-100 animate-ping opacity-25"></div>
        </div>
      </div>

      {/* Success Message */}
      <div className="text-center">
        <h3
          className="text-2xl font-bold text-gray-900 mb-2"
          style={{
            fontFamily: "Clash Display",
            fontWeight: 700,
          }}
        >
          Password Reset Successfully!
        </h3>
        <p
          className="text-gray-600 text-sm"
          style={{
            fontFamily: "Clash Display",
            fontWeight: 400,
          }}
        >
          Your password has been updated. You can now sign in with your new
          password.
        </p>
      </div>

      {/* Security Tips */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-green-600 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <div>
            <p
              className="text-sm text-green-800"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              <strong>Security tip:</strong> If you didn't request this password
              reset, please contact support immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Sign In Button */}
      <Link
        href="/login"
        className="block w-full py-3.5 px-4 bg-black hover:bg-gray-900 text-white font-semibold rounded-xl transition-all shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 text-center"
        style={{
          fontFamily: "Clash Display",
          fontWeight: 600,
        }}
      >
        Sign In Now
      </Link>
    </div>
  );

  // Render loading state
  const renderLoadingState = () => (
    <div className="text-center py-12">
      <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-black border-r-transparent mb-4"></div>
      <h3
        className="text-lg font-semibold text-gray-900 mb-2"
        style={{
          fontFamily: "Clash Display",
          fontWeight: 600,
        }}
      >
        Verifying Reset Link...
      </h3>
      <p
        className="text-gray-600 text-sm"
        style={{
          fontFamily: "Clash Display",
          fontWeight: 400,
        }}
      >
        Please wait while we verify your password reset link.
      </p>
    </div>
  );

  // Render form state
  const renderFormState = () => (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* User Email Display */}
      <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <div>
          <p
            className="text-xs text-gray-500"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            Resetting password for
          </p>
          <p
            className="text-sm font-medium text-gray-900"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 500,
            }}
          >
            {email}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {state === "error" && message && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            {message}
          </span>
        </div>
      )}

      {/* New Password Input */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-2"
          style={{
            fontFamily: "Clash Display",
            fontWeight: 500,
          }}
        >
          New Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (state === "error") {
                setState("ready");
                setMessage("");
              }
            }}
            placeholder="Enter new password"
            className="w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white text-black placeholder-gray-400"
            disabled={state === "submitting"}
            autoComplete="new-password"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {password && (
          <div className="mt-3 space-y-2">
            {/* Strength Bar */}
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                style={{ width: `${getStrengthPercentage()}%` }}
              />
            </div>

            {/* Requirements Checklist */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div
                className={`flex items-center gap-2 text-xs ${passwordStrength.hasMinLength ? "text-green-600" : "text-gray-400"}`}
              >
                {passwordStrength.hasMinLength ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
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
                )}
                <span style={{ fontFamily: "Clash Display", fontWeight: 400 }}>
                  8+ characters
                </span>
              </div>
              <div
                className={`flex items-center gap-2 text-xs ${passwordStrength.hasUppercase ? "text-green-600" : "text-gray-400"}`}
              >
                {passwordStrength.hasUppercase ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
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
                )}
                <span style={{ fontFamily: "Clash Display", fontWeight: 400 }}>
                  Uppercase letter
                </span>
              </div>
              <div
                className={`flex items-center gap-2 text-xs ${passwordStrength.hasLowercase ? "text-green-600" : "text-gray-400"}`}
              >
                {passwordStrength.hasLowercase ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
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
                )}
                <span style={{ fontFamily: "Clash Display", fontWeight: 400 }}>
                  Lowercase letter
                </span>
              </div>
              <div
                className={`flex items-center gap-2 text-xs ${passwordStrength.hasNumber ? "text-green-600" : "text-gray-400"}`}
              >
                {passwordStrength.hasNumber ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
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
                )}
                <span style={{ fontFamily: "Clash Display", fontWeight: 400 }}>
                  Number
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password Input */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-2"
          style={{
            fontFamily: "Clash Display",
            fontWeight: 500,
          }}
        >
          Confirm New Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (state === "error") {
                setState("ready");
                setMessage("");
              }
            }}
            placeholder="Confirm new password"
            className={`w-full pl-12 pr-12 py-3.5 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white text-black placeholder-gray-400 ${
              confirmPassword && password !== confirmPassword
                ? "border-red-300"
                : confirmPassword && password === confirmPassword
                  ? "border-green-300"
                  : "border-gray-300"
            }`}
            disabled={state === "submitting"}
            autoComplete="new-password"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
        {/* Password Match Indicator */}
        {confirmPassword && (
          <div
            className={`flex items-center gap-2 mt-2 text-xs ${password === confirmPassword ? "text-green-600" : "text-red-500"}`}
          >
            {password === confirmPassword ? (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span style={{ fontFamily: "Clash Display", fontWeight: 400 }}>
                  Passwords match
                </span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
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
                <span style={{ fontFamily: "Clash Display", fontWeight: 400 }}>
                  Passwords don't match
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={
          state === "submitting" ||
          !isPasswordValid() ||
          password !== confirmPassword
        }
        className="w-full py-3.5 px-4 bg-black hover:bg-gray-900 text-white font-semibold rounded-xl transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20"
        style={{
          fontFamily: "Clash Display",
          fontWeight: 600,
        }}
      >
        {state === "submitting" ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Resetting Password...
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            Reset Password
          </>
        )}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen flex overflow-hidden bg-white">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 py-12">
        {/* Logo Icon - Top Right positioned (mobile) */}
        <div className="absolute top-6 right-6 lg:hidden">
          <Image
            src="/Logo Icon.png"
            alt="TradeLynk Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
        </div>

        {/* Form Container */}
        <div className="w-full max-w-md mx-auto">
          {/* Header - Only show for ready/submitting/error states */}
          {(state === "ready" ||
            state === "submitting" ||
            state === "error") && (
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black/5 mb-6">
                <svg
                  className="w-8 h-8 text-black"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <h2
                className="text-3xl sm:text-4xl font-bold text-black mb-3"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 700,
                }}
              >
                Create New Password
              </h2>
              <p
                className="text-gray-600 text-sm sm:text-base leading-relaxed"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Your new password must be different from previously used
                passwords.
              </p>
            </div>
          )}

          {/* Render based on state */}
          {state === "loading" && renderLoadingState()}
          {(state === "invalid_token" ||
            state === "expired_token" ||
            state === "used_token") &&
            renderErrorState()}
          {state === "success" && renderSuccessState()}
          {(state === "ready" || state === "submitting" || state === "error") &&
            renderFormState()}
        </div>
      </div>

      {/* Right Side - Image Carousel */}
      <div className="hidden lg:flex w-1/2 bg-gray-900 relative overflow-hidden items-center justify-center">
        {/* Logo Icon - Top Right */}
        <div className="absolute top-6 right-6 z-10">
          <Image
            src="/Logo Icon.png"
            alt="TradeLynk Logo"
            width={50}
            height={50}
            className="rounded-full"
          />
        </div>

        {/* Image Carousel */}
        <div className="relative w-full h-full">
          {images.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={image}
                alt={`Carousel image ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/40"></div>

          {/* Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-12 z-10">
            <div className="max-w-md">
              <h3
                className="text-3xl font-bold text-white mb-4"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 700,
                }}
              >
                Almost There!
              </h3>
              <p
                className="text-white/80 text-lg leading-relaxed"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Create a strong password to keep your account secure. Use a mix
                of letters, numbers, and symbols.
              </p>
            </div>
          </div>

          {/* Carousel Indicators */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex
                    ? "bg-white w-8"
                    : "bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense wrapper
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-black border-r-transparent mb-4"></div>
            <p
              className="text-gray-600"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
