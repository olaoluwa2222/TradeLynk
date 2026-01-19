// types/items.ts - Complete Item types for TradeLynk

// ============================================
// PRODUCT IMAGE TYPES
// ============================================
export interface ProductImage {
  id: number;
  imageUrl: string;
  thumbnailUrl: string | null;
  altText: string;
  position: number;
  isPrimary: boolean;
  width: number | null;
  height: number | null;
  createdAt: string;
  thumbnail: string;
  mediumUrl: string;
}

// ============================================
// PRODUCT VARIANT TYPES
// ============================================
export interface ProductVariant {
  id: number;
  itemId: number;
  variantName: string;
  sku: string;
  price: number | null;
  effectivePrice: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  stock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorders: boolean;
  imageUrl: string | null;
  isDefault: boolean;
  position: number;
  weightInGrams: number | null;
  variantOptions: Record<string, string>;
  isAvailable: boolean;
  isInStock: boolean;
  isLowStock: boolean;
  profitMargin: number | null;
  profitPercentage: number | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SHIPPING PROFILE TYPES
// ============================================
export interface ShippingProfile {
  id: number;
  name: string;
  description: string | null;
  flatRate: number | null;
  perKgRate: number | null;
  freeShippingThreshold: number | null;
  estimatedDays: string | null;
}

// ============================================
// COLLECTION TYPES
// ============================================
export interface CollectionItem {
  id: number;
  name: string;
  slug: string;
  isFeatured: boolean;
}

export interface Collection {
  id: number;
  sellerId: number;
  sellerName: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  items: Item[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionSummary {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  itemCount: number;
}

// ============================================
// MAIN ITEM/PRODUCT TYPE
// ============================================
export interface Item {
  id: number;
  sellerId: number;
  sellerName: string;
  sellerEmail: string;
  sellerUsername: string;
  title: string;
  description: string;
  price: number;
  category: ItemCategory;
  condition: ItemCondition;
  quantity: number;
  expiryDate: string | null;
  imageUrls: string[];
  likeCount: number;
  viewCount: number;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
  slug: string;
  sku: string;
  compareAtPrice: number | null;
  costPrice: number | null;
  isTaxable: boolean;
  hasVariants: boolean;
  isDigital: boolean;
  downloadUrl: string | null;
  downloadLimit: number | null;
  trackInventory: boolean;
  lowStockThreshold: number;
  allowBackorders: boolean;
  weightInGrams: number | null;
  lengthInCm: number | null;
  widthInCm: number | null;
  heightInCm: number | null;
  isFeatured: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  vendor: string | null;
  productType: string | null;
  variants: ProductVariant[];
  images: ProductImage[];
  primaryImage: ProductImage | null;
  collections: Collection[];
  tags: string[];
  shippingProfile: ShippingProfile | null;
  isInStock: boolean;
  isLowStock: boolean;
  totalStock: number;
  lowestPrice: number;
  highestPrice: number;
  profitMargin: number | null;
  profitPercentage: number | null;
  likedByCurrentUser: boolean;
  displayPrice: string;
}

// ============================================
// ITEM ENUMS
// ============================================
export type ItemCategory =
  | "ELECTRONICS"
  | "BOOKS"
  | "CLOTHING"
  | "FOOD"
  | "LIGHT"
  | "TRANSPORTATION"
  | "ACCESSORIES"
  | "HOME"
  | "BEAUTY"
  | "SPORTS"
  | "OTHER";

export type ItemCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";

export type ItemStatus =
  | "ACTIVE"
  | "DRAFT"
  | "SOLD"
  | "HIDDEN"
  | "EXPIRED"
  | "OUT_OF_STOCK";

// ============================================
// API RESPONSE TYPES
// ============================================
export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ItemsApiResponse {
  success: boolean;
  message?: string;
  data: PaginatedResponse<Item>;
}

export interface SingleItemResponse {
  success: boolean;
  message?: string;
  data: Item;
}

// ============================================
// CREATE/UPDATE ITEM TYPES
// ============================================
export interface CreateVariantInput {
  variantName: string;
  price?: number;
  stock: number;
  variantOptions: Record<string, string>;
  imageUrl?: string;
}

export interface CreateItemInput {
  title: string;
  description: string;
  price: number;
  category: ItemCategory;
  condition: ItemCondition;
  quantity?: number;
  hasVariants?: boolean;
  variants?: CreateVariantInput[];
  imageUrls?: string[];
  tags?: string[];
  weightInGrams?: number;
  lengthInCm?: number;
  widthInCm?: number;
  heightInCm?: number;
  expiryDate?: string;
  compareAtPrice?: number;
  costPrice?: number;
  isTaxable?: boolean;
  isDigital?: boolean;
  downloadUrl?: string;
  downloadLimit?: number;
  trackInventory?: boolean;
  lowStockThreshold?: number;
  allowBackorders?: boolean;
  isFeatured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  vendor?: string;
  productType?: string;
  shippingProfileId?: number;
  collectionIds?: number[];
}

export interface UpdateItemInput extends Partial<CreateItemInput> {
  id: number;
}

// ============================================
// FILTER & SORT TYPES
// ============================================
export type SortOption =
  | "RECENT"
  | "PRICE_LOW"
  | "PRICE_HIGH"
  | "POPULAR"
  | "TRENDING";

export interface ItemFilters {
  category?: ItemCategory;
  condition?: ItemCondition;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  sellerId?: number;
  hasVariants?: boolean;
  inStock?: boolean;
  search?: string;
}

// ============================================
// SELLER ITEM TYPES (Dashboard)
// ============================================
export interface SellerItemSummary {
  id: number;
  title: string;
  slug: string;
  sku: string;
  price: number;
  displayPrice: string;
  primaryImage: ProductImage | null;
  status: ItemStatus;
  totalStock: number;
  likeCount: number;
  viewCount: number;
  hasVariants: boolean;
  variantCount: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// UTILITY TYPES
// ============================================
export interface VariantOption {
  name: string;
  values: string[];
}

export interface PriceRange {
  min: number;
  max: number;
}

// Helper function to format price
export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
};

// Helper function to get price display
export const getPriceDisplay = (item: Item): string => {
  if (item.displayPrice) return item.displayPrice;
  if (item.hasVariants && item.lowestPrice !== item.highestPrice) {
    return `${formatPrice(item.lowestPrice)} - ${formatPrice(item.highestPrice)}`;
  }
  return formatPrice(item.price);
};

// Helper function to get stock status
export const getStockStatus = (
  item: Item,
): { label: string; color: string } => {
  if (!item.isInStock) {
    return { label: "Out of Stock", color: "red" };
  }
  if (item.isLowStock) {
    return { label: `Low Stock: ${item.totalStock} left`, color: "orange" };
  }
  return { label: `${item.totalStock} in stock`, color: "green" };
};

// Helper function to get condition label
export const getConditionLabel = (condition: ItemCondition): string => {
  const labels: Record<ItemCondition, string> = {
    NEW: "New",
    LIKE_NEW: "Like New",
    GOOD: "Good",
    FAIR: "Fair",
    POOR: "Poor",
  };
  return labels[condition] || condition;
};
