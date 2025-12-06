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
  // ✅ Add debug logging
  console.log("🎨 [MessageBubble] Rendering:", {
    id: message.id,
    senderId: message.senderId,
    isOwnMessage,
    content: message.content?.substring(0, 30),
    side: isOwnMessage ? "RIGHT (own)" : "LEFT (other)",
  });

  return (
    <div
      className={`flex items-end gap-3 mb-3 group ${
        isOwnMessage ? "justify-end" : "justify-start"
      }`}
    >
      {/* Receiver Messages - Left Side (WHITE background) */}
      {!isOwnMessage && (
        <div className="flex flex-col items-start gap-1 flex-1 pr-8">
          {/* Message Bubble */}
          <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl rounded-bl-sm bg-white border-2 border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 ease-out">
            {/* Text Content */}
            {message.content && (
              <p className="text-sm text-gray-900 break-words whitespace-pre-wrap leading-relaxed font-medium">
                {message.content}
              </p>
            )}

            {/* Image Content */}
            {message.imageUrls && message.imageUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {message.imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200"
                  >
                    <Image
                      src={url}
                      alt={`Message image ${idx + 1}`}
                      fill
                      sizes="(max-width: 128px) 100vw, 128px"
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timestamp - Below message, left-aligned */}
          <span className="text-xs text-gray-500 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {formatMessageTime(message.timestamp)}
          </span>
        </div>
      )}

      {/* Sender Messages - Right Side (BLACK background) */}
      {isOwnMessage && (
        <div className="flex flex-col items-end gap-1 flex-1 pl-8">
          {/* Message Bubble */}
          <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl rounded-br-sm bg-black text-white shadow-md hover:shadow-lg transition-all duration-200 ease-out">
            {/* Text Content */}
            {message.content && (
              <p className="text-sm text-white break-words whitespace-pre-wrap leading-relaxed font-medium">
                {message.content}
              </p>
            )}

            {/* Image Content */}
            {message.imageUrls && message.imageUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {message.imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-700"
                  >
                    <Image
                      src={url}
                      alt={`Message image ${idx + 1}`}
                      fill
                      sizes="(max-width: 128px) 100vw, 128px"
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timestamp & Read Receipt - Below message, right-aligned */}
          <div className="flex items-center gap-2 mr-1">
            <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {formatMessageTime(message.timestamp)}
            </span>

            {/* Read Receipt Indicator */}
            <span
              className="text-xs font-semibold text-gray-400 transition-colors duration-200"
              title={message.read ? "Read" : "Delivered"}
            >
              {message.read ? "✓✓" : "✓"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
