// components/product/ImageGallery.tsx
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  X,
  Play,
  Pause,
} from "lucide-react";
import { ProductImage } from "@/types/items";

interface ImageGalleryProps {
  images: ProductImage[];
  title: string;
  primaryImageUrl?: string;
  autoPlayInterval?: number; // in milliseconds
}

export function ImageGallery({
  images,
  title,
  primaryImageUrl,
  autoPlayInterval = 4000, // Default 4 seconds
}: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Smooth transition handler
  const transitionToImage = useCallback(
    (newIndex: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setProgress(0);

      // Small delay for fade out effect
      setTimeout(() => {
        setSelectedIndex(newIndex);
        // Reset transition state after animation completes
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }, 150);
    },
    [isTransitioning],
  );

  const handlePrevious = useCallback(() => {
    const newIndex =
      selectedIndex === 0 ? sortedImages.length - 1 : selectedIndex - 1;
    transitionToImage(newIndex);
  }, [selectedIndex, sortedImages.length, transitionToImage]);

  const handleNext = useCallback(() => {
    const newIndex =
      selectedIndex === sortedImages.length - 1 ? 0 : selectedIndex + 1;
    transitionToImage(newIndex);
  }, [selectedIndex, sortedImages.length, transitionToImage]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || sortedImages.length <= 1 || isLightboxOpen) {
      setProgress(0);
      return;
    }

    // Progress bar animation
    const progressStep = 100 / (autoPlayInterval / 50); // Update every 50ms
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + progressStep;
      });
    }, 50);

    // Auto advance to next image
    autoPlayTimeoutRef.current = setTimeout(() => {
      handleNext();
    }, autoPlayInterval);

    return () => {
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
      if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
    };
  }, [
    isAutoPlaying,
    selectedIndex,
    sortedImages.length,
    autoPlayInterval,
    handleNext,
    isLightboxOpen,
  ]);

  // Pause auto-play on hover
  const handleMouseEnter = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
  };

  const handleMouseLeave = () => {
    if (isAutoPlaying && sortedImages.length > 1) {
      setProgress(0);
      // Restart the cycle
      autoPlayTimeoutRef.current = setTimeout(() => {
        handleNext();
      }, autoPlayInterval);
    }
  };

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  // Handle thumbnail click
  const handleThumbnailClick = (index: number) => {
    if (index !== selectedIndex) {
      transitionToImage(index);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
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
        {/* Main Image Container */}
        <div
          className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden group"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Progress Bars for Multi-Image */}
          {sortedImages.length > 1 && (
            <div className="absolute top-3 left-3 right-3 z-20 flex gap-1.5">
              {sortedImages.map((_, index) => (
                <div
                  key={index}
                  className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm"
                >
                  <div
                    className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                    style={{
                      width:
                        index === selectedIndex
                          ? `${progress}%`
                          : index < selectedIndex
                            ? "100%"
                            : "0%",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Image Stack with Crossfade Animation */}
          <div className="absolute inset-0">
            {sortedImages.map((image, index) => (
              <div
                key={image.id || index}
                className={`absolute inset-0 transition-all duration-500 ease-out ${
                  index === selectedIndex
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-105"
                }`}
                style={{ zIndex: index === selectedIndex ? 10 : 1 }}
              >
                <Image
                  src={
                    imageErrors[index]
                      ? "https://via.placeholder.com/600x600?text=No+Image"
                      : getImageUrl(index)
                  }
                  alt={image.altText || `${title} - Image ${index + 1}`}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(index)}
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>

          {/* Gradient Overlays for Controls Visibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          {/* Navigation Arrows */}
          {sortedImages.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100 z-20"
              >
                <ChevronLeft size={20} className="text-gray-700" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100 z-20"
              >
                <ChevronRight size={20} className="text-gray-700" />
              </button>
            </>
          )}

          {/* Bottom Controls Row */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-20">
            {/* Image Counter & Play/Pause */}
            <div className="flex items-center gap-2">
              {sortedImages.length > 1 && (
                <>
                  <div className="bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
                    {selectedIndex + 1} / {sortedImages.length}
                  </div>
                  <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
                    title={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
                  >
                    {isAutoPlaying ? (
                      <Pause size={14} className="text-white" />
                    ) : (
                      <Play size={14} className="text-white ml-0.5" />
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Zoom Button */}
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
            >
              <ZoomIn size={18} className="text-gray-700" />
            </button>
          </div>

          {/* Dot Indicators (visible on mobile) */}
          {sortedImages.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 md:hidden z-20">
              {sortedImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleThumbnailClick(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === selectedIndex
                      ? "bg-white w-6"
                      : "bg-white/50 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnails (Enhanced) */}
        {sortedImages.length > 1 && (
          <div className="relative">
            {/* Thumbnail Container */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {sortedImages.map((image, index) => (
                <button
                  key={image.id || index}
                  onClick={() => handleThumbnailClick(index)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all duration-300 ${
                    selectedIndex === index
                      ? "ring-2 ring-black ring-offset-2 scale-105"
                      : "opacity-60 hover:opacity-100 hover:scale-105"
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

                  {/* Active Indicator Overlay */}
                  {selectedIndex === index && (
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full shadow-lg" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Scroll Hint Gradient */}
            {sortedImages.length > 4 && (
              <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none hidden sm:block" />
            )}
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
