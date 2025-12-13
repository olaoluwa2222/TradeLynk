// PART 2: Updated CreateItemForm.tsx
// Key changes:
// 1. Store File[] instead of string[] URLs
// 2. Upload images ONLY when publishing
// 3. Show upload progress during publish

"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, ChevronLeft, Loader } from "lucide-react";
import toast from "react-hot-toast";

import { StepIndicator } from "./StepIndicator";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { DetailsStep } from "./steps/DetailsStep"; // Updated version
import { ReviewStep } from "./steps/ReviewStep";
import { itemsApi, imagesApi } from "@/lib/api";

interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
  price?: string;
  condition?: string;
  quantity?: string;
  expiryDate?: string;
  images?: string;
  terms?: string;
}

const PROHIBITED_KEYWORDS = [
  "illegal",
  "drugs",
  "weapons",
  "counterfeit",
  "stolen",
  "fake",
  "scam",
  "fraud",
];

const checkProhibitedKeywords = (text: string): string[] => {
  const lowerText = text.toLowerCase();
  return PROHIBITED_KEYWORDS.filter((keyword) => lowerText.includes(keyword));
};

const parsePrice = (price: string): number => {
  return Math.round(parseFloat(price));
};

export const CreateItemForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftMode = searchParams?.get("draft") === "true";

  // Form State
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [expiryDate, setExpiryDate] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]); // CHANGED: Store files, not URLs
  const [termsAccepted, setTermsAccepted] = useState(false);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  // Form Validation
  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (!title.trim()) {
        newErrors.title = "Item title is required";
      } else if (title.length > 100) {
        newErrors.title = "Title must be 100 characters or less";
      }

      if (!description.trim()) {
        newErrors.description = "Description is required";
      } else if (description.length > 500) {
        newErrors.description = "Description must be 500 characters or less";
      }

      if (!category) {
        newErrors.category = "Please select a category";
      }

      const titleKeywords = checkProhibitedKeywords(title);
      const descKeywords = checkProhibitedKeywords(description);
      const allKeywords = [...new Set([...titleKeywords, ...descKeywords])];

      if (allKeywords.length > 0) {
        newErrors.title = `Item contains prohibited keywords: ${allKeywords.join(
          ", "
        )}. Please revise.`;
      }
    } else if (step === 2) {
      const priceNum = parseFloat(price);
      if (!price || isNaN(priceNum) || priceNum <= 0) {
        newErrors.price = "Price must be greater than 0";
      }

      if (!condition) {
        newErrors.condition = "Please select a condition";
      }

      const qtyNum = parseInt(quantity);
      if (!quantity || isNaN(qtyNum) || qtyNum < 1) {
        newErrors.quantity = "Quantity must be at least 1";
      }

      if (category === "FOOD") {
        if (!expiryDate) {
          newErrors.expiryDate = "Expiry date is required for food items";
        } else {
          const expDate = new Date(expiryDate);
          const today = new Date();
          if (expDate <= today) {
            newErrors.expiryDate = "Expiry date must be in the future";
          }
        }
      }
    } else if (step === 3) {
      if (!termsAccepted) {
        newErrors.terms = "You must accept the terms to publish your item";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Upload images to Cloudinary
  const uploadImagesToCloudinary = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading image ${i + 1} of ${files.length}...`);

      try {
        const response = await imagesApi.uploadImage(file);

        // Response structure: { success: true, message: "...", data: { url, publicId } }
        const imageUrl = response.data?.url;

        if (imageUrl) {
          uploadedUrls.push(imageUrl);
          console.log(`✅ Image ${i + 1} uploaded:`, imageUrl);
        } else {
          console.error(`❌ No URL in response for image ${i + 1}:`, response);
          throw new Error(`No URL returned for image: ${file.name}`);
        }
      } catch (error: any) {
        console.error(`❌ Failed to upload image ${i + 1}:`, error);

        // Check if error is due to unverified seller
        if (error.response?.data?.error === "SELLER_NOT_VERIFIED") {
          const verificationError: any = new Error("SELLER_NOT_VERIFIED");
          verificationError.response = error.response;
          throw verificationError;
        }

        throw new Error(`Failed to upload image: ${file.name}`);
      }
    }

    return uploadedUrls;
  };

  // Handle step navigation
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleEditStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle form submission - NOW WITH IMAGE UPLOAD
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(3)) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Upload images to Cloudinary (if any)
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        console.log("📤 Starting image upload...");
        toast.loading("Uploading images...", { id: "upload" });

        try {
          imageUrls = await uploadImagesToCloudinary(imageFiles);
          toast.success(`${imageUrls.length} images uploaded!`, {
            id: "upload",
          });
          console.log("✅ All images uploaded successfully:", imageUrls);
        } catch (uploadError: any) {
          console.error("❌ Image upload failed:", uploadError);

          // Check if it's a verification error
          const isVerificationError =
            uploadError?.message === "SELLER_NOT_VERIFIED" ||
            uploadError?.response?.data?.error === "SELLER_NOT_VERIFIED";

          console.log("🔍 Upload error verification check:", {
            isVerificationError,
            message: uploadError?.message,
            status: uploadError?.response?.status,
            errorCode: uploadError?.response?.data?.error,
            responseData: uploadError?.response?.data,
          });

          if (isVerificationError) {
            toast.dismiss("upload");

            const errorMessage =
              uploadError.response?.data?.message ||
              "You must be a verified seller before you can upload images";
            const hint =
              uploadError.response?.data?.hint ||
              "Please complete seller verification or send a mail to start selling";

            // Single compact popup
            toast.error(
              () => (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20 flex-shrink-0">
                    <span className="text-lg">🚫</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="font-semibold text-white text-sm mb-1">
                      Verification Required
                    </p>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {errorMessage.replace(
                        "uploading images",
                        "upload images"
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                      💡 {hint}
                    </p>
                  </div>
                </div>
              ),
              {
                duration: 7000,
                style: {
                  maxWidth: "380px",
                  background: "#0F172A",
                  color: "#FFFFFF",
                  border: "1px solid #EF4444",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
                },
              }
            );

            // Don't continue with item creation
            return;
          }

          // Non-verification upload error
          toast.error("Failed to upload images", { id: "upload" });

          throw uploadError;
        }
      }

      // Step 2: Prepare item data
      setUploadProgress("Creating item...");
      const itemData = {
        title: title.trim(),
        description: description.trim(),
        category,
        price: parsePrice(price),
        condition,
        quantity: parseInt(quantity),
        ...(category === "FOOD" && expiryDate ? { expiryDate } : {}),
        ...(imageUrls.length > 0 ? { imageUrls } : {}),
      };

      console.log("📦 Item data prepared:", itemData);
      console.log(
        "🔑 Access token:",
        localStorage.getItem("accessToken") ? "✅ Present" : "❌ Missing"
      );

      // Step 3: Try using itemsApi first, then fallback to fetch
      let response;

      // Check if itemsApi.createItem exists
      if (itemsApi && typeof itemsApi.createItem === "function") {
        console.log("📡 Using itemsApi.createItem...");
        try {
          response = await itemsApi.createItem(itemData);
          console.log("✅ itemsApi response:", response);
        } catch (apiError: any) {
          console.error("❌ itemsApi.createItem failed:", apiError);

          // Check for verification error
          if (
            apiError.response?.data?.error === "SELLER_NOT_VERIFIED" ||
            apiError.response?.status === 403
          ) {
            throw apiError; // Re-throw to be caught by outer catch
          }

          console.log("🔄 Falling back to direct fetch...");

          // Fallback to direct fetch
          const fetchResponse = await fetch("/api/v1/items", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify(itemData),
          });

          console.log(
            "📊 Fetch response status:",
            fetchResponse.status,
            fetchResponse.statusText
          );

          if (!fetchResponse.ok) {
            const errorData = await fetchResponse.json().catch(() => null);

            // Check for verification error in fetch response
            if (
              fetchResponse.status === 403 &&
              errorData?.error === "SELLER_NOT_VERIFIED"
            ) {
              const verificationError: any = new Error("SELLER_NOT_VERIFIED");
              verificationError.response = { data: errorData, status: 403 };
              throw verificationError;
            }

            const errorText = errorData
              ? JSON.stringify(errorData)
              : await fetchResponse.text();
            console.error("❌ Fetch response error:", errorText);
            throw new Error(
              `API Error: ${fetchResponse.status} - ${errorText}`
            );
          }

          response = await fetchResponse.json();
          console.log("✅ Fetch response data:", response);
        }
      } else {
        // itemsApi doesn't exist, use fetch directly
        console.log("📡 itemsApi not available, using fetch...");

        const fetchResponse = await fetch("/api/v1/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(itemData),
        });

        console.log(
          "📊 Response status:",
          fetchResponse.status,
          fetchResponse.statusText
        );
        console.log(
          "📊 Response headers:",
          Object.fromEntries(fetchResponse.headers.entries())
        );

        if (!fetchResponse.ok) {
          const errorData = await fetchResponse.json().catch(() => null);

          // Check for verification error
          if (
            fetchResponse.status === 403 &&
            errorData?.error === "SELLER_NOT_VERIFIED"
          ) {
            const verificationError: any = new Error("SELLER_NOT_VERIFIED");
            verificationError.response = { data: errorData, status: 403 };
            throw verificationError;
          }

          const errorText = errorData
            ? JSON.stringify(errorData)
            : await fetchResponse.text();
          console.error("❌ Response body:", errorText);
          throw new Error(`HTTP ${fetchResponse.status}: ${errorText}`);
        }

        response = await fetchResponse.json();
        console.log("✅ Response data:", response);
      }

      // Step 4: Validate response
      if (!response || (!response.success && !response.data && !response.id)) {
        console.error("❌ Invalid response structure:", response);
        throw new Error(response?.message || "Invalid response from server");
      }

      // Step 5: Success!
      console.log("🎉 Item created successfully!");
      toast.success("🎉 Your item has been published!");

      const itemId = response.data?.id || response.id;
      console.log("📌 Item ID:", itemId);

      if (!itemId) {
        console.error("⚠️ No item ID found in response");
        toast.error("Item created but couldn't get ID. Check your items list.");
        setTimeout(() => router.push("/items"), 1500);
        return;
      }

      // Redirect to item detail page
      setTimeout(() => {
        console.log("➡️ Redirecting to /items/" + itemId);
        router.push(`/items/${itemId}`);
      }, 1500);
    } catch (error: any) {
      console.error("💥 SUBMISSION ERROR:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        stack: error.stack,
      });

      // Check if error is due to unverified seller
      const isVerificationError =
        error.message === "SELLER_NOT_VERIFIED" ||
        error.response?.data?.error === "SELLER_NOT_VERIFIED" ||
        error.response?.status === 403;

      if (isVerificationError) {
        // Show verification error popup
        const errorMessage =
          error.response?.data?.message ||
          "You must be a verified seller of Tradelynk to create items";
        const hint =
          error.response?.data?.hint ||
          "Please complete seller verification or send a mail to start selling";

        toast.error(`${errorMessage}\n${hint}`, {
          duration: 6000,
          style: {
            minWidth: "350px",
            background: "#0C0A09",
            color: "#FFFFFF",
            border: "1px solid #4B5563",
          },
        });
      } else {
        toast.error(
          error.message || "Unable to create item. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
      setUploadProgress("");
    }
  };

  // Also add this helper to see the full error
  window.addEventListener("unhandledrejection", (event) => {
    console.error("🚨 Unhandled promise rejection:", event.reason);
  });

  const steps = ["Basic Info", "Details", "Review"];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-3">Create Item</h1>
          <p className="text-gray-600 text-lg">
            List your item in 3 simple steps and connect with buyers
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator
          currentStep={currentStep}
          totalSteps={steps.length}
          steps={steps}
        />

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader size={20} className="text-blue-600 animate-spin" />
              <p className="text-sm font-medium text-blue-800">
                {uploadProgress}
              </p>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="space-y-8">
          {currentStep === 1 && (
            <BasicInfoStep
              title={title}
              description={description}
              category={category}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onCategoryChange={setCategory}
              errors={errors}
            />
          )}

          {currentStep === 2 && (
            <DetailsStep
              price={price}
              condition={condition}
              quantity={quantity}
              expiryDate={expiryDate}
              category={category}
              imageFiles={imageFiles}
              onPriceChange={setPrice}
              onConditionChange={setCondition}
              onQuantityChange={setQuantity}
              onExpiryDateChange={setExpiryDate}
              onImageFilesChange={setImageFiles}
              errors={errors}
            />
          )}

          {currentStep === 3 && (
            <ReviewStep
              title={title}
              description={description}
              category={category}
              price={price}
              condition={condition}
              quantity={quantity}
              expiryDate={expiryDate}
              imageFiles={imageFiles} // Pass files for preview
              termsAccepted={termsAccepted}
              onTermsChange={setTermsAccepted}
              onEditStep={handleEditStep}
              errors={errors}
            />
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-8 border-t border-gray-200">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePreviousStep}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-8 py-3 border-2 border-black rounded-lg font-semibold text-black hover:bg-black hover:text-white transition-all duration-200 disabled:opacity-50"
              >
                <ChevronLeft size={20} />
                Back
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-8 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition-all duration-200"
              >
                Continue
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-8 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    {uploadProgress || "Publishing..."}
                  </>
                ) : (
                  <>🎉 Publish Item</>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center mt-12">
          Images will be uploaded when you publish
        </p>
      </div>
    </div>
  );
};
