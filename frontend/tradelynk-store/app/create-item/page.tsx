"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CreateItemForm } from "@/components/items/CreateItemForm";
import { tokenStorage, authApi } from "@/lib/api";

export default function CreateItemPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Track mounted state
    isMountedRef.current = true;

    // Check if user has valid access token
    const checkAuth = async () => {
      try {
        // Try to get token
        const token = tokenStorage.getAccessToken();

        if (!token) {
          // No token, redirect to login and stop
          router.push("/login");
          return;
        }

        // Validate token with backend
        const userData = await authApi.getCurrentUser();

        // Only update state if still mounted
        if (isMountedRef.current) {
          if (userData) {
            setIsAuthorized(true);
          } else {
            // Invalid user data, redirect to login
            router.push("/login");
          }
        }
      } catch (error) {
        console.error("❌ Auth validation failed:", error);
        // Token is invalid or expired, redirect to login
        if (isMountedRef.current) {
          router.push("/login");
        }
      } finally {
        // Only update if still mounted
        if (isMountedRef.current) {
          setIsChecking(false);
        }
      }
    };

    checkAuth();

    // Cleanup function
    return () => {
      isMountedRef.current = false;
    };
  }, [router]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authorized
  if (!isAuthorized) {
    return null;
  }

  return (
    <div>
      <CreateItemForm />
    </div>
  );
}
