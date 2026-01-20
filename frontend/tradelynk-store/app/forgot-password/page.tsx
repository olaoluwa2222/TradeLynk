// app/forgot-password/page.tsx
"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { authApi } from "@/lib/api";

type RequestState = "idle" | "loading" | "success" | "error";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<RequestState>("idle");
  const [message, setMessage] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");

    // Validation
    if (!email) {
      setMessage("Please enter your email address");
      setState("error");
      return;
    }

    if (!validateEmail(email)) {
      setMessage("Please enter a valid email address");
      setState("error");
      return;
    }

    setState("loading");

    try {
      await authApi.forgotPassword(email);
      setState("success");
      setMessage("Password reset instructions have been sent to your email.");
    } catch (err: any) {
      setState("error");
      // Don't reveal if email exists or not for security
      const errorMessage = err.response?.data?.message || err.message;
      if (
        errorMessage.includes("not found") ||
        errorMessage.includes("doesn't exist")
      ) {
        // Still show success message for security (don't reveal if email exists)
        setState("success");
        setMessage(
          "If this email exists in our system, you will receive password reset instructions shortly.",
        );
      } else {
        setMessage(errorMessage || "Something went wrong. Please try again.");
      }
    }
  };

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
          {/* Back to Login Link */}
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-gray-600 hover:text-black transition-colors mb-8 group"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            <svg
              className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Sign In
          </Link>

          {/* Header */}
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
              Forgot Password?
            </h2>
            <p
              className="text-gray-600 text-sm sm:text-base leading-relaxed"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              No worries! Enter your email address and we'll send you
              instructions to reset your password.
            </p>
          </div>

          {/* Success State */}
          {state === "success" ? (
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
                        d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
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
                  className="text-xl font-semibold text-gray-900 mb-2"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Check Your Email
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

              {/* Email Display */}
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p
                  className="text-sm text-gray-500 mb-1"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  We sent instructions to
                </p>
                <p
                  className="text-black font-medium"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  {email}
                </p>
              </div>

              {/* Tips */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
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
                  <div>
                    <p
                      className="text-sm text-amber-800"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      <strong>Didn't receive the email?</strong> Check your spam
                      folder or make sure you entered the correct email address.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setState("idle");
                    setMessage("");
                  }}
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-colors"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  Try Another Email
                </button>
                <Link
                  href="/login"
                  className="block w-full py-3 px-4 bg-black hover:bg-gray-900 text-white font-semibold rounded-xl transition-colors text-center"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-5">
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

              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  Email Address
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
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (state === "error") {
                        setState("idle");
                        setMessage("");
                      }
                    }}
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white text-black placeholder-gray-400"
                    disabled={state === "loading"}
                    autoComplete="email"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={state === "loading"}
                className="w-full py-3.5 px-4 bg-black hover:bg-gray-900 text-white font-semibold rounded-xl transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                {state === "loading" ? (
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
                    Sending Reset Link...
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
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Send Reset Link
                  </>
                )}
              </button>

              {/* Security Note */}
              <div className="flex items-center gap-2 justify-center text-sm text-gray-500 pt-2">
                <svg
                  className="w-4 h-4"
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
                <span
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Reset link expires in 1 hour for security
                </span>
              </div>
            </form>
          )}

          {/* Sign Up Link */}
          <div className="mt-10 text-center">
            <p
              className="text-sm text-gray-600"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-black hover:text-gray-700 transition-colors"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Sign up
              </Link>
            </p>
          </div>
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
                Secure Account Recovery
              </h3>
              <p
                className="text-white/80 text-lg leading-relaxed"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Your security is our priority. We use industry-standard
                encryption to protect your account.
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
