// components/product/ProductForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Info,
  Package,
  Image as ImageIcon,
  FileText,
  Truck,
  Tag,
  AlertCircle,
  Loader2,
  Save,
  Eye,
  Sparkles,
} from "lucide-react";
import { ImageUploader, UploadedImage } from "./ImageUploader";
import {
  VariantBuilderModern as VariantBuilder,
  Variant,
} from "./VariantBuilderModern";
import {
  itemsApi,
  collectionsApi,
  shippingProfilesApi,
  aiApi,
} from "@/lib/api";
import { CreateItemInput, ItemCategory, ItemCondition } from "@/types/items";
import { CollectionModal } from "@/components/collections";

// Form steps
const STEPS = [
  {
    id: 1,
    label: "Basic Info",
    icon: Package,
    description: "Title, category, and condition",
  },
  {
    id: 2,
    label: "Product Type",
    icon: Tag,
    description: "Simple or with variants",
  },
  {
    id: 3,
    label: "Images",
    icon: ImageIcon,
    description: "Upload product photos",
  },
  {
    id: 4,
    label: "Details",
    icon: FileText,
    description: "Description and tags",
  },
  {
    id: 5,
    label: "Shipping",
    icon: Truck,
    description: "Price and shipping options",
  },
];

// Categories (matching ItemCategory type)
const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "CLOTHING", label: "Clothing & Fashion" },
  { value: "HOME", label: "Home & Living" },
  { value: "SPORTS", label: "Sports & Outdoors" },
  { value: "BOOKS", label: "Books & Media" },
  { value: "BEAUTY", label: "Beauty & Health" },
  { value: "ACCESSORIES", label: "Accessories" },
  { value: "FOOD", label: "Food & Grocery" },
  { value: "OTHER", label: "Other" },
];

// Conditions
const CONDITIONS: {
  value: ItemCondition;
  label: string;
  description: string;
}[] = [
  { value: "NEW", label: "New", description: "Brand new, unused, with tags" },
  {
    value: "LIKE_NEW",
    label: "Like New",
    description: "Mint condition, barely used",
  },
  {
    value: "GOOD",
    label: "Good",
    description: "Normal wear, fully functional",
  },
  { value: "FAIR", label: "Fair", description: "Visible wear, works properly" },
];

