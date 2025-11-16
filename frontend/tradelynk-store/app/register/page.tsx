// app/register/page.tsx
"use client";

import { useState, FormEvent, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { register, isAuthenticated, resendVerification } = useAuth();
  const router = useRouter();

  const images = [
    "/2304.i203.047.S.m004.c13.keys locks realistic.jpg",
    "/11190420.jpg",
    "/cybersecurity-breach-concept-with-shattered-padlock (1).jpg",
  ];

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Image carousel effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@lmu\.edu\.ng$/i;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  // ✅ NEW: Handle resend verification
  const handleResendVerification = async () => {
    setResendLoading(true);
    setError("");

    try {
      await resendVerification();
      setError("");
      alert("Verification email sent! Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (!email || !name || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      setError("Email must be a valid @lmu.edu.ng address");
      return;
    }

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await register(email, name, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // If authenticated, don't render the form
  if (isAuthenticated) {
    return null;
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
              Create Account
            </h2>
            <p
              className="text-gray-600 text-sm"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              Join Landmark University Marketplace
            </p>
          </div>

          {/* Form */}
          {success ? (
            // Success Message
            <div className="text-center py-8">
              <div className="mb-6 bg-green-50 rounded-lg p-6 border border-green-200">
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

                <h3
                  className="text-2xl font-bold text-gray-900 mb-3"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  ✅ Account Created!
                </h3>

                <div className="bg-white rounded-lg p-4 mb-4 text-left">
                  <p
                    className="text-gray-700 mb-2"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 500,
                    }}
                  >
                    📧 Verification Email Sent
                  </p>
                  <p
                    className="text-sm text-gray-600 mb-2"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    We've sent a verification link to:
                  </p>
                  <p
                    className="text-sm font-mono bg-gray-100 p-2 rounded"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    {email}
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p
                    className="text-sm text-gray-700"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    Please check your inbox and click the link to verify your
                    account.
                  </p>
                </div>

                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="w-full mb-3 py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors disabled:bg-yellow-300 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  {resendLoading
                    ? "Sending..."
                    : "📧 Resend Verification Email"}
                </button>

                <Link
                  href="/login"
                  className="block w-full py-2 px-4 bg-black hover:bg-gray-900 text-white font-medium rounded-lg transition-colors text-center"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  Go to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Name Input */}
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white text-black placeholder-gray-500"
                  disabled={isLoading}
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                />
              </div>

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
                  placeholder="Password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white text-black placeholder-gray-500"
                  disabled={isLoading}
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                />
              </div>

              {/* Confirm Password Input */}
              <div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white text-black placeholder-gray-500"
                  disabled={isLoading}
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                />
              </div>

              {/* Submit Button */}
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
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              {/* Continue Alternative */}
              <div className="text-center text-sm text-gray-500 my-3">
                or continue
              </div>
            </form>
          )}

          {/* Sign In Link */}
          {!success && (
            <div className="mt-8 text-center">
              <p
                className="text-sm text-gray-600"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-black hover:text-gray-700"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
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
