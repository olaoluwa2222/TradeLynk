"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { sellersApi } from "@/lib/api";

export default function BecomeASellerPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="w-full bg-linear-to-br from-black via-gray-900 to-black text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Main Headline */}
              <div>
                <h1
                  className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  💰 Start Selling & Earn Money on Campus
                </h1>
              </div>

              {/* Subheading */}
              <div>
                <p
                  className="text-xl text-gray-300 leading-relaxed"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Turn your unused items into cash. Join 50+ student sellers
                  making ₦50,000+ per month on Landmark Marketplace.
                </p>
              </div>

              {/* CTA Button */}
              <div>
                <Link
                  href={isAuthenticated ? "/seller-dashboard" : "/register"}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg group"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  <span>Start Selling Now</span>
                  <span className="group-hover:translate-x-1 transition-transform">
                    ↓
                  </span>
                </Link>
              </div>

              {/* Benefits List */}
              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-4">
                  <div className="text-2xl mt-1">✅</div>
                  <div>
                    <p
                      className="text-lg font-semibold text-white"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 600,
                      }}
                    >
                      No listing fees
                    </p>
                    <p
                      className="text-gray-400 text-sm"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      List as many items as you want for free
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="text-2xl mt-1">✅</div>
                  <div>
                    <p
                      className="text-lg font-semibold text-white"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 600,
                      }}
                    >
                      Fast payments
                    </p>
                    <p
                      className="text-gray-400 text-sm"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      Get paid within 24 hours of confirming a sale
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="text-2xl mt-1">✅</div>
                  <div>
                    <p
                      className="text-lg font-semibold text-white"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 600,
                      }}
                    >
                      Easy setup
                    </p>
                    <p
                      className="text-gray-400 text-sm"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      Create your profile in less than 2 minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Stats Card */}
            <div className="flex flex-col gap-6">
              {/* Main Stats Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300">
                <div
                  className="text-5xl font-bold text-white mb-2"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  50+
                </div>
                <p
                  className="text-gray-300 text-sm mb-6"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Active student sellers on campus
                </p>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-white/10">
                    <span
                      className="text-gray-300"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      Avg. monthly earnings
                    </span>
                    <span
                      className="text-2xl font-bold text-white"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 700,
                      }}
                    >
                      ₦50K+
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-white/10">
                    <span
                      className="text-gray-300"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      Items sold this month
                    </span>
                    <span
                      className="text-2xl font-bold text-white"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 700,
                      }}
                    >
                      1,200+
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span
                      className="text-gray-300"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 400,
                      }}
                    >
                      Customer satisfaction
                    </span>
                    <span
                      className="text-2xl font-bold text-white"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 700,
                      }}
                    >
                      4.8★
                    </span>
                  </div>
                </div>
              </div>

              {/* Secondary CTA */}
              <div className="bg-white rounded-2xl p-6 text-center">
                <p
                  className="text-black text-sm mb-4"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  Ready to start earning?
                </p>
                <Link
                  href={isAuthenticated ? "/seller-dashboard" : "/register"}
                  className="inline-block w-full py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition-colors"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  Become a Seller
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional sections will be added here */}
      {/* Why Sell Section */}
      {/* How to Get Started Section */}
      {/* Support Section */}

      {/* How Selling Works Section */}
      <section className="w-full bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold text-black mb-3"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              How Selling Works - It's Easy!
            </h2>
            <div className="h-1 w-20 bg-black mx-auto"></div>
          </div>

          {/* Steps Container */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-linear-to-r from-black via-black to-black -z-10"></div>

            {/* Step 1: Sign Up */}
            <div className="flex flex-col items-center text-center group">
              {/* Step Circle */}
              <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300 relative z-10">
                <span
                  className="text-5xl"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  📋
                </span>
              </div>

              {/* Step Label */}
              <h3
                className="text-2xl font-bold text-black mb-4"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Step 1
              </h3>

              {/* Step Title */}
              <h4
                className="text-xl font-semibold text-black mb-3"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Sign Up
              </h4>

              {/* Step Description */}
              <p
                className="text-gray-600 text-sm leading-relaxed"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Add your bank details and complete your seller profile in less
                than 2 minutes.
              </p>
            </div>

            {/* Step 2: List Item */}
            <div className="flex flex-col items-center text-center group">
              {/* Step Circle */}
              <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300 relative z-10">
                <span
                  className="text-5xl"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  📸
                </span>
              </div>

              {/* Step Label */}
              <h3
                className="text-2xl font-bold text-black mb-4"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Step 2
              </h3>

              {/* Step Title */}
              <h4
                className="text-xl font-semibold text-black mb-3"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                List Item
              </h4>

              {/* Step Description */}
              <p
                className="text-gray-600 text-sm leading-relaxed"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Upload photos, add details, set your price, and list your items
                instantly.
              </p>
            </div>

            {/* Step 3: Get Paid */}
            <div className="flex flex-col items-center text-center group">
              {/* Step Circle */}
              <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300 relative z-10">
                <span
                  className="text-5xl"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  💰
                </span>
              </div>

              {/* Step Label */}
              <h3
                className="text-2xl font-bold text-black mb-4"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Step 3
              </h3>

              {/* Step Title */}
              <h4
                className="text-xl font-semibold text-black mb-3"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Get Paid
              </h4>

              {/* Step Description */}
              <p
                className="text-gray-600 text-sm leading-relaxed"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                Receive payment directly to your bank account within 24-48 hours
                after each sale.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seller Activation Form Section */}
      <SellerActivationForm isAuthenticated={isAuthenticated} router={router} />
    </div>
  );
}

