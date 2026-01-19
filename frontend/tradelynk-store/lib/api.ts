// lib/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  VerifyEmailResponse,
} from "@/types/auth";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: "https://tradelynk-api-t598w.ondigitalocean.app/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000, // 10 seconds
});

// Token storage utilities
const TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clearTokens: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle 401 errors and refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();

      if (!refreshToken) {
        // No refresh token, redirect to login
        tokenStorage.clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        // Try to refresh the token
        const response = await axios.post<AuthResponse>(
          "https://tradelynk-api-t598w.ondigitalocean.app/api/v1/auth/refresh",
          { refreshToken },
        );

        const { token } = response.data.data;
        const newRefreshToken = (response.data.data as any).refreshToken || "";

        // Store new tokens
        tokenStorage.setTokens(token, newRefreshToken);

        // Update authorization header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }

        // Process queued requests
        processQueue(null, token);

        isRefreshing = false;

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        processQueue(refreshError as Error, null);
        tokenStorage.clearTokens();

        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Initialize retry count
    if (!config.__retryCount) {
      config.__retryCount = 0;
    }

    // Retry on timeout or network errors
    const shouldRetry =
      (error.code === "ECONNABORTED" || // Timeout
        error.code === "ERR_NETWORK" || // Network error
        error.response?.status >= 500) && // Server error
      config.__retryCount < 3; // Max 3 retries

    if (shouldRetry) {
      config.__retryCount += 1;

      const delay = 1000 * config.__retryCount; // 1s, 2s, 3s
      console.log(
        `🔄 Retrying request (attempt ${config.__retryCount}/3) after ${delay}ms:`,
        config.url,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));

      return api(config);
    }

    return Promise.reject(error);
  },
);

// Auth API methods
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", data);
    const { token, tokenType } = response.data.data;
    // Extract refresh token if provided, otherwise use empty string
    const refreshToken = (response.data.data as any).refreshToken || "";
    tokenStorage.setTokens(token, refreshToken);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      "/auth/register",
      data,
    );
    return response.data;
  },

  // ✅ NEW: Verify email with token
  verifyEmail: async (token: string): Promise<VerifyEmailResponse> => {
    const response = await api.get<VerifyEmailResponse>(
      `/auth/verify?token=${token}`,
    );
    return response.data;
  },

  // ✅ NEW: Resend verification email (requires authentication)
  resendVerification: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      "/auth/resend-verification",
      { email },
    );
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      tokenStorage.clearTokens();
    }
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await api.post<AuthResponse>("/auth/refresh", {
      refreshToken,
    });

    const { token } = response.data.data;
    const newRefreshToken = (response.data.data as any).refreshToken || "";
    tokenStorage.setTokens(token, newRefreshToken);

    return response.data;
  },

  // Add this to your authApi object in lib/api.ts

  getCurrentUser: async () => {
    const response = await api.get("/users/me");
    const apiResponse = response.data;

    console.log("🔍 [API] Raw /users/me response:", apiResponse);

    if (!apiResponse.success || !apiResponse.data) {
      throw new Error("Failed to get user data");
    }

    const rawData = apiResponse.data;

    // ✅ Backend returns "id" not "userId"
    const userId = rawData.id;

    if (!userId) {
      console.error("❌ [API] No userId found in response:", rawData);
      throw new Error("Invalid user data: missing userId");
    }

    const normalizedUser = {
      userId: Number(userId), // ✅ Convert to number
      email: rawData.email,
      name: rawData.name,
      role: rawData.role,
      verified: rawData.isEmailVerified || false,
      profilePictureUrl: rawData.profilePictureUrl,
      isEmailVerified: rawData.isEmailVerified || false,
    };

    console.log("✅ [API] Normalized user:", {
      userId: normalizedUser.userId,
      userIdType: typeof normalizedUser.userId,
    });

    return normalizedUser;
  },
};

