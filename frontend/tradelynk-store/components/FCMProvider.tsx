// components/FCMProvider.tsx
"use client";

import { useEffect, useState } from "react";
import { initializeFCM, cleanupFCM } from "@/lib/services/fcmService";
import { useAuth } from "@/hooks/useAuth";

export default function FCMProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token } = useAuth();
  const [fcmInitialized, setFcmInitialized] = useState(false);

  useEffect(() => {
    // Only run on client-side and when user is logged in
    if (typeof window === "undefined" || !user || !token) {
      return;
    }

    // Prevent double initialization
    if (fcmInitialized) {
      return;
    }

    const initFCM = async () => {
      try {
        console.log("🚀 FCMProvider: Initializing FCM...");

        const fcmToken = await initializeFCM(token, (payload) => {
          console.log("📬 FCMProvider: New message received", payload);

          // Handle the message in your app
          // You can dispatch an event, update state, etc.
          const event = new CustomEvent("fcm-message", {
            detail: payload,
          });
          window.dispatchEvent(event);

          // Play notification sound (optional)
          try {
            const audio = new Audio("/notification.mp3");
            audio.play().catch((e) => console.log("Could not play sound:", e));
          } catch (e) {
            console.log("Notification sound error:", e);
          }
        });

        if (fcmToken) {
          console.log("✅ FCMProvider: FCM initialized successfully");
          setFcmInitialized(true);
        } else {
          console.warn("⚠️ FCMProvider: FCM initialization returned no token");
        }
      } catch (error) {
        console.error("❌ FCMProvider: Error initializing FCM:", error);
      }
    };

    // Initialize FCM after a short delay to ensure everything is loaded
    const timeoutId = setTimeout(() => {
      initFCM();
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [user, token, fcmInitialized]);

  // Cleanup on logout
  useEffect(() => {
    if (!user && fcmInitialized) {
      console.log("👤 FCMProvider: User logged out, cleaning up FCM");
      cleanupFCM();
      setFcmInitialized(false);
    }
  }, [user, fcmInitialized]);

  // Listen for service worker messages
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      console.log("📨 FCMProvider: Message from service worker:", event.data);

      if (event.data?.type === "NAVIGATE_TO_CHAT") {
        const chatId = event.data.chatId;
        if (chatId) {
          // Navigate to the chat
          window.location.href = `/chat?chatId=${chatId}`;
        }
      }
    };

    navigator.serviceWorker.addEventListener(
      "message",
      handleServiceWorkerMessage
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        "message",
        handleServiceWorkerMessage
      );
    };
  }, []);

  return <>{children}</>;
}