// Seller Activation Form Component
function SellerActivationForm({
  isAuthenticated,
  router,
}: {
  isAuthenticated: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  const [banks, setBanks] = useState<Array<{ code: string; name: string }>>([]);
  const [businessName, setBusinessName] = useState("");
  const [campusAddress, setCampusAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validationStatus, setValidationStatus] = useState<
    "idle" | "validating" | "valid" | "invalid"
  >("idle");

  // Fetch banks on component mount
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const data = await sellersApi.getBanks();
        if (data.success) {
          setBanks(data.data);
        }
      } catch (err) {
        console.error("Error fetching banks:", err);
        setError("Failed to load banks. Please refresh the page.");
      }
    };

    if (isAuthenticated) {
      fetchBanks();
    }
  }, [isAuthenticated]);

  // Validate account number when it changes
  useEffect(() => {
    const validateAccountNumber = async () => {
      if (accountNumber.length === 10 && bankCode) {
        try {
          setValidationStatus("validating");
          const data = await sellersApi.validateAccount(
            accountNumber,
            bankCode
          );

          if (data.success) {
            setAccountName(data.data.accountName);
            setValidationStatus("valid");
          } else {
            setValidationStatus("invalid");
            setError(data.message || "Invalid account number");
          }
        } catch (err) {
          setValidationStatus("invalid");
          setError("Failed to validate account number");
        }
      } else {
        setValidationStatus("idle");
        setAccountName("");
      }
    };

    const debounceTimer = setTimeout(validateAccountNumber, 500);
    return () => clearTimeout(debounceTimer);
  }, [accountNumber, bankCode]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!bankName || !accountNumber || !agreedToTerms) {
      setError("Please fill in all required fields and agree to terms");
      return;
    }

    if (validationStatus !== "valid") {
      setError("Please validate your account number first");
      return;
    }

    setIsLoading(true);

    try {
      const data = await sellersApi.activateSeller({
        businessName: businessName || undefined,
        campusAddress: campusAddress || undefined,
        bankName,
        accountNumber,
        accountName,
        agreedToTerms,
      });

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/seller-dashboard");
        }, 2000);
      } else {
        setError(data.message || "Failed to activate seller account");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="w-full bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-3xl font-bold text-black mb-4"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            Ready to become a seller?
          </h2>
          <p
            className="text-gray-600 mb-8"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            You need to create an account first
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition-colors"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            Create Account
          </Link>
        </div>
      </section>
    );
  }

  if (success) {
    return (
      <section className="w-full bg-green-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
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
          <h2
            className="text-3xl font-bold text-black mb-4"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            ✅ Seller Account Activated!
          </h2>
          <p
            className="text-gray-600 mb-4"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            Welcome to the seller community! You can now start listing items and
            earning money.
          </p>
          <p
            className="text-sm text-gray-500"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            Redirecting to dashboard...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2
            className="text-4xl font-bold text-black mb-3"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            Complete Your Seller Profile
          </h2>
          <p
            className="text-gray-600"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            Set up your seller account to start earning
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Business Information Section */}
            <div className="border-b border-gray-200 pb-8">
              <h3
                className="text-2xl font-semibold text-black mb-6"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Business Information (Optional)
              </h3>

              {/* Business Name */}
              <div className="mb-6">
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., John's Used Books"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 transition-all"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                />
                <p
                  className="text-xs text-gray-500 mt-1"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  This will appear on your listings
                </p>
              </div>

              {/* Campus Address */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  Campus Address
                </label>
                <input
                  type="text"
                  value={campusAddress}
                  onChange={(e) => setCampusAddress(e.target.value)}
                  placeholder="e.g., Male Hostel Block B, Room 205"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 transition-all"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                />
              </div>
            </div>

            {/* Bank Account Details Section */}
            <div className="border-b border-gray-200 pb-8">
              <h3
                className="text-2xl font-semibold text-black mb-6"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Bank Account Details (Required)
              </h3>

              {/* Bank Name */}
              <div className="mb-6">
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  Bank Name
                </label>
                <select
                  value={bankName}
                  onChange={(e) => {
                    const selected = banks.find(
                      (b) => b.name === e.target.value
                    );
                    setBankName(e.target.value);
                    setBankCode(selected?.code || "");
                    setAccountNumber("");
                    setAccountName("");
                    setValidationStatus("idle");
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 transition-all"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  <option value="">Select a bank</option>
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.name}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Number */}
              <div className="mb-6">
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  Account Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) =>
                      setAccountNumber(e.target.value.slice(0, 10))
                    }
                    placeholder="0123456789"
                    maxLength={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 transition-all"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                    disabled={!bankCode}
                  />
                  {validationStatus === "validating" && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
                    </div>
                  )}
                  {validationStatus === "valid" && (
                    <div className="absolute right-3 top-3 text-green-500 text-xl">
                      ✓
                    </div>
                  )}
                  {validationStatus === "invalid" && (
                    <div className="absolute right-3 top-3 text-red-500 text-xl">
                      ✗
                    </div>
                  )}
                </div>
                <p
                  className="text-xs text-gray-500 mt-1"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  10 digits
                </p>
              </div>

              {/* Account Name */}
              <div className="mb-6">
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  Account Name
                </label>
                <input
                  type="text"
                  value={accountName}
                  disabled
                  placeholder="Auto-filled after validation"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-900"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                />
                <p
                  className="text-xs text-gray-500 mt-1"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Auto-filled when account is validated
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p
                  className="text-sm text-gray-700"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 500,
                  }}
                >
                  ℹ️ Why we need this:
                </p>
                <p
                  className="text-sm text-gray-600 mt-2"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  Your sales revenue will be sent directly to this account
                  within 24-48 hours after each sale.
                </p>
              </div>
            </div>

            {/* Terms & Conditions Section */}
            <div className="pb-8">
              <h3
                className="text-2xl font-semibold text-black mb-6"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 600,
                }}
              >
                Terms & Conditions
              </h3>

              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-5 h-5"
                  />
                  <span
                    className="text-gray-700"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    I agree to the Seller Terms & Conditions
                  </span>
                </label>

                <div
                  className="text-xs text-gray-500 ml-8 space-y-2"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  <p>• I understand the 10% commission on each sale</p>
                  <p>• I will only sell items allowed by campus rules</p>
                  <p>• I understand my bank details are encrypted and secure</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || validationStatus !== "valid"}
              className="w-full py-4 px-6 bg-black hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Activating...
                </>
              ) : (
                <>
                  Activate Seller Account
                  <span>→</span>
                </>
              )}
            </button>

            {/* Footer Text */}
            <p
              className="text-xs text-gray-600 text-center"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              By clicking, you agree to our Seller Agreement & Privacy Policy.
              Your information is encrypted and secure.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