// Items API methods
export const itemsApi = {
  getTrendingItems: async (days: number = 7, limit: number = 10) => {
    const response = await api.get("/items/trending", {
      params: { days, limit },
    });
    return response.data;
  },

  getSearchSuggestions: async (query: string) => {
    const response = await api.get("/items/suggestions", {
      params: { q: query },
    });
    return response.data;
  },

  getItemById: async (id: string | number) => {
    console.log(`🔍 Fetching item ${id} from: /items/${id}`);
    const response = await api.get(`/items/${id}`);
    console.log(
      `📦 Item ${id} response:`,
      JSON.stringify(response.data, null, 2),
    );
    return response.data;
  },

  getCategoryItems: async (
    category: string,
    page: number = 0,
    limit: number = 20,
  ) => {
    const response = await api.get("/items/category", {
      params: { category, page, limit },
    });
    return response.data;
  },

  searchItems: async (query: string, page: number = 0, limit: number = 20) => {
    const response = await api.get("/items/search", {
      params: { q: query, page, limit },
    });
    return response.data;
  },

  likeItem: async (itemId: number | string) => {
    const response = await api.post(`/items/${itemId}/like`);
    return response.data;
  },

  unlikeItem: async (itemId: number | string) => {
    const response = await api.delete(`/items/${itemId}/like`);
    return response.data;
  },

  // Get all active items with pagination and filters
  getAllItems: async (
    page: number = 0,
    size: number = 10,
    category?: string,
    minPrice?: number,
    maxPrice?: number,
    condition?: string,
    sort: string = "RECENT",
  ) => {
    // If category is specified, use the category-specific endpoint
    if (category) {
      return itemsApi.getItemsByCategory(category, page, size);
    }

    const params: any = { page, size, sort };
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (condition) params.condition = condition;

    const response = await api.get("/items", { params });
    return response.data;
  },

  // Get items by category
  getItemsByCategory: async (
    category: string,
    page: number = 0,
    size: number = 20,
  ) => {
    const response = await api.get(`/items/category/${category}`, {
      params: { page, size },
    });
    return response.data;
  },

  // Create new item (with full variant support)
  createItem: async (data: {
    title: string;
    description: string;
    category: string;
    price: number;
    condition: string;
    quantity?: number;
    hasVariants?: boolean;
    variants?: {
      variantName: string;
      price?: number;
      stock: number;
      variantOptions: Record<string, string>;
      imageUrl?: string;
    }[];
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
    trackInventory?: boolean;
    lowStockThreshold?: number;
    allowBackorders?: boolean;
    isFeatured?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    vendor?: string;
    productType?: string;
    shippingProfileId?: number;
  }) => {
    const response = await api.post("/items", data);
    return response.data;
  },

  // Update existing item
  updateItem: async (
    id: number,
    data: {
      title?: string;
      description?: string;
      category?: string;
      price?: number;
      condition?: string;
      quantity?: number;
      hasVariants?: boolean;
      variants?: {
        id?: number;
        variantName: string;
        price?: number;
        stock: number;
        variantOptions: Record<string, string>;
        imageUrl?: string;
      }[];
      imageUrls?: string[];
      tags?: string[];
      weightInGrams?: number;
      expiryDate?: string;
      isFeatured?: boolean;
      metaTitle?: string;
      metaDescription?: string;
      status?: string;
    },
  ) => {
    const response = await api.put(`/items/${id}`, data);
    return response.data;
  },

  // Delete an item
  deleteItem: async (itemId: number) => {
    const response = await api.delete(`/items/${itemId}`);
    return response.data;
  },

  // Get seller's own items
  getMyItems: async (page: number = 0, size: number = 20, status?: string) => {
    const params: Record<string, any> = { page, size };
    if (status) params.status = status;
    const response = await api.get("/items/my-items", { params });
    return response.data;
  },

  // Report an item
  reportItem: async (itemId: number) => {
    const response = await api.post(`/items/${itemId}/report`);
    return response.data;
  },

  // Get items by seller ID
  getItemsBySeller: async (
    sellerId: number,
    page: number = 0,
    size: number = 20,
  ) => {
    const response = await api.get(`/items/seller/${sellerId}`, {
      params: { page, size },
    });
    return response.data;
  },

  // Duplicate an item
  duplicateItem: async (itemId: number) => {
    const response = await api.post(`/items/${itemId}/duplicate`);
    return response.data;
  },

  // Toggle featured status
  toggleFeatured: async (itemId: number) => {
    const response = await api.put(`/items/${itemId}/toggle-featured`);
    return response.data;
  },

  // Update item status (ACTIVE, HIDDEN, etc.)
  updateStatus: async (itemId: number, status: string) => {
    const response = await api.put(`/items/${itemId}/status`, { status });
    return response.data;
  },

  // Get items by tag
  getItemsByTag: async (tag: string, page: number = 0, size: number = 20) => {
    const response = await api.get(`/items/tag/${encodeURIComponent(tag)}`, {
      params: { page, size },
    });
    return response.data;
  },

  // Get related items
  getRelatedItems: async (itemId: number, limit: number = 8) => {
    const response = await api.get(`/items/${itemId}/related`, {
      params: { limit },
    });
    return response.data;
  },
};