// Form data interface
interface FormData {
  title: string;
  category: ItemCategory | "";
  condition: ItemCondition | "";
  hasVariants: boolean;
  price: number; // in Naira (will convert to kobo)
  stock: number;
  variants: Variant[];
  images: UploadedImage[];
  description: string;
  tags: string[];
  collectionIds: number[];
  shippingProfileId: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

interface ProductFormProps {
  initialData?: Partial<FormData>;
  itemId?: number;
  mode: "create" | "edit";
}

export function ProductForm({ initialData, itemId, mode }: ProductFormProps) {
  const router = useRouter();
  const { markFirstProductAdded } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [formData, setFormData] = useState<FormData>({
    title: "",
    category: "",
    condition: "",
    hasVariants: false,
    price: 0,
    stock: 1,
    variants: [],
    images: [],
    description: "",
    tags: [],
    collectionIds: [],
    shippingProfileId: "",
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    ...initialData,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [collections, setCollections] = useState<any[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [shippingProfiles, setShippingProfiles] = useState<any[]>([]);
  const [loadingShippingProfiles, setLoadingShippingProfiles] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [creatingShipping, setCreatingShipping] = useState(false);
  const [newShippingProfile, setNewShippingProfile] = useState({
    name: "",
    shippingMethod: "FLAT_RATE",
    flatRateCost: 0,
    minDeliveryDays: 2,
    maxDeliveryDays: 5,
    notes: "",
  });
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  // AI Improvement state
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);
  const [improveError, setImproveError] = useState<string | null>(null);

  // Handle AI improve description
  const handleImproveDescription = async () => {
    const description = formData.description.trim();
    if (!description || description.length < 10) {
      setImproveError("Please write at least 10 characters before improving.");
      return;
    }

    try {
      setIsImprovingDescription(true);
      setImproveError(null);

      const response = await aiApi.improveText(description, "bio");

      if (response.success && response.data?.improvedText) {
        updateFormData({ description: response.data.improvedText });
        toast.success("Description improved!");
      } else {
        setImproveError(
          response.message ||
            "Failed to improve description. Please try again.",
        );
      }
    } catch (err: any) {
      console.error("AI improvement error:", err);
      if (err.response?.status === 503) {
        setImproveError(
          "AI service is temporarily unavailable. Please try again later.",
        );
      } else if (err.response?.status === 429) {
        setImproveError(
          "Too many requests. Please wait a moment and try again.",
        );
      } else {
        setImproveError(
          "Failed to improve description. Please check your connection.",
        );
      }
    } finally {
      setIsImprovingDescription(false);
    }
  };

  // Fetch seller's collections and shipping profiles on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingCollections(true);
        setLoadingShippingProfiles(true);

        const [collectionsRes, shippingRes] = await Promise.all([
          collectionsApi.getMyCollections(),
          shippingProfilesApi.getMyShippingProfiles(),
        ]);

        if (collectionsRes.success && collectionsRes.data) {
          setCollections(collectionsRes.data);
        }

        if (shippingRes.success && shippingRes.data) {
          setShippingProfiles(shippingRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoadingCollections(false);
        setLoadingShippingProfiles(false);
      }
    };
    fetchData();
  }, []);

  // Update form data
  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // Clear errors for updated fields
    const clearedErrors = { ...errors };
    Object.keys(updates).forEach((key) => delete clearedErrors[key]);
    setErrors(clearedErrors);
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          newErrors.title = "Product title is required";
        } else if (formData.title.length < 3) {
          newErrors.title = "Title must be at least 3 characters";
        }
        if (!formData.category) {
          newErrors.category = "Please select a category";
        }
        if (!formData.condition) {
          newErrors.condition = "Please select condition";
        }
        break;

      case 2:
        if (formData.hasVariants) {
          if (formData.variants.length === 0) {
            newErrors.variants = "Add at least one variant";
          } else {
            const invalidVariant = formData.variants.find(
              (v) => !v.size && !v.color,
            );
            if (invalidVariant) {
              newErrors.variants = "Each variant needs size or color";
            }
          }
        } else {
          if (formData.price <= 0) {
            newErrors.price = "Price must be greater than 0";
          }
          if (formData.stock < 0) {
            newErrors.stock = "Stock cannot be negative";
          }
        }
        break;

      case 3:
        if (formData.images.length === 0) {
          newErrors.images = "Upload at least one image";
        }
        break;

      case 4:
        if (!formData.description.trim()) {
          newErrors.description = "Description is required";
        } else if (formData.description.length < 20) {
          newErrors.description =
            "Description should be at least 20 characters";
        }
        break;

      case 5:
        // Shipping step - optional validation
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigate steps
  const goToStep = (step: number) => {
    if (step < currentStep || validateStep(currentStep)) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Add tag
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      updateFormData({ tags: [...formData.tags, tag] });
      setTagInput("");
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    updateFormData({ tags: formData.tags.filter((t) => t !== tagToRemove) });
  };

  // Create new shipping profile
  const handleCreateShippingProfile = async () => {
    if (!newShippingProfile.name.trim()) {
      toast.error("Shipping profile name is required");
      return;
    }

    try {
      setCreatingShipping(true);
      const response = await shippingProfilesApi.createShippingProfile({
        name: newShippingProfile.name.trim(),
        shippingMethod: newShippingProfile.shippingMethod,
        flatRateCost: Math.round(newShippingProfile.flatRateCost * 100), // Convert to kobo
        minDeliveryDays: newShippingProfile.minDeliveryDays,
        maxDeliveryDays: newShippingProfile.maxDeliveryDays,
        notes: newShippingProfile.notes.trim() || undefined,
        isDefault: shippingProfiles.length === 0, // Make first profile default
      });

      if (response.success && response.data) {
        setShippingProfiles([...shippingProfiles, response.data]);
        updateFormData({ shippingProfileId: response.data.id.toString() });
        setShowShippingForm(false);
        setNewShippingProfile({
          name: "",
          shippingMethod: "FLAT_RATE",
          flatRateCost: 0,
          minDeliveryDays: 2,
          maxDeliveryDays: 5,
          notes: "",
        });
        toast.success("Shipping profile created!");
      }
    } catch (error: any) {
      console.error("Failed to create shipping profile:", error);
      toast.error(error.message || "Failed to create shipping profile");
    } finally {
      setCreatingShipping(false);
    }
  };

