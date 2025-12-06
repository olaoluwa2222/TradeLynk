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
  baseURL: "http://localhost:8080/api/v1",
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
  }
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
          "http://localhost:8080/api/v1/auth/refresh",
          { refreshToken }
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
  }
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
        config.url
      );

      await new Promise((resolve) => setTimeout(resolve, delay));

      return api(config);
    }

    return Promise.reject(error);
  }
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
      data
    );
    return response.data;
  },

  // ✅ NEW: Verify email with token
  verifyEmail: async (token: string): Promise<VerifyEmailResponse> => {
    const response = await api.get<VerifyEmailResponse>(
      `/auth/verify?token=${token}`
    );
    return response.data;
  },

  // ✅ NEW: Resend verification email (requires authentication)
  resendVerification: async (): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      "/auth/resend-verification"
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

  getCurrentUser: async () => {
    const response = await api.get("/users/me");
    return response.data;
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
    const response = await api.get(`/items/${id}`);
    return response.data;
  },

  getCategoryItems: async (
    category: string,
    page: number = 0,
    limit: number = 20
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
    sort: string = "RECENT"
  ) => {
    const params: any = { page, size, sort };
    if (category) params.category = category;
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
    size: number = 20
  ) => {
    const response = await api.get(`/items/category/${category}`, {
      params: { page, size },
    });
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

  // Activate seller account
  activateSeller: async (data: {
    businessName?: string;
    campusAddress?: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    agreedToTerms: boolean;
  }) => {
    const response = await api.post("/sellers/activate", data);
    return response.data;
  },

  // Get seller status
  getSellerStatus: async () => {
    const response = await api.get("/sellers/me/status");
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

export default api;
