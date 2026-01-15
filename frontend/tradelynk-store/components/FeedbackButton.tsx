"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquarePlus,
  X,
  Star,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  ImagePlus,
  Sparkles,
  Bug,
  MessageCircle,
  Palette,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { tokenStorage } from "@/lib/api";

// ============================================
// TYPES
// ============================================
type FeedbackType =
  | "FEATURE_REQUEST"
  | "BUG_REPORT"
  | "GENERAL_FEEDBACK"
  | "TEMPLATE_REQUEST"
  | "COMPLAINT";

type ModalState = "idle" | "submitting" | "success" | "error";

interface FeedbackFormData {
  type: FeedbackType;
  title: string;
  content: string;
  rating: number;
  imageUrls: string[];
}

// ============================================
// CONSTANTS
// ============================================
const FEEDBACK_TYPES: {
  value: FeedbackType;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: "FEATURE_REQUEST",
    label: "Feature Request",
    icon: <Sparkles className="w-4 h-4" />,
    color: "text-purple-500",
  },
  {
    value: "BUG_REPORT",
    label: "Bug Report",
    icon: <Bug className="w-4 h-4" />,
    color: "text-red-500",
  },
  {
    value: "GENERAL_FEEDBACK",
    label: "General Feedback",
    icon: <MessageCircle className="w-4 h-4" />,
    color: "text-blue-500",
  },
  {
    value: "TEMPLATE_REQUEST",
    label: "Template Request",
    icon: <Palette className="w-4 h-4" />,
    color: "text-emerald-500",
  },
  {
    value: "COMPLAINT",
    label: "Complaint",
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "text-amber-500",
  },
];

const WHATSAPP_PHONE = "2349123328780"; // Replace with actual number

// ============================================
// WHATSAPP ICON COMPONENT
// ============================================
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// ============================================
// STAR RATING COMPONENT
// ============================================
interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  disabled?: boolean;
}

