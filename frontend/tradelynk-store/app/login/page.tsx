// app/login/page.tsx
"use client";

import { useState, FormEvent, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { login, isAuthenticated, resendVerification } = useAuth();
  const router = useRouter();

  const images = [
    "/2304.i203.047.S.m004.c13.keys locks realistic.jpg",
    "/11190420.jpg",
    "/cybersecurity-breach-concept-with-shattered-padlock (1).jpg",
  ];

  // Redirect if already authenticated - moved inside useEffect
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Image carousel effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@lmu\.edu\.ng$/i;
    return emailRegex.test(email);
  };

  // ✅ NEW: Handle resend verification
  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setError("");

    try {
      const message = await resendVerification();
      setResendSuccess(true);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setShowResendVerification(false);
    setResendSuccess(false);

    // Validation
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      setError("Email must be a valid @lmu.edu.ng address");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      // Router redirect happens in login function
    } catch (err: any) {
      // ✅ NEW: Check for email not verified error
      if (err.message === "EMAIL_NOT_VERIFIED") {
        setError(
          "Your email is not verified. Check your inbox or click below to resend verification email."
        );
        setShowResendVerification(true);
      } else {
        setError(err.message || "Login failed. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If authenticated, don't render the form (optional)
  if (isAuthenticated) {
    return null; // Or a loading indicator
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-white">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 py-12">
        {/* Logo Icon - Top Right positioned */}
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
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h2
              className="text-4xl font-bold text-black mb-2"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              Welcome Back!
            </h2>
            <p
              className="text-gray-600 text-sm"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              Please enter log in details below
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {resendSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                ✅ Verification email sent! Please check your inbox.
              </div>
            )}

            {/* Email Input */}
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white text-black placeholder-gray-500"
                disabled={isLoading}
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              />
            </div>

            {/* Password Input */}
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white text-black placeholder-gray-500"
                disabled={isLoading}
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              />
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-gray-600 hover:text-black transition-colors"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-black hover:bg-gray-900 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
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
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Resend Verification Button */}
            {showResendVerification && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors disabled:bg-yellow-300 disabled:cursor-not-allowed flex items-center justify-center"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                {resendLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
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
                    Sending...
                  </>
                ) : (
                  "📧 Resend Verification Email"
                )}
              </button>
            )}

            {/* Continue Alternative */}
            <div className="text-center text-sm text-gray-500 my-4">
              or continue
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
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
                className="font-semibold text-black hover:text-gray-700"
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
