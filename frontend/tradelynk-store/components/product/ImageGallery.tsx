// components/product/ImageGallery.tsx
"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";
import { ProductImage } from "@/types/items";

interface ImageGalleryProps {
  images: ProductImage[];
  title: string;
  primaryImageUrl?: string;
}

export function ImageGallery({
  images,
  title,
  primaryImageUrl,
}: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  console.log("🖼️ ImageGallery received:", {
    imagesCount: images?.length,
    primaryImageUrl,
  });

  // Get sorted images with primary first
  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return a.position - b.position;
  });

  // Fallback to primary URL or placeholder
  const getImageUrl = (index: number): string => {
    if (sortedImages[index]) {
      return sortedImages[index].imageUrl;
    }
    if (primaryImageUrl) {
      return primaryImageUrl;
    }
    return "https://via.placeholder.com/600x600?text=No+Image";
  };

  const handlePrevious = useCallback(() => {
    setSelectedIndex((prev) =>
      prev === 0 ? sortedImages.length - 1 : prev - 1,
    );
  }, [sortedImages.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) =>
      prev === sortedImages.length - 1 ? 0 : prev + 1,
    );
  }, [sortedImages.length]);

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === "ArrowLeft") handlePrevious();
        if (e.key === "ArrowRight") handleNext();
        if (e.key === "Escape") setIsLightboxOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, handlePrevious, handleNext]);

  // If no images, show placeholder
  if (sortedImages.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
        <span className="text-gray-400">No images available</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden group">
          <Image
            src={
              imageErrors[selectedIndex]
                ? "https://via.placeholder.com/600x600?text=No+Image"
                : getImageUrl(selectedIndex)
            }
            alt={sortedImages[selectedIndex]?.altText || title}
            fill
            className="object-cover transition-transform duration-500"
            onError={() => handleImageError(selectedIndex)}
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />

          {/* Navigation Arrows */}
          {sortedImages.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft size={20} className="text-gray-700" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight size={20} className="text-gray-700" />
              </button>
            </>
          )}

          {/* Zoom Button */}
          <button
            onClick={() => setIsLightboxOpen(true)}
            className="absolute bottom-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100"
          >
            <ZoomIn size={18} className="text-gray-700" />
          </button>

          {/* Image Counter */}
          {sortedImages.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
              {selectedIndex + 1} / {sortedImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {sortedImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sortedImages.map((image, index) => (
              <button
                key={image.id || index}
                onClick={() => setSelectedIndex(index)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all ${
                  selectedIndex === index
                    ? "ring-2 ring-black ring-offset-2"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={
                    imageErrors[index]
                      ? "https://via.placeholder.com/80x80?text=No+Image"
                      : image.thumbnail || image.imageUrl
                  }
                  alt={image.altText || `${title} - Image ${index + 1}`}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(index)}
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
          >
            <X size={24} className="text-white" />
          </button>

          {/* Navigation Arrows */}
          {sortedImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft size={28} className="text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight size={28} className="text-white" />
              </button>
            </>
          )}

          {/* Main Lightbox Image */}
          <div
            className="relative w-full max-w-4xl max-h-[90vh] aspect-square"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={
                imageErrors[selectedIndex]
                  ? "https://via.placeholder.com/1200x1200?text=No+Image"
                  : getImageUrl(selectedIndex)
              }
              alt={sortedImages[selectedIndex]?.altText || title}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {/* Thumbnails in Lightbox */}
          {sortedImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {sortedImages.map((image, index) => (
                <button
                  key={image.id || index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(index);
                  }}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden transition-all ${
                    selectedIndex === index
                      ? "ring-2 ring-white"
                      : "opacity-50 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={image.thumbnail || image.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Counter */}
          <div className="absolute top-4 left-4 bg-black/60 text-white text-sm font-medium px-4 py-2 rounded-full">
            {selectedIndex + 1} / {sortedImages.length}
          </div>
        </div>
      )}
    </>
  );
}
