// components/product/ImageUploader.tsx
"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  X,
  Star,
  GripVertical,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";

export interface UploadedImage {
  id: string;
  url: string;
  isPrimary: boolean;
  altText?: string;
  order: number;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  className?: string;
}

export function ImageUploader({
  images,
  onChange,
  maxImages = 10,
  className = "",
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draggedItem = useRef<number | null>(null);
  const draggedOverItem = useRef<number | null>(null);

  // Generate unique ID
  const generateId = () =>
    `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      // Validate file count
      if (images.length + fileArray.length > maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        return;
      }

      // Validate file types and sizes
      const validFiles: File[] = [];
      for (const file of fileArray) {
        if (!file.type.startsWith("image/")) {
          setError(`${file.name} is not an image`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError(`${file.name} is too large (max 10MB)`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      setUploading(true);

      try {
        const uploadPromises = validFiles.map(async (file, index) => {
          const tempId = generateId();

          // Update progress
          setUploadProgress((prev) => ({ ...prev, [tempId]: 0 }));

          try {
            // Upload to Cloudinary
            const result = await uploadToCloudinary(file);

            if (!result.success || !result.url) {
              throw new Error(result.error || "Upload failed");
            }

            setUploadProgress((prev) => ({ ...prev, [tempId]: 100 }));

            return {
              id: tempId,
              url: result.url,
              isPrimary: images.length === 0 && index === 0,
              order: images.length + index,
            };
          } catch (err) {
            console.error(`Failed to upload ${file.name}:`, err);
            throw err;
          }
        });

        const uploadedImages = await Promise.all(uploadPromises);
        onChange([...images, ...uploadedImages]);
      } catch (err: any) {
        setError(err.message || "Failed to upload images");
      } finally {
        setUploading(false);
        setUploadProgress({});
      }
    },
    [images, maxImages, onChange],
  );

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  // Remove image
  const removeImage = (id: string) => {
    const updatedImages = images.filter((img) => img.id !== id);
    // If removed image was primary, make first remaining image primary
    if (
      updatedImages.length > 0 &&
      !updatedImages.some((img) => img.isPrimary)
    ) {
      updatedImages[0].isPrimary = true;
    }
    onChange(updatedImages);
  };

  // Set as primary
  const setPrimary = (id: string) => {
    const updatedImages = images.map((img) => ({
      ...img,
      isPrimary: img.id === id,
    }));
    onChange(updatedImages);
  };

  // Reorder images (drag and drop)
  const handleDragStart = (index: number) => {
    draggedItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    draggedOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (
      draggedItem.current !== null &&
      draggedOverItem.current !== null &&
      draggedItem.current !== draggedOverItem.current
    ) {
      const reorderedImages = [...images];
      const draggedItemContent = reorderedImages[draggedItem.current];
      reorderedImages.splice(draggedItem.current, 1);
      reorderedImages.splice(draggedOverItem.current, 0, draggedItemContent);

      // Update order values
      const updatedImages = reorderedImages.map((img, index) => ({
        ...img,
        order: index,
      }));

      onChange(updatedImages);
    }
    draggedItem.current = null;
    draggedOverItem.current = null;
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 transition-colors ${
          dragActive
            ? "border-black bg-gray-50"
            : "border-gray-300 hover:border-gray-400"
        } ${images.length >= maxImages ? "opacity-50 pointer-events-none" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="text-center">
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-4" />
              <p
                className="text-gray-600 font-medium"
                style={{ fontFamily: "Clash Display" }}
              >
                Uploading images...
              </p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <p
                className="text-gray-700 font-medium mb-1"
                style={{ fontFamily: "Clash Display" }}
              >
                Drop images here or click to upload
              </p>
              <p className="text-sm text-gray-500">
                PNG, JPG, WEBP up to 10MB ({images.length}/{maxImages})
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                style={{ fontFamily: "Clash Display" }}
              >
                Select Files
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p
              className="text-sm font-medium text-gray-700"
              style={{ fontFamily: "Clash Display" }}
            >
              Uploaded Images
            </p>
            <p className="text-xs text-gray-500">
              Drag to reorder • Click star to set primary
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images
              .sort((a, b) => a.order - b.order)
              .map((image, index) => (
                <div
                  key={image.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={`relative group aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 transition-all cursor-move ${
                    image.isPrimary
                      ? "border-yellow-400 ring-2 ring-yellow-200"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  {/* Image */}
                  <Image
                    src={image.url}
                    alt={image.altText || `Product image ${index + 1}`}
                    fill
                    className="object-cover"
                  />

                  {/* Primary Badge */}
                  {image.isPrimary && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full flex items-center gap-1">
                      <Star size={10} fill="currentColor" />
                      Primary
                    </div>
                  )}

                  {/* Drag Handle */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 bg-black/60 rounded flex items-center justify-center">
                      <GripVertical size={14} className="text-white" />
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {/* Set Primary Button */}
                    {!image.isPrimary && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrimary(image.id);
                        }}
                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-yellow-100 transition-colors"
                        title="Set as primary"
                      >
                        <Star size={16} className="text-gray-600" />
                      </button>
                    )}

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(image.id);
                      }}
                      className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
                      title="Remove image"
                    >
                      <X size={16} className="text-gray-600" />
                    </button>
                  </div>

                  {/* Order Number */}
                  <div className="absolute bottom-2 left-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {index + 1}
                    </span>
                  </div>
                </div>
              ))}

            {/* Add More Button */}
            {images.length < maxImages && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">Add More</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p
          className="text-sm font-medium text-blue-900 mb-2"
          style={{ fontFamily: "Clash Display" }}
        >
          📷 Image Tips
        </p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Use high-quality images with good lighting</li>
          <li>• Show your product from multiple angles</li>
          <li>• The primary image appears first in search results</li>
          <li>• Square images (1:1 ratio) work best</li>
        </ul>
      </div>
    </div>
  );
}
