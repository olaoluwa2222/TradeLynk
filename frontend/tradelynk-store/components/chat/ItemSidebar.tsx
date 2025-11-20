"use client";

import Image from "next/image";
import Link from "next/link";
import { Chat } from "@/lib/services/chatService";
import { formatChatHeaderDate } from "@/lib/utils/timeUtils";

interface ItemSidebarProps {
  chat: Chat;
  onClose?: () => void;
}

export default function ItemSidebar({ chat, onClose }: ItemSidebarProps) {
  return (
    <div className="p-6 overflow-y-auto">
      {/* Close Button (Mobile) */}
      <button
        onClick={onClose}
        className="lg:hidden absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"
      >
        ✕
      </button>

      {/* Item Image */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-6 bg-gray-100">
        <Image
          src={chat.itemImageUrl || "https://via.placeholder.com/300"}
          alt={chat.itemTitle}
          fill
          className="object-cover"
        />
      </div>

      {/* Item Title */}
      <h3 className="text-lg font-bold text-gray-900 mb-2">{chat.itemTitle}</h3>

      {/* Price */}
      <p className="text-2xl font-bold text-green-600 mb-4">
        ₦{chat.itemImageUrl ? "50,000" : "Price not available"}
      </p>

      {/* Item Details */}
      <div className="space-y-3 mb-6 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Condition:</span>
          <span className="font-medium text-gray-900">Good</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Category:</span>
          <span className="font-medium text-gray-900">Electronics</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Posted:</span>
          <span className="font-medium text-gray-900">
            {formatChatHeaderDate(chat.lastMessageAt)}
          </span>
        </div>
      </div>

      {/* Seller Info */}
      <div className="border-t border-gray-200 pt-4 mb-6">
        <p className="text-sm text-gray-600 mb-3">Seller</p>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
            {chat.sellerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{chat.sellerName}</p>
            <p className="text-xs text-gray-500">⭐ 4.8 (12 reviews)</p>
          </div>
        </div>
      </div>

      {/* Item Status */}
      <div className="mb-6">
        <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
          ✅ Available
        </span>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 mb-6">
        <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700">
          ❤️ Like Item
        </button>
        <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700">
          📤 Share Item
        </button>
      </div>

      {/* CTA Buttons */}
      <div className="space-y-3">
        <Link
          href={`/items/${chat.itemId}`}
          className="w-full block text-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
        >
          View Full Item →
        </Link>

        <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold">
          Proceed to Payment →
        </button>
      </div>

      {/* Safety Tips */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-900">
          💡 <strong>Stay safe:</strong> Meet in a public location, verify item
          condition before payment.
        </p>
      </div>
    </div>
  );
}
