"use client";

import React, { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { disputesApi } from "@/lib/api";
import { DisputeReason } from "@/types/orders";

interface DisputeModalProps {
  orderId: number;
  itemTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

const DISPUTE_REASONS: { value: DisputeReason; label: string }[] = [
  { value: "ITEM_NOT_RECEIVED", label: "Item not received" },
  { value: "ITEM_NOT_AS_DESCRIBED", label: "Item not as described" },
  { value: "ITEM_DAMAGED", label: "Item arrived damaged" },
  { value: "WRONG_ITEM_SENT", label: "Wrong item sent" },
  { value: "INCOMPLETE_ORDER", label: "Incomplete order" },
  { value: "OTHER", label: "Other" },
];

export default function DisputeModal({
  orderId,
  itemTitle,
  onClose,
  onSuccess,
}: DisputeModalProps) {
  const [reason, setReason] = useState<DisputeReason | "">("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!reason) {
      setError("Please select a reason for your dispute");
      return;
    }

    if (description.length < 20) {
      setError("Please provide a description of at least 20 characters");
      return;
    }

    if (description.length > 1000) {
      setError("Description must be less than 1000 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await disputesApi.createDispute(orderId, {
        reason: reason as DisputeReason,
        description: description.trim(),
      });

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(response.message || "Failed to submit dispute");
      }
    } catch (err: any) {
      console.error("Error creating dispute:", err);
      setError(err.message || "Failed to submit dispute. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2
                  className="text-lg font-bold text-gray-900"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 700,
                  }}
                >
                  Report an Issue
                </h2>
                <p
                  className="text-sm text-gray-600"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  {itemTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-100 rounded-full transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p
                className="text-sm text-red-600"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 500,
                }}
              >
                {error}
              </p>
            </div>
          )}

          {/* Reason Select */}
          <div className="mb-5">
            <label
              className="block text-sm font-semibold text-gray-700 mb-2"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              What&apos;s the problem? *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as DisputeReason)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none transition-colors bg-white"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
              disabled={loading}
            >
              <option value="">Select a reason...</option>
              {DISPUTE_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description Textarea */}
          <div className="mb-6">
            <label
              className="block text-sm font-semibold text-gray-700 mb-2"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              Describe the issue *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details about your issue (minimum 20 characters)..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none transition-colors resize-none"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
              rows={4}
              maxLength={1000}
              disabled={loading}
            />
            <div className="flex justify-between mt-1">
              <p
                className={`text-xs ${
                  description.length < 20 ? "text-amber-600" : "text-gray-500"
                }`}
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                {description.length < 20
                  ? `${20 - description.length} more characters needed`
                  : "✓ Minimum length met"}
              </p>
              <p
                className="text-xs text-gray-500"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 400,
                }}
              >
                {description.length}/1000
              </p>
            </div>
          </div>

          {/* Info Notice */}
          <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p
              className="text-xs text-gray-600"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 400,
              }}
            >
              ℹ️ Your payment is held in escrow until this issue is resolved.
              Our team will review your dispute and contact both parties within
              24-48 hours.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border-2 border-black text-black rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason || description.length < 20}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 600,
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report →"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