// Collections API methods
export const collectionsApi = {
  // Get seller's collections
  getMyCollections: async (activeOnly?: boolean) => {
    const params = activeOnly !== undefined ? { activeOnly } : {};
    const response = await api.get("/collections/my-collections", { params });
    return response.data;
  },

  // Get collection by ID
  getById: async (id: number) => {
    const response = await api.get(`/collections/${id}`);
    return response.data;
  },

  // Get collection by slug
  getBySlug: async (slug: string) => {
    const response = await api.get(`/collections/slug/${slug}`);
    return response.data;
  },

  // Get seller's public collections
  getSellerCollections: async (
    sellerId: number,
    activeOnly: boolean = true,
  ) => {
    const response = await api.get(`/collections/seller/${sellerId}`, {
      params: { activeOnly },
    });
    return response.data;
  },

  // Get seller's featured collections
  getFeaturedCollections: async (sellerId: number) => {
    const response = await api.get(`/collections/seller/${sellerId}/featured`);
    return response.data;
  },

  // Create new collection
  createCollection: async (data: {
    name: string;
    description?: string;
    imageUrl?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    displayOrder?: number;
    metaTitle?: string;
    metaDescription?: string;
    itemIds?: number[];
  }) => {
    const response = await api.post("/collections", data);
    return response.data;
  },

  // Update collection
  updateCollection: async (
    id: number,
    data: {
      name?: string;
      description?: string;
      imageUrl?: string;
      isActive?: boolean;
      isFeatured?: boolean;
      displayOrder?: number;
      metaTitle?: string;
      metaDescription?: string;
      itemIds?: number[];
    },
  ) => {
    const response = await api.put(`/collections/${id}`, data);
    return response.data;
  },

  // Add items to collection
  addItems: async (id: number, itemIds: number[]) => {
    const response = await api.post(`/collections/${id}/items`, { itemIds });
    return response.data;
  },

  // Remove items from collection
  removeItems: async (id: number, itemIds: number[]) => {
    const response = await api.delete(`/collections/${id}/items`, {
      data: { itemIds },
    });
    return response.data;
  },

  // Delete collection
  deleteCollection: async (id: number) => {
    const response = await api.delete(`/collections/${id}`);
    return response.data;
  },
};

// Shipping Profiles API methods
export const shippingProfilesApi = {
  // Get seller's shipping profiles
  getMyShippingProfiles: async () => {
    const response = await api.get("/shipping-profiles/my-profiles");
    return response.data;
  },

  // Create new shipping profile
  createShippingProfile: async (data: {
    name: string;
    shippingMethod: string;
    flatRateCost?: number;
    costPerKg?: number;
    freeShippingThreshold?: number;
    minDeliveryDays?: number;
    maxDeliveryDays?: number;
    isDefault?: boolean;
    notes?: string;
  }) => {
    const response = await api.post("/shipping-profiles", data);
    return response.data;
  },
};

