// PART 3: Updated ReviewStep.tsx
// Now shows previews of File[] instead of URLs

import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Edit2 } from "lucide-react";

interface ReviewStepProps {
  title: string;
  description: string;
  category: string;
  price: string;
  condition: string;
  quantity: string;
  expiryDate: string;
  imageFiles: File[]; // CHANGED: Now accepts File[] instead of string[]
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
  onEditStep: (step: number) => void;
  errors: {
    terms?: string;
  };
}

const CONDITIONS: Record<string, string> = {
  NEW: "🆕 New",
  LIKE_NEW: "⭐ Like New",
  USED: "📌 Used",
  REFURBISHED: "🔧 Refurbished",
};

const CATEGORIES: Record<string, string> = {
  BOOKS: "📚 Books",
  CLOTHING: "👕 Clothing",
  ELECTRONICS: "📱 Electronics",
  FOOD: "🍕 Food",
  LIGHT: "💡 Light & Accessories",
  TRANSPORTATION: "🚗 Transportation",
};

export const ReviewStep: React.FC<ReviewStepProps> = ({
  title,
  description,
  category,
  price,
  condition,
  quantity,
  expiryDate,
  imageFiles,
  termsAccepted,
  onTermsChange,
  onEditStep,
  errors,
}) => {
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Generate preview URLs from File objects
  useEffect(() => {
    const generatePreviews = async () => {
      const previews = await Promise.all(
        imageFiles.map((file) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      );
      setImagePreviews(previews);
    };

    if (imageFiles.length > 0) {
      generatePreviews();
    } else {
      setImagePreviews([]);
    }
  }, [imageFiles]);

  const reviewSections = [
    {
      step: 1,
      title: "Basic Information",
      fields: [
        { label: "Title", value: title },
        { label: "Description", value: description },
        { label: "Category", value: CATEGORIES[category] },
      ],
    },
    {
      step: 2,
      title: "Details",
      fields: [
        { label: "Price", value: `₦${parseFloat(price).toLocaleString()}` },
        { label: "Condition", value: CONDITIONS[condition] },
        { label: "Quantity", value: quantity },
        ...(category === "FOOD"
          ? [{ label: "Expiry Date", value: expiryDate }]
          : []),
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Review Sections */}
      {reviewSections.map((section) => (
        <div
          key={section.step}
          className="bg-white border-2 border-gray-200 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">
              {section.title}
            </h3>
            <button
              type="button"
              onClick={() => onEditStep(section.step)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border-2 border-gray-200 text-sm font-medium text-black hover:border-black hover:bg-black hover:text-white transition-all duration-200"
            >
              <Edit2 size={14} />
              Edit
            </button>
          </div>

          <div className="space-y-3">
            {section.fields.map((field, idx) => (
              <div key={idx} className="flex items-start justify-between">
                <span className="text-sm text-gray-600">{field.label}</span>
                <span className="text-sm font-semibold text-black max-w-xs text-right break-words">
                  {field.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Image Preview */}
      {imageFiles.length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">
              Images ({imageFiles.length})
            </h3>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border-2 border-gray-200 text-sm font-medium text-black hover:border-black hover:bg-black hover:text-white transition-all duration-200"
            >
              <Edit2 size={14} />
              Edit
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-800">
              ⏳ These images will be uploaded to Cloudinary when you publish
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {imagePreviews.map((preview, index) => (
              <div
                key={index}
                className="relative border-2 border-gray-200 rounded-lg overflow-hidden aspect-square bg-gray-100"
              >
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 text-center">
                  {imageFiles[index].name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terms & Conditions */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onTermsChange(e.target.checked)}
            className="mt-1 w-5 h-5 border-2 border-blue-500 rounded cursor-pointer accent-blue-600"
          />
          <span className="text-sm text-gray-700">
            I confirm that this item complies with campus marketplace policies,
            is not prohibited, and the information provided is accurate and
            truthful.
          </span>
        </label>
        {errors.terms && (
          <div className="flex items-center gap-1 text-red-500 text-xs font-medium mt-3">
            <AlertCircle size={14} />
            {errors.terms}
          </div>
        )}
      </div>

      {/* Summary Card */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={20} className="text-green-500" />
          <h3 className="text-lg font-semibold text-black">Ready to Publish</h3>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Your item will be visible to other students on the Landmark University
          campus marketplace. Make sure all information is accurate before
          publishing.
        </p>
        {imageFiles.length > 0 && (
          <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded p-2 mt-3">
            📸 {imageFiles.length} image(s) will be uploaded when you click
            "Publish Item"
          </p>
        )}
      </div>
    </div>
  );
};
