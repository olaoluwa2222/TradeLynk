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
import { initializeFCM } from "@/lib/services/fcmService";
import {
  initializeNotifications,
  showNotificationToast,
} from "@/lib/services/notificationService";

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

  // ✅ FIXED LOGIN WITH FCM
  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      const rawData: any = response.data;

      const token: string = rawData.token;

      const normalizedUser: User = {
        userId: Number(rawData.userId ?? rawData.id),
        email: rawData.email,
        name: rawData.name,
        role: rawData.role,
        profilePictureUrl: rawData.profilePictureUrl,
        verified: rawData.isEmailVerified ?? rawData.verified ?? false,
        isEmailVerified: rawData.isEmailVerified ?? rawData.verified ?? false,
      };

      // Save to state/context
      setUser(normalizedUser);

      // ✅ INITIALIZE FCM AFTER LOGIN
      try {
        console.log("🔔 Initializing FCM after login...");
        await initializeFCM(token, (payload) => {
          console.log("📬 New message notification:", payload);
          // You can add a toast notification here if you want
        });
      } catch (fcmError) {
        console.error("FCM initialization failed (non-critical):", fcmError);
        // Don't block login if FCM fails
      }

      // ✅ INITIALIZE NOTIFICATIONS (REQUEST PERMISSION & SAVE FCM TOKEN)
      try {
        console.log("🔔 Initializing push notifications...");
        await initializeNotifications((payload) => {
          console.log("🔔 Foreground notification:", payload);
          showNotificationToast(
            payload.title,
            payload.body,
            payload.data?.chatId,
          );
        });
      } catch (notifError) {
        console.warn(
          "⚠️ Push notification setup failed (non-critical):",
          notifError,
        );
        // Don't block login if notifications fail
      }

      // Navigate to role-based dashboard
      const role = normalizedUser.role;
      if (role === "SELLER" || role === "BOTH" || role === "ADMIN") {
        router.push("/dashboard/seller");
      } else {
        router.push("/items");
      }
    } catch (error: any) {
      console.error("Login error:", error);

      // Extract user-friendly message from backend response
      const backendMessage = error.response?.data?.message;
      const backendError = error.response?.data?.error;

      // Check for email verification error
      if (
        backendMessage &&
        backendMessage.toLowerCase().includes("verify your email")
      ) {
        throw new Error("EMAIL_NOT_VERIFIED");
      }

      // If backend provides a message, use it
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      // Fallback to generic message
      throw new Error("Login failed. Please check your credentials.");
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

  // ✅ Verify email with token
  const verifyEmail = async (token: string): Promise<string> => {
    try {
      const response = await authApi.verifyEmail(token);
      // ✅ Clear pending verification email from localStorage on success
      localStorage.removeItem("pendingVerificationEmail");
      return response.message;
    } catch (error: any) {
      const message = error.response?.data?.message || "Verification failed";
      throw new Error(message);
    }
  };

  // ✅ Resend verification email
  const resendVerification = async (email: string) => {
    try {
      const response = await authApi.resendVerification(email);
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
        verifyEmail,
        resendVerification,
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
