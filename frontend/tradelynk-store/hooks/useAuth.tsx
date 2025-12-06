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
      const token = response.data.token;
      const userData = response.data as unknown as User;

      // Save to state/context
      setUser(userData);

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
            payload.data?.chatId
          );
        });
      } catch (notifError) {
        console.warn(
          "⚠️ Push notification setup failed (non-critical):",
          notifError
        );
        // Don't block login if notifications fail
      }

      // Navigate to home
      router.push("/");
    } catch (error: any) {
      console.error("Login error:", error);

      // Check for specific error messages
      if (error.response?.data?.message === "EMAIL_NOT_VERIFIED") {
        throw new Error("EMAIL_NOT_VERIFIED");
      }

      throw error;
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
      return response.message;
    } catch (error: any) {
      const message = error.response?.data?.message || "Verification failed";
      throw new Error(message);
    }
  };

  // ✅ Resend verification email
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
