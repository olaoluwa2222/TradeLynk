// components/product/ProductsTable.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Package,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  MoreVertical,
  Search,
  Filter,
  ChevronDown,
  Star,
  TrendingUp,
  AlertCircle,
  Loader2,
  Plus,
} from "lucide-react";
import { itemsApi } from "@/lib/api";
import { Item, ItemCategory } from "@/types/items";
import { formatPrice, getConditionLabel, getStockStatus } from "@/types/items";

interface ProductsTableProps {
  initialItems?: Item[];
  onRefresh?: () => void;
}

export function ProductsTable({ initialItems, onRefresh }: ProductsTableProps) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initialItems || []);
  const [loading, setLoading] = useState(!initialItems);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Fetch items
  useEffect(() => {
    if (initialItems) return;

    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await itemsApi.getMyItems();
        if (response.success && response.data) {
          setItems(response.data);
        }
      } catch (err) {
        console.error("Error fetching items:", err);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [initialItems]);

  // Filter and sort items
  const filteredItems = items
    .filter((item) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !item.title.toLowerCase().includes(query) &&
          !item.sku?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "price-high":
          return b.price - a.price;
        case "price-low":
          return a.price - b.price;
        case "name":
          return a.title.localeCompare(b.title);
        case "stock-low":
          return (
            (a.totalStock || a.quantity || 0) -
            (b.totalStock || b.quantity || 0)
          );
        default:
          return 0;
      }
    });

  // Actions
  const handleToggleStatus = async (itemId: number, currentStatus: string) => {
    try {
      setActionLoading(itemId);
      const newStatus = currentStatus === "ACTIVE" ? "HIDDEN" : "ACTIVE";
      await itemsApi.updateStatus(itemId, newStatus);

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status: newStatus } : item,
        ),
      );

      toast.success(
        newStatus === "ACTIVE" ? "Product is now visible" : "Product hidden",
      );
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status");
    } finally {
      setActionLoading(null);
      setOpenDropdown(null);
    }
  };

  const handleToggleFeatured = async (
    itemId: number,
    currentlyFeatured: boolean,
  ) => {
    try {
      setActionLoading(itemId);
      await itemsApi.toggleFeatured(itemId);

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, isFeatured: !currentlyFeatured }
            : item,
        ),
      );

      toast.success(
        !currentlyFeatured ? "Product featured" : "Product unfeatured",
      );
    } catch (err) {
      console.error("Error toggling featured:", err);
      toast.error("Failed to update featured status");
    } finally {
      setActionLoading(null);
      setOpenDropdown(null);
    }
  };

  const handleDuplicate = async (itemId: number) => {
    try {
      setActionLoading(itemId);
      const response = await itemsApi.duplicateItem(itemId);

      if (response.success && response.data) {
        setItems((prev) => [response.data, ...prev]);
        toast.success("Product duplicated");
      }
    } catch (err) {
      console.error("Error duplicating:", err);
      toast.error("Failed to duplicate product");
    } finally {
      setActionLoading(null);
      setOpenDropdown(null);
    }
  };

  const handleDelete = async (itemId: number) => {
    try {
      setActionLoading(itemId);
      await itemsApi.deleteItem(itemId);

      setItems((prev) => prev.filter((item) => item.id !== itemId));
      toast.success("Product deleted");
      onRefresh?.();
    } catch (err) {
      console.error("Error deleting:", err);
      toast.error("Failed to delete product");
    } finally {
      setActionLoading(null);
      setDeleteConfirm(null);
    }
  };

  // Get unique categories from items
  const categories = Array.from(new Set(items.map((item) => item.category)));

  // Stats
  const stats = {
    total: items.length,
    active: items.filter((i) => i.status === "ACTIVE").length,
    hidden: items.filter((i) => i.status === "HIDDEN").length,
    lowStock: items.filter((i) => {
      const stock = i.totalStock || i.quantity || 0;
      return stock > 0 && stock <= 5;
    }).length,
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2
              className="text-xl font-bold text-gray-900"
              style={{ fontFamily: "Clash Display" }}
            >
              My Products
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {stats.total} total • {stats.active} active • {stats.lowStock} low
              stock
            </p>
          </div>
          <Link
            href="/create-item"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            style={{ fontFamily: "Clash Display" }}
          >
            <Plus size={18} />
            Add Product
          </Link>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black"
              style={{ fontFamily: "Clash Display" }}
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black"
              style={{ fontFamily: "Clash Display" }}
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="HIDDEN">Hidden</option>
              <option value="SOLD">Sold</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black"
              style={{ fontFamily: "Clash Display" }}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black"
              style={{ fontFamily: "Clash Display" }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
              <option value="name">Name A-Z</option>
              <option value="stock-low">Low Stock</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3
            className="text-lg font-bold text-gray-900 mb-2"
            style={{ fontFamily: "Clash Display" }}
          >
            {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
              ? "No products found"
              : "No products yet"}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
              ? "Try adjusting your filters"
              : "Start by adding your first product"}
          </p>
          {!searchQuery &&
            statusFilter === "all" &&
            categoryFilter === "all" && (
              <Link
                href="/create-item"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
                style={{ fontFamily: "Clash Display" }}
              >
                <Plus size={18} />
                Add Product
              </Link>
            )}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Product */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                          {item.images?.[0]?.imageUrl || item.imageUrls?.[0] ? (
                            <Image
                              src={
                                item.images?.[0]?.imageUrl ||
                                item.imageUrls?.[0] ||
                                ""
                              }
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={20} className="text-gray-400" />
                            </div>
                          )}
                          {item.isFeatured && (
                            <div className="absolute top-0 right-0 w-4 h-4 bg-yellow-400 flex items-center justify-center">
                              <Star
                                size={10}
                                fill="white"
                                className="text-white"
                              />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/items/${item.id}`}
                            className="font-medium text-gray-900 hover:text-black truncate block"
                            style={{ fontFamily: "Clash Display" }}
                          >
                            {item.title}
                          </Link>
                          <p className="text-xs text-gray-500">
                            {item.category}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 font-mono">
                        {item.sku || "-"}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4">
                      <span
                        className="text-sm font-medium text-gray-900"
                        style={{ fontFamily: "Clash Display" }}
                      >
                        {formatPrice(item.price)}
                      </span>
                      {item.hasVariants &&
                        item.variants &&
                        item.variants.length > 0 && (
                          <p className="text-xs text-gray-500">
                            {item.variants.length} variants
                          </p>
                        )}
                    </td>

                    {/* Stock */}
                    <td className="px-6 py-4">
                      {(() => {
                        const stockStatus = getStockStatus(item);
                        const stock = item.totalStock || item.quantity || 0;
                        return (
                          <span
                            className={`text-sm font-medium ${
                              stockStatus.color === "red"
                                ? "text-red-600"
                                : stockStatus.color === "orange"
                                  ? "text-orange-600"
                                  : "text-green-600"
                            }`}
                            style={{ fontFamily: "Clash Display" }}
                          >
                            {stock}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          item.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : item.status === "SOLD"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Stats */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span title="Views">👁️ {item.viewCount}</span>
                        <span title="Likes">❤️ {item.likeCount}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() =>
                            setOpenDropdown(
                              openDropdown === item.id ? null : item.id,
                            )
                          }
                          disabled={actionLoading === item.id}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {actionLoading === item.id ? (
                            <Loader2
                              size={18}
                              className="animate-spin text-gray-400"
                            />
                          ) : (
                            <MoreVertical size={18} className="text-gray-400" />
                          )}
                        </button>

                        {/* Dropdown Menu */}
                        {openDropdown === item.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenDropdown(null)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                              <Link
                                href={`/items/${item.id}`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setOpenDropdown(null)}
                              >
                                <Eye size={16} />
                                View Product
                              </Link>
                              <Link
                                href={`/dashboard/seller/items/${item.id}/edit`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setOpenDropdown(null)}
                              >
                                <Edit size={16} />
                                Edit Product
                              </Link>
                              <button
                                onClick={() => handleDuplicate(item.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Copy size={16} />
                                Duplicate
                              </button>
                              <button
                                onClick={() =>
                                  handleToggleStatus(item.id, item.status)
                                }
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                {item.status === "ACTIVE" ? (
                                  <>
                                    <EyeOff size={16} />
                                    Hide Product
                                  </>
                                ) : (
                                  <>
                                    <Eye size={16} />
                                    Show Product
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  handleToggleFeatured(
                                    item.id,
                                    item.isFeatured || false,
                                  )
                                }
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Star size={16} />
                                {item.isFeatured
                                  ? "Remove Featured"
                                  : "Mark Featured"}
                              </button>
                              <hr className="my-2" />
                              <button
                                onClick={() => setDeleteConfirm(item.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                                Delete Product
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination placeholder */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {filteredItems.length} of {items.length} products
            </p>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3
                  className="text-lg font-bold text-gray-900"
                  style={{ fontFamily: "Clash Display" }}
                >
                  Delete Product?
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this product? All data associated
              with it will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "Clash Display" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={actionLoading === deleteConfirm}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                style={{ fontFamily: "Clash Display" }}
              >
                {actionLoading === deleteConfirm ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
