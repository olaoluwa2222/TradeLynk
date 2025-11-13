// types/auth.ts
/**
 * Authentication Types for Campus Marketplace
 */

export interface User {
  userId: number;
  email: string;
  name: string;
  role: "BUYER" | "SELLER" | "BOTH" | "ADMIN";
  verified: boolean;
  profilePictureUrl?: string;
  isEmailVerified?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    userId: number;
    email: string;
    name: string;
    role: "BUYER" | "SELLER" | "BOTH" | "ADMIN";
    profilePictureUrl?: string;
    token: string;
    tokenType: string;
    expiresIn: number;
    createdAt: string;
    isEmailVerified: boolean;
    message: string;
  };
  timestamp: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface ApiError {
  message: string;
  status: number;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  verifyEmail: (token: string) => Promise<string>;
  resendVerification: () => Promise<string>;
}