// Sellers API methods
export const sellersApi = {
  // Fetch list of supported banks
  getBanks: async () => {
    const response = await api.get("/sellers/banks");
    return response.data;
  },

  // Validate bank account details
  validateAccount: async (accountNumber: string, bankCode: string) => {
    const response = await api.get("/sellers/validate-account", {
      params: { accountNumber, bankCode },
    });
    return response.data;
  },

  // Check username availability
  checkUsername: async (username: string) => {
    const response = await api.get("/sellers/check-username", {
      params: { username },
    });
    return response.data;
  },

  // Get storefront by username (public)
  getStorefront: async (username: string) => {
    const response = await api.get(`/sellers/${username}/storefront`);
    return response.data;
  },

  // Activate seller account
  activateSeller: async (data: {
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

    // Theme fields
    theme: string;
    primaryColor: string;
    secondaryColor: string;
    layoutType: string;
  }) => {
    const response = await api.post("/sellers/activate", data);
    return response.data;
  },

  // Get seller status
  getSellerStatus: async () => {
    const response = await api.get("/sellers/me/status");
    return response.data;
  },

  // Get current seller's profile/info (includes username)
  getMySellerProfile: async () => {
    const response = await api.get("/sellers/me/profile");
    return response.data;
  },

  // Update seller profile
  updateSellerProfile: async (data: {
    businessName?: string;
    storeTagline?: string;
    bio?: string;
    logoUrl?: string;
    bannerImageUrl?: string;
    phoneNumber?: string;
    whatsappNumber?: string;
    instagramHandle?: string;
    twitterHandle?: string;
    theme?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }) => {
    const response = await api.put("/sellers/me/profile", data);
    return response.data;
  },
};

