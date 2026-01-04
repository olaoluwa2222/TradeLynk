// types/seller.ts

export interface StorefrontData {
  userId: number;
  username: string;
  name: string;
  email: string;
  profilePictureUrl?: string;
  businessName?: string;
  storeTagline?: string;
  bio?: string;
  logoUrl?: string;
  bannerImageUrl?: string;
  address?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  instagramHandle?: string;
  twitterHandle?: string;
  facebookHandle?: string;
  totalItems: number;
  totalLikes: number;
  totalSales: number;
  memberSince: string;
  isVerified: boolean;
  items?: StorefrontItem[]; // Made optional since backend might not always include it
  // Theme & Customization
  theme?: string;
  primaryColor?: string;
  secondaryColor?: string;
  layoutType?: string;
}

export interface StorefrontItem {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  imageUrls: string[]; // Array from backend
  imageUrl?: string; // Computed from imageUrls[0]
  likeCount: number;
  viewCount: number;
  status: string;
  createdAt: string;
}

export interface SellerActivationData {
  // Existing fields
  businessName?: string;
  campusAddress?: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  agreedToTerms: boolean;

  // NEW fields
  username: string;
  storeTagline: string;
  bio: string;
  logoUrl?: string;
  bannerImageUrl?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  instagramHandle?: string;
  twitterHandle?: string;
  storeScreenshotUrl?: string;

  // Theme & Customization
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  layoutType: string;
}

export interface UsernameCheckResponse {
  success: boolean;
  data: {
    available: boolean;
    message: string;
  };
}

export interface SellerStats {
  totalItems: number;
  totalLikes: number;
  totalSales: number;
}

// ============================================
// THEME TYPES & CONFIGURATIONS
// ============================================

export type Theme =
  | "modern-clean"
  | "bold-vibrant"
  | "minimalist-luxury"
  | "campus-friendly"
  | "product-showcase";

export type LayoutType = "single-page" | "multi-page";

export interface ThemeConfig {
  id: Theme;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  layoutType: LayoutType;
  previewImage: string;
  features: string[];
}

export const THEMES: ThemeConfig[] = [
  {
    id: "modern-clean",
    name: "Modern Clean",
    description: "Sleek, minimal & professional",
    primaryColor: "#0F172A",
    secondaryColor: "#6366F1",
    layoutType: "multi-page",
    previewImage: "/themes/modern-clean.png",
    features: ["Minimal", "Professional", "Elegant"],
  },
  {
    id: "bold-vibrant",
    name: "Bold & Vibrant",
    description: "Eye-catching gradient style",
    primaryColor: "#7C3AED",
    secondaryColor: "#EC4899",
    layoutType: "multi-page",
    previewImage: "/themes/bold-vibrant.png",
    features: ["Gradient", "Energetic", "Modern"],
  },
  {
    id: "minimalist-luxury",
    name: "Minimalist Luxury",
    description: "Premium dark elegance",
    primaryColor: "#D4AF37",
    secondaryColor: "#1C1C1C",
    layoutType: "multi-page",
    previewImage: "/themes/minimalist-luxury.png",
    features: ["Luxury", "Dark mode", "Premium"],
  },
  {
    id: "campus-friendly",
    name: "Campus Vibes",
    description: "Fresh & youthful energy",
    primaryColor: "#06B6D4",
    secondaryColor: "#8B5CF6",
    layoutType: "multi-page",
    previewImage: "/themes/campus-friendly.png",
    features: ["Fresh", "Youthful", "Trendy"],
  },
  {
    id: "product-showcase",
    name: "Dark Showcase",
    description: "Products take center stage",
    primaryColor: "#F97316",
    secondaryColor: "#0F0F0F",
    layoutType: "multi-page",
    previewImage: "/themes/product-showcase.png",
    features: ["Dark", "Product focus", "Gallery"],
  },
];
