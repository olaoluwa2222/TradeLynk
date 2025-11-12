// components/ProtectedRoute.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: "BUYER" | "SELLER" | "BOTH" | "ADMIN";
  requireVerified?: boolean; // ✅ NEW: Optionally require email verification
}

export default function ProtectedRoute({
  children,
  requireRole,
  requireVerified = false, // ✅ NEW: Default to false for backward compatibility
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (
        requireRole &&
        user?.role !== requireRole &&
        user?.role !== "ADMIN"
      ) {
        // User doesn't have required role (admins can access everything)
        router.push("/");
      } else if (requireVerified && !user?.verified) {
        // ✅ NEW
        // User needs to verify email first
        router.push("/");
      }
    }
  }, [isAuthenticated, isLoading, user, requireRole, requireVerified, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Don't render if role requirement not met
  if (requireRole && user?.role !== requireRole && user?.role !== "ADMIN") {
    return null;
  }

  // ✅ NEW: Don't render if verification is required but user is not verified
  if (requireVerified && !user?.verified) {
    return null;
  }

  return <>{children}</>;
}
