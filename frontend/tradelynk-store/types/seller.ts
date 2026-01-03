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
  totalItems: number;
  totalLikes: number;
  totalSales: number;
  memberSince: string;
  isVerified: boolean;
  items: StorefrontItem[];
}

export interface StorefrontItem {
  id: number;
  title: string;
  price: number;
  imageUrl?: string;
  likeCount: number;
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