  // Reload collections after creating one from modal
  const handleCollectionCreated = async () => {
    try {
      const response = await collectionsApi.getMyCollections();
      if (response.success) {
        setCollections(response.data || []);
      }
    } catch (error) {
      console.error("Failed to reload collections:", error);
    }
  };

  // Submit form
  const handleSubmit = async () => {
    // Validate all steps
    for (let step = 1; step <= STEPS.length; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API
      const submitData: CreateItemInput = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: formData.hasVariants
          ? Math.min(...formData.variants.map((v) => v.price)) // Use min variant price
          : Math.round(formData.price * 100), // Convert to kobo
        category: formData.category as ItemCategory,
        condition: formData.condition as ItemCondition,
        hasVariants: formData.hasVariants,
        tags: formData.tags,
        imageUrls: formData.images.map((img) => img.url),
        quantity: formData.hasVariants ? undefined : formData.stock,
        // Add weight and dimensions
        weightInGrams: formData.weight > 0 ? formData.weight : undefined,
        lengthInCm:
          formData.dimensions.length > 0
            ? formData.dimensions.length
            : undefined,
        widthInCm:
          formData.dimensions.width > 0 ? formData.dimensions.width : undefined,
        heightInCm:
          formData.dimensions.height > 0
            ? formData.dimensions.height
            : undefined,
        // Add collections
        collectionIds:
          formData.collectionIds.length > 0
            ? formData.collectionIds
            : undefined,
      };

      if (formData.hasVariants) {
        submitData.variants = formData.variants.map((v) => ({
          variantName: `${v.size || ""} ${v.color || ""}`.trim() || "Default",
          price: v.price, // Already in kobo
          stock: v.stock,
          variantOptions: {
            ...(v.size ? { Size: v.size } : {}),
            ...(v.color ? { Color: v.color } : {}),
          },
        }));
      }

      if (formData.shippingProfileId) {
        submitData.shippingProfileId = parseInt(formData.shippingProfileId, 10);
      }

      console.log(
        "📦 Submitting product data:",
        JSON.stringify(submitData, null, 2),
      );

      let response;
      if (mode === "create") {
        response = await itemsApi.createItem(submitData);
      } else if (itemId) {
        response = await itemsApi.updateItem(itemId, submitData);
      }

      if (response?.success) {
        // Mark first product added for onboarding
        if (mode === "create") {
          markFirstProductAdded();
        }
        
        toast.success(
          mode === "create"
            ? "Product created successfully!"
            : "Product updated successfully!",
          {
            style: {
              background: "#0F172A",
              color: "#FFFFFF",
            },
          },
        );
        router.push("/dashboard/seller");
      } else {
        throw new Error(response?.message || "Failed to save product");
      }
    } catch (err: any) {
      console.error("Error saving product:", err);
      toast.error(err.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: "Clash Display" }}
              >
                Product Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                placeholder="e.g., Nike Air Max 90 Sneakers"
                className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-black focus:border-black transition-colors ${
                  errors.title ? "border-red-500" : "border-gray-300"
                }`}
                style={{ fontFamily: "Clash Display" }}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: "Clash Display" }}
              >
                Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => updateFormData({ category: cat.value })}
                    className={`px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all ${
                      formData.category === cat.value
                        ? "border-black bg-black text-white"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    style={{ fontFamily: "Clash Display" }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.category}
                </p>
              )}
            </div>

            {/* Condition */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: "Clash Display" }}
              >
                Condition *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {CONDITIONS.map((cond) => (
                  <button
                    key={cond.value}
                    type="button"
                    onClick={() => updateFormData({ condition: cond.value })}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      formData.condition === cond.value
                        ? "border-black bg-gray-50"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <p
                      className="font-medium text-gray-900"
                      style={{ fontFamily: "Clash Display" }}
                    >
                      {cond.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {cond.description}
                    </p>
                  </button>
                ))}
              </div>
              {errors.condition && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.condition}
                </p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Product Type Toggle */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: "Clash Display" }}
              >
                Product Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => updateFormData({ hasVariants: false })}
                  className={`p-6 border-2 rounded-xl text-left transition-all ${
                    !formData.hasVariants
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <Package
                    size={24}
                    className={
                      formData.hasVariants ? "text-gray-400" : "text-black"
                    }
                  />
                  <p
                    className="font-bold text-gray-900 mt-3"
                    style={{ fontFamily: "Clash Display" }}
                  >
                    Simple Product
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Single price and stock. Best for unique items.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => updateFormData({ hasVariants: true })}
                  className={`p-6 border-2 rounded-xl text-left transition-all ${
                    formData.hasVariants
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <Tag
                    size={24}
                    className={
                      !formData.hasVariants ? "text-gray-400" : "text-black"
                    }
                  />
                  <p
                    className="font-bold text-gray-900 mt-3"
                    style={{ fontFamily: "Clash Display" }}
                  >
                    Product with Variants
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Multiple sizes, colors, or options.
                  </p>
                </button>
              </div>
            </div>

            {/* Simple Product Fields */}
            {!formData.hasVariants && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    style={{ fontFamily: "Clash Display" }}
                  >
                    Price (₦) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700">
                      ₦
                    </span>
                    <input
                      type="number"
                      value={formData.price || ""}
                      onChange={(e) =>
                        updateFormData({
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className={`w-full pl-8 pr-4 py-3 border rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-black focus:border-black ${
                        errors.price ? "border-red-500" : "border-gray-300"
                      }`}
                      style={{ fontFamily: "Clash Display" }}
                    />
                  </div>
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-500">{errors.price}</p>
                  )}
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    style={{ fontFamily: "Clash Display" }}
                  >
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      updateFormData({ stock: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                    className={`w-full px-4 py-3 border rounded-xl text-gray-900 focus:ring-2 focus:ring-black focus:border-black ${
                      errors.stock ? "border-red-500" : "border-gray-300"
                    }`}
                    style={{ fontFamily: "Clash Display" }}
                  />
                  {errors.stock && (
                    <p className="mt-1 text-sm text-red-500">{errors.stock}</p>
                  )}
                </div>
              </div>
            )}

            {/* Variant Builder */}
            {formData.hasVariants && (
              <>
                <VariantBuilder
                  variants={formData.variants}
                  onChange={(variants) => updateFormData({ variants })}
                  basePrice={Math.round(formData.price * 100) || 100000}
                />
                {errors.variants && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.variants}
                  </p>
                )}
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <ImageUploader
              images={formData.images}
              onChange={(images) => updateFormData({ images })}
              maxImages={10}
            />
            {errors.images && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.images}
              </p>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {/* Description */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: "Clash Display" }}
              >
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  updateFormData({ description: e.target.value })
                }
                placeholder="Describe your product in detail. Include materials, dimensions, features, and any other relevant information."
                rows={6}
                className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-black focus:border-black resize-none ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
                style={{ fontFamily: "Clash Display" }}
              />
              <div className="flex justify-between mt-1">
                {errors.description ? (
                  <p className="text-sm text-red-500">{errors.description}</p>
                ) : (
                  <p className="text-xs text-gray-500">Minimum 20 characters</p>
                )}
                <p className="text-xs text-gray-500">
                  {formData.description.length} characters
                </p>
              </div>

              {/* AI Improve Button */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleImproveDescription}
                  disabled={
                    isImprovingDescription || formData.description.length < 10
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  style={{ fontFamily: "Clash Display" }}
                >
                  {isImprovingDescription ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Improving...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Improve with AI
                    </>
                  )}
                </button>
                {improveError && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {improveError}
                  </p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: "Clash Display" }}
              >
                Tags (Optional)
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-black focus:border-black"
                  style={{ fontFamily: "Clash Display" }}
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!tagInput.trim() || formData.tags.length >= 10}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ fontFamily: "Clash Display" }}
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {formData.tags.length}/10 tags • Tags help buyers find your
                product
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            {/* Weight */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: "Clash Display" }}
              >
                Weight (kg)
              </label>
              <input
                type="number"
                value={formData.weight || ""}
                onChange={(e) =>
                  updateFormData({ weight: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.0"
                min="0"
                step="0.1"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-black focus:border-black"
                style={{ fontFamily: "Clash Display" }}
              />
            </div>

            {/* Dimensions */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: "Clash Display" }}
              >
                Dimensions (cm)
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <input
                    type="number"
                    value={formData.dimensions.length || ""}
                    onChange={(e) =>
                      updateFormData({
                        dimensions: {
                          ...formData.dimensions,
                          length: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    placeholder="Length"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-black focus:border-black"
                    style={{ fontFamily: "Clash Display" }}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Length
                  </p>
                </div>
                <div>
                  <input
                    type="number"
                    value={formData.dimensions.width || ""}
                    onChange={(e) =>
                      updateFormData({
                        dimensions: {
                          ...formData.dimensions,
                          width: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    placeholder="Width"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-black focus:border-black"
                    style={{ fontFamily: "Clash Display" }}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Width
                  </p>
                </div>
                <div>
                  <input
                    type="number"
                    value={formData.dimensions.height || ""}
                    onChange={(e) =>
                      updateFormData({
                        dimensions: {
                          ...formData.dimensions,
                          height: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    placeholder="Height"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-black focus:border-black"
                    style={{ fontFamily: "Clash Display" }}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Height
                  </p>
                </div>
              </div>
            </div>

            {/* Collections Selector */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: "Clash Display" }}
              >
                Add to Collections (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Group this product into your collections
              </p>

              {!loadingCollections && collections.length > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {collections.map((collection: any) => (
                      <label
                        key={collection.id}
                        className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200
                          ${
                            formData.collectionIds.includes(collection.id)
                              ? "border-black bg-gray-50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.collectionIds.includes(
                            collection.id,
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateFormData({
                                collectionIds: [
                                  ...formData.collectionIds,
                                  collection.id,
                                ],
                              });
                            } else {
                              updateFormData({
                                collectionIds: formData.collectionIds.filter(
                                  (id) => id !== collection.id,
                                ),
                              });
                            }
                          }}
                          className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                        />
                        <div className="flex-1">
                          <p
                            className="text-sm font-medium text-gray-900"
                            style={{ fontFamily: "Clash Display" }}
                          >
                            {collection.name}
                          </p>
                          {collection.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                              {collection.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCollectionModal(true)}
                    className="text-sm text-black font-medium hover:underline flex items-center gap-1"
                    style={{ fontFamily: "Clash Display" }}
                  >
                    + Create New Collection
                  </button>
                </div>
              )}

              {collections.length === 0 && !loadingCollections && (
                <div className="p-5 border border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-white space-y-4 animate-expand">
                  <div className="text-center py-4">
                    <Package size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-3">
                      No collections yet. Create one to organize your products.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowCollectionModal(true)}
                      className="px-4 py-2.5 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition-all pill-btn"
                      style={{ fontFamily: "Clash Display" }}
                    >
                      + Create Collection
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Shipping Profile Selector */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: "Clash Display" }}
              >
                Shipping Profile (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Choose or create a shipping method for this product
              </p>

              {!loadingShippingProfiles &&
                shippingProfiles.length > 0 &&
                !showShippingForm && (
                  <div className="space-y-3">
                    <select
                      value={formData.shippingProfileId}
                      onChange={(e) =>
                        updateFormData({ shippingProfileId: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-black focus:border-black"
                      style={{ fontFamily: "Clash Display" }}
                    >
                      <option value="">No shipping profile</option>
                      {shippingProfiles.map((profile: any) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name} - ₦
                          {(profile.flatRateCost / 100).toLocaleString()} (
                          {profile.minDeliveryDays}-{profile.maxDeliveryDays}{" "}
                          days)
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowShippingForm(true)}
                      className="text-sm text-black font-medium hover:underline"
                      style={{ fontFamily: "Clash Display" }}
                    >
                      + Create New Shipping Profile
                    </button>
                  </div>
                )}

              {(shippingProfiles.length === 0 || showShippingForm) &&
                !loadingShippingProfiles && (
                  <div className="p-4 border border-gray-200 rounded-xl bg-white space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Profile Name *
                      </label>
                      <input
                        type="text"
                        value={newShippingProfile.name}
                        onChange={(e) =>
                          setNewShippingProfile({
                            ...newShippingProfile,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g., Standard Shipping"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black"
                        style={{ fontFamily: "Clash Display" }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Shipping Method
                      </label>
                      <select
                        value={newShippingProfile.shippingMethod}
                        onChange={(e) =>
                          setNewShippingProfile({
                            ...newShippingProfile,
                            shippingMethod: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-black"
                        style={{ fontFamily: "Clash Display" }}
                      >
                        <option value="FLAT_RATE">Flat Rate</option>
                        <option value="FREE_SHIPPING">Free Shipping</option>
                        <option value="PAY_ON_DELIVERY">Pay on Delivery</option>
                        <option value="PICKUP_ONLY">Pickup Only</option>
                      </select>
                    </div>

                    {newShippingProfile.shippingMethod === "FLAT_RATE" && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Shipping Cost (₦)
                        </label>
                        <input
                          type="number"
                          value={newShippingProfile.flatRateCost || ""}
                          onChange={(e) =>
                            setNewShippingProfile({
                              ...newShippingProfile,
                              flatRateCost: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black"
                          style={{ fontFamily: "Clash Display" }}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Min Delivery (days)
                        </label>
                        <input
                          type="number"
                          value={newShippingProfile.minDeliveryDays || ""}
                          onChange={(e) =>
                            setNewShippingProfile({
                              ...newShippingProfile,
                              minDeliveryDays: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="2"
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black"
                          style={{ fontFamily: "Clash Display" }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Max Delivery (days)
                        </label>
                        <input
                          type="number"
                          value={newShippingProfile.maxDeliveryDays || ""}
                          onChange={(e) =>
                            setNewShippingProfile({
                              ...newShippingProfile,
                              maxDeliveryDays: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="5"
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black"
                          style={{ fontFamily: "Clash Display" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={newShippingProfile.notes}
                        onChange={(e) =>
                          setNewShippingProfile({
                            ...newShippingProfile,
                            notes: e.target.value,
                          })
                        }
                        placeholder="Additional shipping instructions..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black resize-none"
                        style={{ fontFamily: "Clash Display" }}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCreateShippingProfile}
                        disabled={
                          creatingShipping || !newShippingProfile.name.trim()
                        }
                        className="flex-1 px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ fontFamily: "Clash Display" }}
                      >
                        {creatingShipping ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Profile"
                        )}
                      </button>
                      {shippingProfiles.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowShippingForm(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                          style={{ fontFamily: "Clash Display" }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* Summary Card */}
            <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h3
                className="text-lg font-bold text-gray-900 mb-4"
                style={{ fontFamily: "Clash Display" }}
              >
                Product Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Title</span>
                  <span className="font-medium text-gray-900">
                    {formData.title || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium text-gray-900">
                    {CATEGORIES.find((c) => c.value === formData.category)
                      ?.label || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Condition</span>
                  <span className="font-medium text-gray-900">
                    {CONDITIONS.find((c) => c.value === formData.condition)
                      ?.label || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium text-gray-900">
                    {formData.hasVariants
                      ? `Variants (${formData.variants.length})`
                      : "Simple"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Price</span>
                  <span className="font-medium text-gray-900">
                    {formData.hasVariants
                      ? formData.variants.length > 0
                        ? `₦${(Math.min(...formData.variants.map((v) => v.price)) / 100).toLocaleString()} - ₦${(Math.max(...formData.variants.map((v) => v.price)) / 100).toLocaleString()}`
                        : "-"
                      : formData.price
                        ? `₦${formData.price.toLocaleString()}`
                        : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Stock</span>
                  <span className="font-medium text-gray-900">
                    {formData.hasVariants
                      ? formData.variants.reduce((sum, v) => sum + v.stock, 0)
                      : formData.stock}{" "}
                    units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Images</span>
                  <span className="font-medium text-gray-900">
                    {formData.images.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tags</span>
                  <span className="font-medium text-gray-900">
                    {formData.tags.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex gap-3">
              <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p
                  className="text-sm font-medium text-blue-900"
                  style={{ fontFamily: "Clash Display" }}
                >
                  Ready to publish?
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Review your product details above. You can edit your listing
                  anytime after publishing.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              style={{ fontFamily: "Clash Display" }}
            >
              <ChevronLeft size={20} />
              Back
            </button>
            <h1
              className="text-xl font-bold text-gray-900"
              style={{ fontFamily: "Clash Display" }}
            >
              {mode === "create" ? "Create Product" : "Edit Product"}
            </h1>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Progress Steps - Modern Design */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Mobile Progress Bar */}
          <div className="sm:hidden mb-4">
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-sm font-medium text-gray-900"
                style={{ fontFamily: "Clash Display" }}
              >
                Step {currentStep} of {STEPS.length}
              </span>
              <span className="text-sm text-gray-500">
                {STEPS[currentStep - 1].label}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-black rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Desktop Step Indicators */}
          <div className="hidden sm:flex items-center justify-between relative">
            {/* Background Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-black transition-all duration-500 ease-out -z-10"
              style={{
                width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
              }}
            />

            {STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(step.id)}
                className="flex flex-col items-center group relative z-10"
              >
                {/* Step Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentStep === step.id
                      ? "bg-black text-white scale-110 shadow-lg"
                      : currentStep > step.id
                        ? "bg-black text-white"
                        : "bg-white border-2 border-gray-200 text-gray-400 group-hover:border-gray-400"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check size={18} className="animate-check-pop" />
                  ) : (
                    <step.icon size={18} />
                  )}
                </div>
                {/* Step Label */}
                <div className="mt-3 text-center">
                  <p
                    className={`text-xs font-semibold transition-colors duration-300 ${
                      currentStep === step.id
                        ? "text-black"
                        : currentStep > step.id
                          ? "text-gray-700"
                          : "text-gray-400"
                    }`}
                    style={{ fontFamily: "Clash Display" }}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`text-[10px] mt-0.5 transition-colors duration-300 ${
                      currentStep === step.id
                        ? "text-gray-600"
                        : "text-gray-400"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          {/* Step Header */}
          <div className="mb-8">
            <h2
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: "Clash Display" }}
            >
              {STEPS[currentStep - 1].label}
            </h2>
            <p className="text-gray-500 mt-1">
              {STEPS[currentStep - 1].description}
            </p>
          </div>

          {/* Step Content */}
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-3 text-gray-600 font-medium rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ fontFamily: "Clash Display" }}
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          <div className="flex gap-3">
            {currentStep === STEPS.length ? (
              <>
                <button
                  onClick={() => router.push(`/items/preview`)}
                  className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: "Clash Display" }}
                >
                  <Eye size={18} />
                  Preview
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ fontFamily: "Clash Display" }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {mode === "create" ? "Publish Product" : "Save Changes"}
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
                style={{ fontFamily: "Clash Display" }}
              >
                Next
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Collection Modal */}
      <CollectionModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        onSuccess={handleCollectionCreated}
      />
    </div>
  );
}
