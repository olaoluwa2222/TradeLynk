"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { sellersApi } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import ImageUpload from "@/components/ImageUpload";
import ThemeSelector from "@/components/ThemeSelector";
import { Theme } from "@/types/seller";
import {
  ArrowLeft,
  Save,
  Store,
  Palette,
  Phone,
  Globe,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface SellerProfile {
  userId: number;
  username: string;
  name: string;
  email: string;
  businessName: string;
  profilePictureUrl?: string;
  storeTagline?: string;
  bio?: string;
  logoUrl?: string;
  bannerImageUrl?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  instagramHandle?: string;
  twitterHandle?: string;
  theme?: string;
  primaryColor?: string;
  secondaryColor?: string;
  isVerified: boolean;
}

export default function StorefrontSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeSection, setActiveSection] = useState("store");

  // Form fields
  const [businessName, setBusinessName] = useState("");
  const [storeTagline, setStoreTagline] = useState("");
  const [bio, setBio] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<Theme>("modern-clean");
  const [primaryColor, setPrimaryColor] = useState("#000000");
  const [secondaryColor, setSecondaryColor] = useState("#6366F1");

  // Check authorization
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch current profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await sellersApi.getMySellerProfile();

        if (response.success && response.data) {
          const data = response.data;

          // Check if user owns this storefront
          if (data.username !== username) {
            setError("You don't have permission to edit this storefront");
            return;
          }

          setProfile(data);

          // Populate form fields
          setBusinessName(data.businessName || "");
          setStoreTagline(data.storeTagline || "");
          setBio(data.bio || "");
          setLogoUrl(data.logoUrl || "");
          setBannerImageUrl(data.bannerImageUrl || "");
          setPhoneNumber(data.phoneNumber || "");
          setWhatsappNumber(data.whatsappNumber || "");
          setInstagramHandle(data.instagramHandle || "");
          setTwitterHandle(data.twitterHandle || "");
          setSelectedTheme((data.theme as Theme) || "modern-clean");
          setPrimaryColor(data.primaryColor || "#000000");
          setSecondaryColor(data.secondaryColor || "#6366F1");
        }
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError("Failed to load your profile");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && username) {
      fetchProfile();
    }
  }, [isAuthenticated, username]);

  const handleThemeChange = (theme: Theme, primary: string, secondary: string) => {
    setSelectedTheme(theme);
    setPrimaryColor(primary);
    setSecondaryColor(secondary);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      const updateData = {
        businessName,
        storeTagline,
        bio,
        logoUrl,
        bannerImageUrl,
        phoneNumber,
        whatsappNumber,
        instagramHandle,
        twitterHandle,
        theme: selectedTheme,
        primaryColor,
        secondaryColor,
      };

      const response = await sellersApi.updateSellerProfile(updateData);

      if (response.success) {
        setSuccess("Your storefront has been updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.message || "Failed to update profile");
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: "store", label: "Store Info", icon: Store },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "contact", label: "Contact", icon: Phone },
    { id: "social", label: "Social", icon: Globe },
  ];

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link
            href={`/sellers/${username}`}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/sellers/${username}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1
                  className="text-xl font-bold text-gray-900"
                  style={{ fontFamily: "Clash Display" }}
                >
                  Edit My Website
                </h1>
                <p className="text-sm text-gray-500">
                  Customize your storefront appearance and info
                </p>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "Clash Display" }}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Success/Error Messages */}
      {success && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {error && profile && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 sticky top-24">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all ${
                      activeSection === section.id
                        ? "bg-black text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Store Info Section */}
            {activeSection === "store" && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-6" style={{ fontFamily: "Clash Display" }}>
                  Store Information
                </h2>

                <div className="space-y-6">
                  {/* Store Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Ola's Tech Store"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    />
                  </div>

                  {/* Store Tagline */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Tagline
                    </label>
                    <input
                      type="text"
                      value={storeTagline}
                      onChange={(e) => setStoreTagline(e.target.value)}
                      placeholder="e.g. Your one-stop shop for electronics"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      A short description that appears below your store name
                    </p>
                  </div>

                  {/* Bio/About */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      About Your Store
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell your customers about your store, what you sell, and what makes you special..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black transition-colors resize-none"
                    />
                  </div>

                  {/* Username (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store URL
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">tradelynk.com/sellers/</span>
                      <span className="font-medium text-gray-900">{profile?.username}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Your store URL cannot be changed
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Branding Section */}
            {activeSection === "branding" && (
              <div className="space-y-6">
                {/* Logo & Banner */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 mb-6" style={{ fontFamily: "Clash Display" }}>
                    Logo & Banner
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Logo
                      </label>
                      <ImageUpload
                        onUploadComplete={setLogoUrl}
                        currentImageUrl={logoUrl}
                        label="Upload Logo"
                        helpText="Recommended: 200x200px, square format"
                      />
                    </div>

                    {/* Banner Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Banner
                      </label>
                      <ImageUpload
                        onUploadComplete={setBannerImageUrl}
                        currentImageUrl={bannerImageUrl}
                        label="Upload Banner"
                        helpText="Recommended: 1200x400px, landscape format"
                      />
                    </div>
                  </div>
                </div>

                {/* Theme Selection */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 mb-6" style={{ fontFamily: "Clash Display" }}>
                    Theme & Colors
                  </h2>

                  <ThemeSelector
                    selectedTheme={selectedTheme}
                    onThemeChange={handleThemeChange}
                    customColors={{
                      primary: primaryColor,
                      secondary: secondaryColor,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Contact Section */}
            {activeSection === "contact" && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-6" style={{ fontFamily: "Clash Display" }}>
                  Contact Information
                </h2>

                <div className="space-y-6">
                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. +234 801 234 5678"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    />
                  </div>

                  {/* WhatsApp Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="e.g. +234 801 234 5678"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Customers can click to chat with you on WhatsApp
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Social Media Section */}
            {activeSection === "social" && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-6" style={{ fontFamily: "Clash Display" }}>
                  Social Media Links
                </h2>

                <div className="space-y-6">
                  {/* Instagram */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram Handle
                    </label>
                    <div className="flex items-center">
                      <span className="px-4 py-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-gray-500">
                        @
                      </span>
                      <input
                        type="text"
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value)}
                        placeholder="yourhandle"
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-r-xl focus:border-black focus:ring-1 focus:ring-black transition-colors"
                      />
                    </div>
                  </div>

                  {/* Twitter/X */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter/X Handle
                    </label>
                    <div className="flex items-center">
                      <span className="px-4 py-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-gray-500">
                        @
                      </span>
                      <input
                        type="text"
                        value={twitterHandle}
                        onChange={(e) => setTwitterHandle(e.target.value)}
                        placeholder="yourhandle"
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-r-xl focus:border-black focus:ring-1 focus:ring-black transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Link */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold mb-1" style={{ fontFamily: "Clash Display" }}>
                    Preview Your Storefront
                  </h3>
                  <p className="text-sm text-gray-300">
                    See how your changes look to customers
                  </p>
                </div>
                <Link
                  href={`/sellers/${username}`}
                  className="px-5 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  View Store
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
