// components/ImageUpload.tsx
"use client";

import { useState, useRef, DragEvent } from "react";
import { uploadToCloudinary, UploadProgress } from "@/lib/cloudinaryUpload";

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: string) => void;
  currentImageUrl?: string;
  label?: string;
  helpText?: string;
}

export default function ImageUpload({
  onUploadComplete,
  onUploadError,
  currentImageUrl,
  label = "Upload Image",
  helpText = "Max 2MB. Drag and drop or click to browse.",
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    currentImageUrl
  );
  const [error, setError] = useState<string>("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError("");
    setUploadSuccess(false);
    setIsUploading(true);
    setUploadProgress(0);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      file,
      (progress: UploadProgress) => {
        setUploadProgress(progress.percentage);
      }
    );

    setIsUploading(false);

    if (result.success && result.url) {
      setUploadSuccess(true);
      onUploadComplete(result.url);
    } else {
      const errorMsg = result.error || "Upload failed";
      setError(errorMsg);
      setUploadSuccess(false);
      setPreviewUrl(undefined);
      if (onUploadError) {
        onUploadError(errorMsg);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreviewUrl(undefined);
    setError("");
    setUploadProgress(0);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-2">{label}</label>

      {/* Upload Area */}
      {!previewUrl && (
        <div
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8
            cursor-pointer transition-all duration-200
            ${
              isDragging
                ? "border-black bg-gray-50"
                : "border-gray-300 hover:border-gray-400"
            }
            ${isUploading ? "pointer-events-none opacity-50" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center text-center">
            {/* Upload Icon */}
            <svg
              className="w-12 h-12 mb-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>

            {isUploading ? (
              <>
                <p className="text-sm font-medium mb-2">
                  Uploading... {uploadProgress}%
                </p>
                <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-medium mb-1">
                  {isDragging ? "Drop image here" : "Click or drag image here"}
                </p>
                <p className="text-xs text-gray-500">{helpText}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      {previewUrl && !isUploading && (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Preview"
            className={`w-full h-48 object-cover rounded-lg border-2 ${
              uploadSuccess ? "border-green-500" : "border-gray-300"
            }`}
          />
          {/* Success Badge */}
          {uploadSuccess && (
            <div className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-md">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Uploaded
            </div>
          )}
          <button
            onClick={handleRemove}
            type="button"
            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Success Message */}
      {uploadSuccess && !error && (
        <p className="mt-2 text-sm text-green-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Image uploaded successfully!
        </p>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
