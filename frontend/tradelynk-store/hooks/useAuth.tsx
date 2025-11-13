// hooks/useAuth.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { authApi, tokenStorage } from "@/lib/api";
import { User, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Check if user is authenticated on mount
  const checkAuth = useCallback(async () => {
    const token = tokenStorage.getAccessToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // Try to get current user from backend
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Auth check failed:", error);
      tokenStorage.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });

      setUser({
        userId: response.data.userId,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role,
        verified: response.data.isEmailVerified, // ✅ FIXED: Access from response.data
        isEmailVerified: response.data.isEmailVerified, // ✅ NEW: Also store here
        profilePictureUrl: response.data.profilePictureUrl,
      });

      router.push("/");
    } catch (error: any) {
      // Check for unverified email error (403)
      if (error.response?.status === 403) {
        throw new Error("EMAIL_NOT_VERIFIED");
      }
      const message = error.response?.data?.message || "Login failed";
      throw new Error(message);
    }
  };

  const register = async (email: string, name: string, password: string) => {
    try {
      const response = await authApi.register({ email, name, password });
      return response.message;
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed";
      throw new Error(message);
    }
  };

  // ✅ NEW: Verify email with token
  const verifyEmail = async (token: string): Promise<string> => {
    try {
      const response = await authApi.verifyEmail(token);
      return response.message;
    } catch (error: any) {
      const message = error.response?.data?.message || "Verification failed";
      throw new Error(message);
    }
  };

  // ✅ NEW: Resend verification email
  const resendVerification = async () => {
    try {
      const response = await authApi.resendVerification();
      return response.message;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to resend verification email";
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      tokenStorage.clearTokens();
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        checkAuth,
        verifyEmail, // ✅ NEW
        resendVerification, // ✅ NEW
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
