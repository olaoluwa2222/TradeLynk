"use client";

import { useState, useRef, useEffect } from "react";
import { uploadChatImage } from "@/lib/services/chatService";

interface ChatInputProps {
  onSend: (message: string, imageUrls: string[]) => Promise<boolean>;
  onTyping: () => void;
  sending: boolean;
  disabled: boolean;
}

export default function ChatInput({
  onSend,
  onTyping,
  sending,
  disabled,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 96) + "px"; // Max 4 lines
    }
  }, [message]);

  const handleSend = async () => {
    const result = await onSend(message, imageUrls);
    if (result) {
      // actually sent
      console.log("✅ Message sent successfully");
      setMessage("");
      setImageUrls([]);
    } else {
      console.warn("⚠️ Message not sent (no chatId or error)");
      // show user error toast / keep message in input
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    try {
      setUploadingImage(true);
      setError(null);

      for (const file of files) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert("Image must be less than 5MB");
          continue;
        }

        console.log("📤 Uploading image:", file.name);
        // Upload image
        const imageUrl = await uploadChatImage(file);
        console.log("✅ Image uploaded:", imageUrl);
        setImageUrls((prev) => [...prev, imageUrl]);
      }
    } catch (error) {
      console.error("❌ Error uploading image:", error);
      setError("Failed to upload image");
      alert("Failed to upload image");
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-gray-300 bg-white">
      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Image Preview */}
      {imageUrls.length > 0 && (
        <div className="p-3 border-b border-gray-200 flex gap-3 flex-wrap">
          {imageUrls.map((url, idx) => (
            <div
              key={idx}
              className="relative w-16 h-16 rounded-lg overflow-hidden group shadow-sm hover:shadow-md transition-shadow"
            >
              <img
                src={url}
                alt={`Preview ${idx}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
              <button
                onClick={() => removeImage(idx)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4">
        <div className="flex items-end gap-3">
          {/* Attachment Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage || disabled}
            className="p-2.5 text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            title="Attach image"
          >
            {uploadingImage ? "⏳" : "📎"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Message Input */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              onTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled || sending}
            rows={1}
            className="flex-1 resize-none rounded-2xl border-2 border-gray-300 px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 transition-all placeholder:text-gray-400 text-gray-700"
            style={{ maxHeight: "96px" }}
          />

          {/* Emoji Button */}
          <button
            className="p-2.5 text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition-colors font-medium"
            title="Emoji"
            disabled={disabled || sending}
          >
            😊
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={
              (!message.trim() && imageUrls.length === 0) ||
              sending ||
              disabled ||
              uploadingImage
            }
            className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg active:scale-95"
          >
            {sending ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Sending...</span>
              </span>
            ) : (
              "Send"
            )}
          </button>
        </div>

        {/* Helper Text */}
        <p className="text-xs text-gray-500 mt-2 font-medium">
          Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
