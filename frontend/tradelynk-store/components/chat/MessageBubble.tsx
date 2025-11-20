"use client";

import Image from "next/image";
import { Message } from "@/lib/services/chatService";
import { formatMessageTime } from "@/lib/utils/timeUtils";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export default function MessageBubble({
  message,
  isOwnMessage,
}: MessageBubbleProps) {
  return (
    <div
      className={`flex items-end gap-2 ${
        isOwnMessage ? "justify-end" : ""
      } mb-2`}
    >
      {!isOwnMessage && (
        <span className="text-xs text-gray-500">
          {formatMessageTime(message.timestamp)}
        </span>
      )}

      {/* Message Bubble */}
      <div
        className={`rounded-2xl px-4 py-2 max-w-xs ${
          isOwnMessage
            ? "bg-indigo-600 text-white rounded-br-none"
            : "bg-gray-100 text-gray-900 rounded-tl-none"
        }`}
      >
        {/* Text Content */}
        {message.content && (
          <p className="text-sm break-word whitespace-pre-wrap">
            {message.content}
          </p>
        )}

        {/* Image Content */}
        {message.imageUrls && message.imageUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {message.imageUrls.map((url, idx) => (
              <div
                key={idx}
                className="relative w-32 h-32 rounded-lg overflow-hidden"
              >
                <Image
                  src={url}
                  alt={`Message image ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {isOwnMessage && (
        <>
          <span className="text-xs text-gray-500">
            {formatMessageTime(message.timestamp)}
          </span>

          {/* Read Receipt */}
          <span className="text-sm" title={message.read ? "Read" : "Delivered"}>
            {message.read ? "✓✓" : "✓"}
          </span>
        </>
      )}
    </div>
  );
}
