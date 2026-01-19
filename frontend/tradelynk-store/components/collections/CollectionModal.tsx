"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Image as ImageIcon,
  Plus,
  Trash2,
  Star,
  Eye,
  EyeOff,
  Search,
  Check,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Package,
  Tag,
  AlertCircle,
} from "lucide-react";
import { collectionsApi, itemsApi } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";
import { Collection, Item } from "@/types/items";
import toast from "react-hot-toast";

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  collection?: Collection | null; // For edit mode
  sellerId?: number; // Optional - if not provided, items won't be loaded
}

interface FormData {
  name: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  metaTitle: string;
  metaDescription: string;
  itemIds: number[];
}

export default function CollectionModal({
  isOpen,
  onClose,
  onSuccess,
  collection,
  sellerId,
}: CollectionModalProps) {
  const isEditMode = !!collection;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    imageUrl: "",
    isActive: true,
    isFeatured: false,
    displayOrder: 0,
    metaTitle: "",
    metaDescription: "",
    itemIds: [],
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form for edit mode
  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name,
        description: collection.description || "",
        imageUrl: collection.imageUrl || "",
        isActive: collection.isActive,
        isFeatured: collection.isFeatured,
        displayOrder: collection.displayOrder,
        metaTitle: collection.metaTitle || "",
        metaDescription: collection.metaDescription || "",
        itemIds: collection.items?.map((item) => item.id) || [],
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: "",
        description: "",
        imageUrl: "",
        isActive: true,
        isFeatured: false,
        displayOrder: 0,
        metaTitle: "",
        metaDescription: "",
        itemIds: [],
      });
    }
  }, [collection, isOpen]);

  // Load seller's items for item selector
  useEffect(() => {
    if (isOpen && showItemSelector) {
      loadItems();
    }
  }, [isOpen, showItemSelector]);

  const loadItems = async () => {
    setLoadingItems(true);
    try {
      const response = await itemsApi.getMyItems();
      if (response.success) {
        setItems(response.data || []);
      }
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await uploadToCloudinary(file);
      if (result.success && result.url) {
        setFormData((prev) => ({ ...prev, imageUrl: result.url as string }));
        toast.success("Image uploaded successfully");
      } else {
        toast.error(result.error || "Failed to upload image");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // Toggle item selection
  const toggleItem = (itemId: number) => {
    setFormData((prev) => ({
      ...prev,
      itemIds: prev.itemIds.includes(itemId)
        ? prev.itemIds.filter((id) => id !== itemId)
        : [...prev.itemIds, itemId],
    }));
  };

  // Filter items by search
  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Collection name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        imageUrl: formData.imageUrl || undefined,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        displayOrder: formData.displayOrder,
        metaTitle: formData.metaTitle.trim() || undefined,
        metaDescription: formData.metaDescription.trim() || undefined,
        itemIds: formData.itemIds.length > 0 ? formData.itemIds : undefined,
      };

      if (isEditMode && collection) {
        await collectionsApi.updateCollection(collection.id, submitData);
        toast.success("Collection updated successfully!");
      } else {
        await collectionsApi.createCollection(submitData);
        toast.success("Collection created successfully!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save collection");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-black rounded-xl">
                  <Tag size={20} className="text-white" />
                </div>
                <div>
                  <h2
                    className="text-xl font-bold text-gray-900"
                    style={{ fontFamily: "Clash Display" }}
                  >
                    {isEditMode ? "Edit Collection" : "Create Collection"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {isEditMode
                      ? "Update your collection details"
                      : "Organize products into collections"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
            {/* Collection Image */}
            <div>
              <label
                className="block text-sm font-semibold text-gray-700 mb-2"
                style={{ fontFamily: "Clash Display" }}
              >
                Collection Banner
              </label>
              <div className="relative">
                {formData.imageUrl ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden group">
                    <img
                      src={formData.imageUrl}
                      alt="Collection banner"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <label className="p-2 bg-white rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <ImageIcon size={20} className="text-gray-700" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, imageUrl: "" }))
                        }
                        className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Trash2 size={20} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all">
                    {uploadingImage ? (
                      <Loader2
                        size={32}
                        className="text-gray-400 animate-spin"
                      />
                    ) : (
                      <>
                        <ImageIcon size={32} className="text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">
                          Click to upload banner image
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          Recommended: 1200 x 400px
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Collection Name */}
            <div>
              <label
                className="block text-sm font-semibold text-gray-700 mb-2"
                style={{ fontFamily: "Clash Display" }}
              >
                Collection Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Summer Sale 2026"
                className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black transition-all ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                style={{ fontFamily: "Clash Display" }}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                className="block text-sm font-semibold text-gray-700 mb-2"
                style={{ fontFamily: "Clash Display" }}
              >
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Tell customers about this collection..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black resize-none transition-all"
                style={{ fontFamily: "Clash Display" }}
              />
            </div>

            {/* Status Toggles */}
            <div className="flex gap-4">
              {/* Active Toggle */}
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
                }
                className={`flex-1 p-4 border-2 rounded-xl transition-all ${
                  formData.isActive
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {formData.isActive ? (
                      <Eye size={20} className="text-green-600" />
                    ) : (
                      <EyeOff size={20} className="text-gray-400" />
                    )}
                    <div className="text-left">
                      <p
                        className="font-semibold text-gray-900"
                        style={{ fontFamily: "Clash Display" }}
                      >
                        Active
                      </p>
                      <p className="text-xs text-gray-500">
                        Visible on storefront
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-11 h-6 rounded-full transition-colors ${
                      formData.isActive ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform transform mt-0.5 ${
                        formData.isActive ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </div>
              </button>

              {/* Featured Toggle */}
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    isFeatured: !prev.isFeatured,
                  }))
                }
                className={`flex-1 p-4 border-2 rounded-xl transition-all ${
                  formData.isFeatured
                    ? "border-yellow-500 bg-yellow-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star
                      size={20}
                      className={
                        formData.isFeatured
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-400"
                      }
                    />
                    <div className="text-left">
                      <p
                        className="font-semibold text-gray-900"
                        style={{ fontFamily: "Clash Display" }}
                      >
                        Featured
                      </p>
                      <p className="text-xs text-gray-500">Show on homepage</p>
                    </div>
                  </div>
                  <div
                    className={`w-11 h-6 rounded-full transition-colors ${
                      formData.isFeatured ? "bg-yellow-500" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform transform mt-0.5 ${
                        formData.isFeatured
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </div>
              </button>
            </div>

            {/* Products Selector - only show when sellerId is provided */}
            {sellerId && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="text-sm font-semibold text-gray-700"
                    style={{ fontFamily: "Clash Display" }}
                  >
                    Products in Collection
                  </label>
                  <span className="text-sm text-gray-500">
                    {formData.itemIds.length} selected
                  </span>
                </div>

                {/* Selected Items Preview */}
                {formData.itemIds.length > 0 && !showItemSelector && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.itemIds.slice(0, 4).map((id) => {
                      const item = items.find((i) => i.id === id);
                      return item ? (
                        <div
                          key={id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm"
                        >
                          <Package size={14} className="text-gray-500" />
                          <span className="text-gray-700 truncate max-w-[120px]">
                            {item.title}
                          </span>
                          <button
                            onClick={() => toggleItem(id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : null;
                    })}
                    {formData.itemIds.length > 4 && (
                      <div className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-500">
                        +{formData.itemIds.length - 4} more
                      </div>
                    )}
                  </div>
                )}

                {/* Toggle Item Selector */}
                <button
                  type="button"
                  onClick={() => setShowItemSelector(!showItemSelector)}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  {showItemSelector ? (
                    <>
                      <ChevronUp size={18} />
                      <span>Close Product Selector</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span>Add Products to Collection</span>
                    </>
                  )}
                </button>

                {/* Item Selector Panel */}
                {showItemSelector && (
                  <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden animate-expand">
                    {/* Search */}
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                      <div className="relative">
                        <Search
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search products..."
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black"
                        />
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="max-h-60 overflow-y-auto">
                      {loadingItems ? (
                        <div className="p-8 text-center">
                          <Loader2
                            size={24}
                            className="animate-spin mx-auto text-gray-400"
                          />
                          <p className="text-sm text-gray-500 mt-2">
                            Loading products...
                          </p>
                        </div>
                      ) : filteredItems.length === 0 ? (
                        <div className="p-8 text-center">
                          <Package
                            size={32}
                            className="mx-auto text-gray-300"
                          />
                          <p className="text-sm text-gray-500 mt-2">
                            No products found
                          </p>
                        </div>
                      ) : (
                        filteredItems.map((item) => {
                          const isSelected = formData.itemIds.includes(item.id);
                          const imageUrl =
                            item.primaryImage?.thumbnail ||
                            item.imageUrls?.[0] ||
                            "";

                          return (
                            <div
                              key={item.id}
                              onClick={() => toggleItem(item.id)}
                              className={`flex items-center gap-3 p-3 cursor-pointer transition-all border-b border-gray-50 last:border-0 ${
                                isSelected ? "bg-green-50" : "hover:bg-gray-50"
                              }`}
                            >
                              {/* Product Image */}
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package
                                      size={20}
                                      className="text-gray-300"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {item.title}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {item.displayPrice ||
                                    `₦${(item.price / 100).toLocaleString()}`}
                                </p>
                              </div>

                              {/* Selection Indicator */}
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "border-green-500 bg-green-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {isSelected && (
                                  <Check size={14} className="text-white" />
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Advanced Options */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Sparkles size={16} />
                <span>SEO & Advanced Options</span>
                {showAdvanced ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              {showAdvanced && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-4 animate-expand">
                  {/* Display Order */}
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: "Clash Display" }}
                    >
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          displayOrder: parseInt(e.target.value) || 0,
                        }))
                      }
                      min="0"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-black focus:border-black"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Lower numbers appear first
                    </p>
                  </div>

                  {/* Meta Title */}
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: "Clash Display" }}
                    >
                      SEO Title
                    </label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          metaTitle: e.target.value,
                        }))
                      }
                      placeholder="Custom title for search engines"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: "Clash Display" }}
                    >
                      SEO Description
                    </label>
                    <textarea
                      value={formData.metaDescription}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          metaDescription: e.target.value,
                        }))
                      }
                      placeholder="Custom description for search engines"
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              style={{ fontFamily: "Clash Display" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name.trim()}
              className="px-6 py-2.5 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all pill-btn"
              style={{ fontFamily: "Clash Display" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{isEditMode ? "Updating..." : "Creating..."}</span>
                </>
              ) : (
                <>
                  {isEditMode ? (
                    <>
                      <Check size={18} />
                      <span>Update Collection</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span>Create Collection</span>
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
