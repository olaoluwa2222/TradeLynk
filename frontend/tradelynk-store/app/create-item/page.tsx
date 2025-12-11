// app/create-item/page.tsx - Alternative with manual auth check
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreateItemForm } from "@/components/items/CreateItemForm";
import { tokenStorage } from "@/lib/api";

export default function CreateItemPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if user has access token
    const checkAuth = () => {
      const token = tokenStorage.getAccessToken();

      if (!token) {
        // No token, redirect to login
        router.push("/login");
        return;
      }

      // Token exists, user is authenticated
      setIsAuthorized(true);
      setIsChecking(false);
    };

    checkAuth();
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
