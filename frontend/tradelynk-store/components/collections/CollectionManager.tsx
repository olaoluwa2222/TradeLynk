"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Star,
  Eye,
  EyeOff,
  Package,
  MoreVertical,
  Loader2,
  FolderOpen,
  ChevronRight,
  ExternalLink,
  Copy,
  Tag,
  Sparkles,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { collectionsApi } from "@/lib/api";
import { Collection, CollectionSummary } from "@/types/items";
import CollectionModal from "./CollectionModal";
import toast from "react-hot-toast";

interface CollectionManagerProps {
  sellerId: number;
  sellerUsername: string;
}

export default function CollectionManager({
  sellerId,
  sellerUsername,
}: CollectionManagerProps) {
  // State
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | "active" | "inactive" | "featured"
  >("all");
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null,
  );
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  // Load collections
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const response = await collectionsApi.getMyCollections();
      if (response.success) {
        setCollections(response.data || []);
      }
    } catch (error) {
      console.error("Error loading collections:", error);
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  // Filter collections
  const filteredCollections = collections.filter((collection) => {
    // Search filter
    const matchesSearch =
      collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    if (filter === "active") return matchesSearch && collection.isActive;
    if (filter === "inactive") return matchesSearch && !collection.isActive;
    if (filter === "featured") return matchesSearch && collection.isFeatured;
    return matchesSearch;
  });

  // Open edit modal
  const handleEdit = async (id: number) => {
    setOpenDropdown(null);
    try {
      const response = await collectionsApi.getById(id);
      if (response.success) {
        setEditingCollection(response.data);
        setShowModal(true);
      }
    } catch (error) {
      toast.error("Failed to load collection");
    }
  };

  // Delete collection
  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await collectionsApi.deleteCollection(id);
      toast.success("Collection deleted");
      setCollections((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      toast.error("Failed to delete collection");
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(null);
    }
  };

  // Toggle active status
  const toggleActive = async (collection: CollectionSummary) => {
    try {
      await collectionsApi.updateCollection(collection.id, {
        isActive: !collection.isActive,
      });
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collection.id ? { ...c, isActive: !c.isActive } : c,
        ),
      );
      toast.success(
        collection.isActive ? "Collection hidden" : "Collection activated",
      );
    } catch (error) {
      toast.error("Failed to update collection");
    }
  };

  // Toggle featured status
  const toggleFeatured = async (collection: CollectionSummary) => {
    try {
      await collectionsApi.updateCollection(collection.id, {
        isFeatured: !collection.isFeatured,
      });
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collection.id ? { ...c, isFeatured: !c.isFeatured } : c,
        ),
      );
      toast.success(
        collection.isFeatured ? "Removed from featured" : "Added to featured",
      );
    } catch (error) {
      toast.error("Failed to update collection");
    }
  };

  // Copy collection link
  const copyLink = (collection: CollectionSummary) => {
    const url = `${window.location.origin}/sellers/${sellerUsername}/collections/${collection.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
    setOpenDropdown(null);
  };

  // Stats
  const stats = {
    total: collections.length,
    active: collections.filter((c) => c.isActive).length,
    featured: collections.filter((c) => c.isFeatured).length,
    totalProducts: collections.reduce((sum, c) => sum + c.itemCount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "Clash Display" }}
          >
            Collections
          </h2>
          <p className="text-gray-500 mt-1">
            Organize products and display them as categories on your store
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCollection(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-all pill-btn"
          style={{ fontFamily: "Clash Display" }}
        >
          <Plus size={18} />
          <span>New Collection</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 rounded-xl">
              <Tag size={18} className="text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Collections</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-xl">
              <Eye size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">
                {stats.active}
              </p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-yellow-50 to-white border border-yellow-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-100 rounded-xl">
              <Star size={18} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">
                {stats.featured}
              </p>
              <p className="text-xs text-gray-500">Featured</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <Package size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">
                {stats.totalProducts}
              </p>
              <p className="text-xs text-gray-500">Products</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collections..."
            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black transition-all"
            style={{ fontFamily: "Clash Display" }}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {(["all", "active", "inactive", "featured"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                filter === f
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Collections List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-gray-400" />
          <p className="text-gray-500 mt-3">Loading collections...</p>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
          <div className="p-4 bg-white rounded-full shadow-sm mb-4">
            <FolderOpen size={40} className="text-gray-300" />
          </div>
          <h3
            className="text-lg font-bold text-gray-900"
            style={{ fontFamily: "Clash Display" }}
          >
            {searchQuery || filter !== "all"
              ? "No matching collections"
              : "No collections yet"}
          </h3>
          <p className="text-gray-500 mt-1 mb-6 text-center max-w-sm">
            {searchQuery || filter !== "all"
              ? "Try adjusting your search or filters"
              : "Create collections to organize your products and display them on your storefront"}
          </p>
          {!searchQuery && filter === "all" && (
            <button
              onClick={() => {
                setEditingCollection(null);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-all"
              style={{ fontFamily: "Clash Display" }}
            >
              <Plus size={18} />
              <span>Create Your First Collection</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCollections.map((collection) => (
            <div
              key={collection.id}
              className={`group relative bg-white border rounded-2xl overflow-hidden transition-all hover:shadow-lg ${
                !collection.isActive ? "opacity-75" : ""
              } ${collection.isFeatured ? "border-yellow-300" : "border-gray-200"}`}
            >
              <div className="flex items-center gap-4 p-4">
                {/* Image */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {collection.imageUrl ? (
                    <img
                      src={collection.imageUrl}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <Tag size={28} className="text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className="font-bold text-gray-900 truncate"
                      style={{ fontFamily: "Clash Display" }}
                    >
                      {collection.name}
                    </h3>
                    {collection.isFeatured && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                        <Star size={12} className="fill-yellow-500" />
                        Featured
                      </span>
                    )}
                    {!collection.isActive && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                        <EyeOff size={12} />
                        Hidden
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 truncate max-w-md">
                    {collection.description || "No description"}
                  </p>

                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Package size={14} className="text-gray-400" />
                      {collection.itemCount} products
                    </span>
                    <a
                      href={`/sellers/${sellerUsername}/collections/${collection.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      View
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  {/* Toggle Featured */}
                  <button
                    onClick={() => toggleFeatured(collection)}
                    className={`p-2.5 rounded-xl transition-all ${
                      collection.isFeatured
                        ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                        : "bg-gray-100 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
                    }`}
                    title={
                      collection.isFeatured
                        ? "Remove from featured"
                        : "Add to featured"
                    }
                  >
                    <Star
                      size={18}
                      className={collection.isFeatured ? "fill-yellow-500" : ""}
                    />
                  </button>

                  {/* Toggle Active */}
                  <button
                    onClick={() => toggleActive(collection)}
                    className={`p-2.5 rounded-xl transition-all ${
                      collection.isActive
                        ? "bg-green-100 text-green-600 hover:bg-green-200"
                        : "bg-gray-100 text-gray-400 hover:text-green-500 hover:bg-green-50"
                    }`}
                    title={
                      collection.isActive
                        ? "Hide collection"
                        : "Show collection"
                    }
                  >
                    {collection.isActive ? (
                      <Eye size={18} />
                    ) : (
                      <EyeOff size={18} />
                    )}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleEdit(collection.id)}
                    className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all"
                    title="Edit collection"
                  >
                    <Edit2 size={18} />
                  </button>

                  {/* More Options */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === collection.id ? null : collection.id,
                        )
                      }
                      className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {/* Dropdown */}
                    {openDropdown === collection.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenDropdown(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden animate-slide-up">
                          <button
                            onClick={() => copyLink(collection)}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Copy size={16} />
                            Copy Link
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(collection.id);
                              setOpenDropdown(null);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Delete Confirmation */}
              {showDeleteConfirm === collection.id && (
                <div className="px-4 pb-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        size={20}
                        className="text-red-500 flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-red-800">
                          Delete "{collection.name}"?
                        </p>
                        <p className="text-sm text-red-600 mt-1">
                          This action cannot be undone. Products will be removed
                          from this collection but not deleted.
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleDelete(collection.id)}
                            disabled={deletingId === collection.id}
                            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                          >
                            {deletingId === collection.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            Delete
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Collection Modal */}
      <CollectionModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCollection(null);
        }}
        onSuccess={loadCollections}
        collection={editingCollection}
        sellerId={sellerId}
      />
    </div>
  );
}
