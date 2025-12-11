// PART 1: Updated DetailsStep.tsx
// This stores files locally and only shows previews - no upload yet
"use client";

import React, { useState, useCallback, useRef } from "react";
import { AlertCircle, X, Upload, CheckCircle } from "lucide-react";
import Image from "next/image";

interface DetailsStepProps {
  price: string;
  condition: string;
  quantity: string;
  expiryDate: string;
  category: string;
  imageFiles: File[]; // CHANGED: Now accepts File[] instead of string[]
  onPriceChange: (value: string) => void;
  onConditionChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onExpiryDateChange: (value: string) => void;
  onImageFilesChange: (files: File[]) => void; // CHANGED: Now handles File[]
  errors: {
    price?: string;
    condition?: string;
    quantity?: string;
    expiryDate?: string;
    images?: string;
  };
}

const CONDITIONS = [
  { value: "NEW", label: "🆕 New", description: "Unused and sealed" },
  {
    value: "LIKE_NEW",
    label: "⭐ Like New",
    description: "Used but excellent condition",
  },
  { value: "USED", label: "📌 Used", description: "Normal wear and tear" },
  {
    value: "REFURBISHED",
    label: "🔧 Refurbished",
    description: "Professionally restored",
  },
];

export const DetailsStep: React.FC<DetailsStepProps> = ({
  price,
  condition,
  quantity,
  expiryDate,
  category,
  imageFiles, // CHANGED
  onPriceChange,
  onConditionChange,
  onQuantityChange,
  onExpiryDateChange,
  onImageFilesChange, // CHANGED
  errors,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // Local previews

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropFiles = async (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    const imageFilesFiltered = files.filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFilesFiltered.length === 0) {
      alert("Please select image files only");
      return;
    }

    if (imageFiles.length + imageFilesFiltered.length > 5) {
      alert("You can only upload up to 5 images");
      return;
    }

    // Create local preview URLs (no upload yet!)
    const newPreviews = await Promise.all(
      imageFilesFiltered.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      })
    );

    // Update state with new files and previews
    const updatedFiles = [...imageFiles, ...imageFilesFiltered];
    const updatedPreviews = [...imagePreviews, ...newPreviews];

    onImageFilesChange(updatedFiles);
    setImagePreviews(updatedPreviews);
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    await handleFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);

    onImageFilesChange(updatedFiles);
    setImagePreviews(updatedPreviews);
  };

  // Update previews when imageFiles change (e.g., from draft restore)
  React.useEffect(() => {
    const generatePreviews = async () => {
      if (imageFiles.length !== imagePreviews.length) {
        const newPreviews = await Promise.all(
          imageFiles.map((file) => {
            return new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
          })
        );
        setImagePreviews(newPreviews);
      }
    };
    generatePreviews();
  }, [imageFiles]);

  return (
    <div className="space-y-6">
      {/* Price Field */}
      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Price in Naira (₦) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold text-lg">
            ₦
          </span>
          <input
            type="number"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            placeholder="0.00"
            min="0"
            step="100"
            className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition-all duration-200 text-black placeholder-gray-400 focus:outline-none ${
              errors.price
                ? "border-red-500 focus:border-red-500 bg-red-50"
                : "border-gray-200 focus:border-black focus:shadow-md hover:border-gray-300"
            }`}
          />
        </div>
        {errors.price && (
          <div className="flex items-center gap-1 text-red-500 text-xs font-medium mt-2">
            <AlertCircle size={14} />
            {errors.price}
          </div>
        )}
      </div>

      {/* Condition Field */}
      <div>
        <label className="block text-sm font-semibold text-black mb-3">
          Condition <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CONDITIONS.map((cond) => (
            <button
              key={cond.value}
              type="button"
              onClick={() => onConditionChange(cond.value)}
              className={`p-3 border-2 rounded-lg transition-all duration-200 text-left ${
                condition === cond.value
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white text-black hover:border-gray-300"
              }`}
            >
              <div className="font-semibold text-sm">{cond.label}</div>
              <div
                className={`text-xs mt-1 ${
                  condition === cond.value ? "text-gray-200" : "text-gray-500"
                }`}
              >
                {cond.description}
              </div>
            </button>
          ))}
        </div>
        {errors.condition && (
          <div className="flex items-center gap-1 text-red-500 text-xs font-medium mt-2">
            <AlertCircle size={14} />
            {errors.condition}
          </div>
        )}
      </div>

      {/* Quantity Field */}
      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Quantity <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const currentQty = parseInt(quantity) || 0;
              if (currentQty > 1) {
                onQuantityChange((currentQty - 1).toString());
              }
            }}
            className="w-12 h-12 border-2 border-gray-200 rounded-lg flex items-center justify-center hover:border-black transition-colors duration-200"
          >
            −
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => {
              const val = Math.max(1, parseInt(e.target.value) || 0);
              onQuantityChange(val.toString());
            }}
            min="1"
            className={`flex-1 px-4 py-3 border-2 rounded-lg transition-all duration-200 text-black text-center focus:outline-none ${
              errors.quantity
                ? "border-red-500 focus:border-red-500 bg-red-50"
                : "border-gray-200 focus:border-black focus:shadow-md hover:border-gray-300"
            }`}
          />
          <button
            type="button"
            onClick={() => {
              const currentQty = parseInt(quantity) || 1;
              onQuantityChange((currentQty + 1).toString());
            }}
            className="w-12 h-12 border-2 border-gray-200 rounded-lg flex items-center justify-center hover:border-black transition-colors duration-200"
          >
            +
          </button>
        </div>
        {errors.quantity && (
          <div className="flex items-center gap-1 text-red-500 text-xs font-medium mt-2">
            <AlertCircle size={14} />
            {errors.quantity}
          </div>
        )}
      </div>

      {/* Expiry Date Field (Only for FOOD category) */}
      {category === "FOOD" && (
        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            Expiry Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => onExpiryDateChange(e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 text-black focus:outline-none ${
              errors.expiryDate
                ? "border-red-500 focus:border-red-500 bg-red-50"
                : "border-gray-200 focus:border-black focus:shadow-md hover:border-gray-300"
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Required for food items - please provide the expiration date
          </p>
          {errors.expiryDate && (
            <div className="flex items-center gap-1 text-red-500 text-xs font-medium mt-2">
              <AlertCircle size={14} />
              {errors.expiryDate}
            </div>
          )}
        </div>
      )}

      {/* Image Upload Section */}
      <div>
        <label className="block text-sm font-semibold text-black mb-3">
          Images <span className="text-gray-500 font-normal">(Optional)</span>
        </label>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <p className="text-xs text-blue-800">
            ℹ️ Images will be uploaded when you click "Publish Item"
          </p>
        </div>

        {/* Drag and Drop Area */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDropFiles}
          className={`border-2 border-dashed rounded-lg p-8 transition-all duration-200 text-center cursor-pointer ${
            isDragging
              ? "border-black bg-black bg-opacity-5"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-block"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Upload size={24} className="text-gray-600" />
            </div>
            <p className="text-sm font-semibold text-black mb-1">
              Click to select or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF up to 10MB each
            </p>
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          📸 Select up to 5 images ({imageFiles.length}/5)
        </p>

        {errors.images && (
          <div className="flex items-center gap-1 text-red-500 text-xs font-medium mt-2">
            <AlertCircle size={14} />
            {errors.images}
          </div>
        )}

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-black mb-3">
              Selected Images ({imagePreviews.length})
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {imagePreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative group border-2 border-gray-200 rounded-lg overflow-hidden aspect-square bg-gray-100"
                >
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <X size={14} />
                  </button>
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