function StarRating({ rating, onRatingChange, disabled }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className={`p-1 transition-all duration-200 ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
          onMouseEnter={() => !disabled && setHovered(star)}
          onMouseLeave={() => !disabled && setHovered(0)}
          onClick={() =>
            !disabled && onRatingChange(star === rating ? 0 : star)
          }
        >
          <Star
            className={`w-6 h-6 transition-all duration-200 ${
              star <= (hovered || rating)
                ? "fill-amber-400 text-amber-400 scale-110"
                : "fill-none text-gray-300 hover:text-amber-200"
            }`}
          />
        </button>
      ))}
      {rating > 0 && (
        <span
          className="ml-2 text-sm text-gray-500"
          style={{ fontFamily: "Clash Display", fontWeight: 400 }}
        >
          {rating === 1 && "Poor"}
          {rating === 2 && "Fair"}
          {rating === 3 && "Good"}
          {rating === 4 && "Very Good"}
          {rating === 5 && "Excellent"}
        </span>
      )}
    </div>
  );
}

// ============================================
// MAIN FEEDBACK BUTTON COMPONENT
// ============================================
interface FeedbackButtonProps {
  username: string;
}

export default function FeedbackButton({ username }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"feedback" | "whatsapp">(
    "feedback"
  );
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const [formData, setFormData] = useState<FeedbackFormData>({
    type: "GENERAL_FEEDBACK",
    title: "",
    content: "",
    rating: 0,
    imageUrls: [],
  });

  const [errors, setErrors] = useState<{
    title?: string;
    content?: string;
    type?: string;
  }>({});

  // Animate button entrance
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Auto-close modal after success
  useEffect(() => {
    if (modalState === "success") {
      const timer = setTimeout(() => {
        setIsOpen(false);
        setModalState("idle");
        resetForm();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [modalState]);

  const resetForm = () => {
    setFormData({
      type: "GENERAL_FEEDBACK",
      title: "",
      content: "",
      rating: 0,
      imageUrls: [],
    });
    setErrors({});
    setErrorMessage("");
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.type) {
      newErrors.type = "Please select a feedback type";
    }

    if (formData.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    if (formData.content.length < 10) {
      newErrors.content = "Details must be at least 10 characters";
    } else if (formData.content.length > 2000) {
      newErrors.content = "Details must be less than 2000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setModalState("submitting");
    setErrorMessage("");

    try {
      const token = tokenStorage.getAccessToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const requestBody = {
        type: formData.type,
        title: formData.title.trim(),
        content: formData.content.trim(),
        rating: formData.rating > 0 ? formData.rating : undefined,
        imageUrls:
          formData.imageUrls.length > 0 ? formData.imageUrls : undefined,
        pageUrl: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      };

      const response = await fetch(
        "https://tradelynk-api-t598w.ondigitalocean.app/api/v1/feedback",
        {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (data.success) {
        setModalState("success");
      } else {
        throw new Error(data.message || "Failed to submit feedback");
      }
    } catch (err: any) {
      console.error("Feedback submission error:", err);
      setModalState("error");
      setErrorMessage(err.message || "Something went wrong. Please try again.");
    }
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `Hi TradeLynk! 📣\n\n` +
        `Feedback about my storefront:\n` +
        `Store: tradelynk.app/sellers/${username}\n\n` +
        `[Please type your feedback here]`
    );

    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleClose = () => {
    if (modalState === "submitting") return;
    setIsOpen(false);
    setModalState("idle");
    setActiveTab("feedback");
    resetForm();
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 left-6 z-50 group flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
        style={{ fontFamily: "Clash Display", fontWeight: 600 }}
        aria-label="Send Feedback"
      >
        <MessageSquarePlus className="w-5 h-5" />
        <span className="hidden sm:inline">Feedback</span>

        {/* Pulse Animation */}
        <span className="absolute -top-1 -right-1 w-3 h-3">
          <span className="absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500" />
        </span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleClose}
          />

          {/* Modal */}
          <div
            className={`relative bg-white w-full sm:max-w-lg sm:mx-4 sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden transform transition-all duration-300 ${
              isOpen
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0"
            } max-h-[90vh] sm:max-h-[85vh] flex flex-col`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <MessageSquarePlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2
                      className="text-lg font-bold text-white"
                      style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                    >
                      Share Feedback
                    </h2>
                    <p
                      className="text-sm text-white/80"
                      style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                    >
                      Help us improve your experience
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={modalState === "submitting"}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex mt-4 bg-white/10 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab("feedback")}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === "feedback"
                      ? "bg-white text-indigo-600 shadow"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                  style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                >
                  Submit Feedback
                </button>
                <button
                  onClick={() => setActiveTab("whatsapp")}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === "whatsapp"
                      ? "bg-white text-indigo-600 shadow"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                  style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                >
                  WhatsApp Chat
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Success State */}
              {modalState === "success" && (
                <div className="p-8 flex flex-col items-center justify-center min-h-[300px] animate-fadeIn">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 animate-scaleIn">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3
                    className="text-xl font-bold text-gray-900 mb-2"
                    style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                  >
                    Thank You! 🎉
                  </h3>
                  <p
                    className="text-gray-600 text-center"
                    style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                  >
                    Your feedback has been submitted successfully.
                    <br />
                    We&apos;ll review it soon!
                  </p>
                </div>
              )}

              {/* Error State */}
              {modalState === "error" && (
                <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <h3
                    className="text-xl font-bold text-gray-900 mb-2"
                    style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                  >
                    Oops! Something went wrong
                  </h3>
                  <p
                    className="text-gray-600 text-center mb-4"
                    style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                  >
                    {errorMessage}
                  </p>
                  <button
                    onClick={() => setModalState("idle")}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                    style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Feedback Form Tab */}
              {activeTab === "feedback" &&
                modalState !== "success" &&
                modalState !== "error" && (
                  <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Feedback Type */}
                    <div>
                      <label
                        className="block text-sm font-semibold text-gray-700 mb-2"
                        style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                      >
                        Feedback Type *
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {FEEDBACK_TYPES.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, type: type.value })
                            }
                            disabled={modalState === "submitting"}
                            className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                              formData.type === type.value
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            } ${
                              modalState === "submitting"
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <span className={type.color}>{type.icon}</span>
                            <span
                              className={`text-sm font-medium ${
                                formData.type === type.value
                                  ? "text-indigo-700"
                                  : "text-gray-700"
                              }`}
                              style={{
                                fontFamily: "Clash Display",
                                fontWeight: 500,
                              }}
                            >
                              {type.label}
                            </span>
                            {formData.type === type.value && (
                              <CheckCircle className="w-4 h-4 text-indigo-500 ml-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                      {errors.type && (
                        <p
                          className="mt-1.5 text-xs text-red-500"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 500,
                          }}
                        >
                          {errors.type}
                        </p>
                      )}
                    </div>

                    {/* Title Input */}
                    <div>
                      <label
                        className="block text-sm font-semibold text-gray-700 mb-2"
                        style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                      >
                        Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="Brief summary of your feedback"
                        disabled={modalState === "submitting"}
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                          errors.title
                            ? "border-red-300 focus:border-red-500"
                            : "border-gray-200 focus:border-indigo-500"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                        maxLength={100}
                      />
                      <div className="flex justify-between mt-1.5">
                        {errors.title ? (
                          <p
                            className="text-xs text-red-500"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 500,
                            }}
                          >
                            {errors.title}
                          </p>
                        ) : (
                          <span />
                        )}
                        <p
                          className={`text-xs ${
                            formData.title.length > 100
                              ? "text-red-500"
                              : "text-gray-400"
                          }`}
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 400,
                          }}
                        >
                          {formData.title.length}/100
                        </p>
                      </div>
                    </div>

                    {/* Details Textarea */}
                    <div>
                      <label
                        className="block text-sm font-semibold text-gray-700 mb-2"
                        style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                      >
                        Details *
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) =>
                          setFormData({ ...formData, content: e.target.value })
                        }
                        placeholder="Describe your feedback in detail. The more information you provide, the better we can help!"
                        disabled={modalState === "submitting"}
                        rows={4}
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none resize-none ${
                          errors.content
                            ? "border-red-300 focus:border-red-500"
                            : "border-gray-200 focus:border-indigo-500"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                        maxLength={2000}
                      />
                      <div className="flex justify-between mt-1.5">
                        {errors.content ? (
                          <p
                            className="text-xs text-red-500"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 500,
                            }}
                          >
                            {errors.content}
                          </p>
                        ) : formData.content.length < 10 ? (
                          <p
                            className="text-xs text-amber-600"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          >
                            {10 - formData.content.length} more characters
                            needed
                          </p>
                        ) : (
                          <p
                            className="text-xs text-emerald-600"
                            style={{
                              fontFamily: "Clash Display",
                              fontWeight: 400,
                            }}
                          >
                            ✓ Minimum length met
                          </p>
                        )}
                        <p
                          className={`text-xs ${
                            formData.content.length > 2000
                              ? "text-red-500"
                              : "text-gray-400"
                          }`}
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 400,
                          }}
                        >
                          {formData.content.length}/2000
                        </p>
                      </div>
                    </div>

                    {/* Rating (Optional) */}
                    <div>
                      <label
                        className="block text-sm font-semibold text-gray-700 mb-2"
                        style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                      >
                        Importance Rating{" "}
                        <span className="font-normal text-gray-400">
                          (optional)
                        </span>
                      </label>
                      <StarRating
                        rating={formData.rating}
                        onRatingChange={(rating) =>
                          setFormData({ ...formData, rating })
                        }
                        disabled={modalState === "submitting"}
                      />
                    </div>

                    {/* Image Upload Placeholder */}
                    <div>
                      <label
                        className="block text-sm font-semibold text-gray-700 mb-2"
                        style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                      >
                        Attach Screenshot{" "}
                        <span className="font-normal text-gray-400">
                          (optional)
                        </span>
                      </label>
                      <button
                        type="button"
                        disabled={modalState === "submitting"}
                        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-200 flex items-center justify-center gap-2 text-gray-500 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ImagePlus className="w-5 h-5" />
                        <span
                          className="text-sm font-medium"
                          style={{
                            fontFamily: "Clash Display",
                            fontWeight: 500,
                          }}
                        >
                          Click to upload (coming soon)
                        </span>
                      </button>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={modalState === "submitting"}
                      className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      {modalState === "submitting" ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Submit Feedback
                        </>
                      )}
                    </button>
                  </form>
                )}

              {/* WhatsApp Tab */}
              {activeTab === "whatsapp" &&
                modalState !== "success" &&
                modalState !== "error" && (
                  <div className="p-6 flex flex-col items-center justify-center min-h-[350px]">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                      <WhatsAppIcon className="w-12 h-12 text-emerald-500" />
                    </div>
                    <h3
                      className="text-xl font-bold text-gray-900 mb-2 text-center"
                      style={{ fontFamily: "Clash Display", fontWeight: 700 }}
                    >
                      Prefer to Chat Directly?
                    </h3>
                    <p
                      className="text-gray-600 text-center mb-6 max-w-sm"
                      style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                    >
                      Send us a message on WhatsApp and we&apos;ll get back to
                      you as soon as possible. Quick responses guaranteed!
                    </p>

                    <button
                      onClick={openWhatsApp}
                      className="w-full max-w-xs py-4 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-3"
                      style={{ fontFamily: "Clash Display", fontWeight: 600 }}
                    >
                      <WhatsAppIcon className="w-6 h-6" />
                      Chat on WhatsApp
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <p
                      className="mt-4 text-xs text-gray-400 text-center"
                      style={{ fontFamily: "Clash Display", fontWeight: 400 }}
                    >
                      Opens WhatsApp with a pre-filled message
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out forwards;
        }
      `}</style>
    </>
  );
}