// Chat API methods
export const chatsApi = {
  // Create new chat
  createChat: async (data: {
    itemId: number;
    buyerId?: number;
    sellerId?: number;
  }) => {
    const response = await api.post("/chats", data);
    return response.data;
  },

  // Get all user chats
  getChats: async () => {
    const response = await api.get("/chats");
    return response.data;
  },

  // Get specific chat
  getChatDetails: async (chatId: string) => {
    const response = await api.get(`/chats/${chatId}`);
    return response.data;
  },

  // Get messages in a chat
  getMessages: async (chatId: string, page: number = 0, size: number = 50) => {
    const response = await api.get(`/chats/${chatId}/messages`, {
      params: { page, size },
    });
    return response.data;
  },

  // Send message
  sendMessage: async (data: {
    chatId: string;
    content: string;
    imageUrls?: string[];
  }) => {
    const response = await api.post("/chats/messages", data);
    return response.data;
  },

  // Mark chat as read
  markAsRead: async (chatId: string) => {
    const response = await api.put(`/chats/${chatId}/mark-read`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get("/chats/unread-count");
    return response.data;
  },

  // Find chat by item
  getChatByItem: async (itemId: number) => {
    const response = await api.get(`/chats/by-item/${itemId}`);
    return response.data;
  },

  // Upload image
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/chats/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Delete chat
  deleteChat: async (chatId: string) => {
    const response = await api.delete(`/chats/${chatId}`);
    return response.data;
  },

  // Save FCM token
  saveDeviceToken: async (data: {
    token?: string;
    deviceToken?: string;
    deviceType: string;
    deviceName: string;
  }) => {
    // Support both 'token' and 'deviceToken' field names for backend compatibility
    const payload = {
      deviceToken: data.token || data.deviceToken,
      deviceType: data.deviceType,
      deviceName: data.deviceName,
    };
    const response = await api.post("/chats/device-token", payload);
    return response.data;
  },

  // Remove FCM token
  removeDeviceToken: async (deviceToken: string) => {
    const response = await api.delete("/chats/device-token", {
      data: { deviceToken },
    });
    return response.data;
  },
};

export const paymentsApi = {
  // Initialize payment for an item
  initializePayment: async (data: {
    itemId: number;
    amount: number;
    deliveryAddress: string;
  }) => {
    const response = await api.post("/payments/initialize", data);
    return response.data;
  },

  // Verify payment status
  verifyPayment: async (reference: string) => {
    const response = await api.get(`/payments/verify/${reference}`);
    return response.data;
  },

  // Get user's payment history
  getMyPayments: async (page: number = 0, size: number = 10) => {
    const response = await api.get("/payments/my-payments", {
      params: { page, size },
    });
    return response.data;
  },

  // Get seller's received payments
  getSellerPayments: async (page: number = 0, size: number = 10) => {
    const response = await api.get("/payments/seller/payments", {
      params: { page, size },
    });
    return response.data;
  },

  // Get payment details by ID
  getPaymentById: async (paymentId: number) => {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  },
};

export const ordersApi = {
  // Create order (usually auto-created by webhook, but can be manual)
  createOrder: async (data: { itemId: number; deliveryAddress: string }) => {
    const response = await api.post("/orders", data);
    return response.data;
  },

  // Get buyer's orders (purchases)
  getMyPurchases: async (page: number = 0, size: number = 10) => {
    const response = await api.get("/orders/my-purchases", {
      params: { page, size },
    });
    return response.data;
  },

  // Get seller's orders (sales)
  getMySales: async (page: number = 0, size: number = 10) => {
    const response = await api.get("/orders/my-sales", {
      params: { page, size },
    });
    return response.data;
  },

  // Get single order details
  getOrderById: async (orderId: number) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  // Mark order as delivered (buyer only) - OLD METHOD (kept for backwards compatibility)
  markAsDelivered: async (orderId: number) => {
    const response = await api.put(`/orders/${orderId}/mark-delivered`);
    return response.data;
  },

  // Cancel order (buyer or seller)
  cancelOrder: async (orderId: number, reason: string) => {
    const response = await api.put(`/orders/${orderId}/cancel`, { reason });
    return response.data;
  },

  // Get order statistics (for dashboard)
  getOrderStatistics: async () => {
    const response = await api.get("/orders/statistics");
    return response.data;
  },

  // ===== NEW ESCROW SYSTEM ENDPOINTS =====

  // Mark order as shipped (seller only)
  markAsShipped: async (orderId: number) => {
    const response = await api.put(`/orders/${orderId}/mark-shipped`);
    return response.data;
  },

  // Confirm delivery (buyer only) - releases escrow payment to seller
  confirmDelivery: async (orderId: number) => {
    const response = await api.put(`/orders/${orderId}/confirm-delivery`);
    return response.data;
  },
};

// Disputes API methods
export const disputesApi = {
  // Create a dispute for an order (buyer only)
  createDispute: async (
    orderId: number,
    data: { reason: string; description: string },
  ) => {
    const response = await api.post(`/disputes/orders/${orderId}`, data);
    return response.data;
  },

  // Get buyer's disputes
  getMyDisputes: async (page: number = 0, size: number = 10) => {
    const response = await api.get("/disputes/my-disputes", {
      params: { page, size },
    });
    return response.data;
  },

  // Get seller's disputes
  getSellerDisputes: async (page: number = 0, size: number = 10) => {
    const response = await api.get("/disputes/seller/disputes", {
      params: { page, size },
    });
    return response.data;
  },

  // Get dispute by ID
  getDisputeById: async (disputeId: number) => {
    const response = await api.get(`/disputes/${disputeId}`);
    return response.data;
  },
};

// Analytics API - Seller dashboard analytics
export const analyticsApi = {
  getSellerAnalytics: async () => {
    const response = await api.get("/sellers/me/analytics");
    return response.data;
  },
};

// Images API - Upload and manage images
export const imagesApi = {
  // Upload single image
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await api.post("/images/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Upload multiple images (max 5)
  uploadMultipleImages: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const response = await api.post("/images/upload-multiple", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Delete single image
  deleteImage: async (publicId: string) => {
    const response = await api.delete("/images", {
      params: { publicId },
    });
    return response.data;
  },

  // Delete multiple images
  deleteMultipleImages: async (publicIds: string[]) => {
    const response = await api.delete("/images/multiple", {
      data: { publicIds },
    });
    return response.data;
  },

  // Extract public ID from Cloudinary URL
  extractPublicId: async (url: string) => {
    const response = await api.post("/images/extract-public-id", { url });
    return response.data;
  },
};

// AI API methods
export const aiApi = {
  // Improve text using AI (bio or tagline)
  improveText: async (text: string, type: "bio" | "tagline") => {
    const response = await api.post("/ai/improve-text", {
      text,
      type,
    });
    return response.data;
  },

  // Check if AI service is available
  checkHealth: async () => {
    const response = await api.get("/ai/health");
    return response.data;
  },
};

export default api;
