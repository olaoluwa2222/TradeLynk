// lib/services/fcmService.ts
import { chatsApi } from "@/lib/api";

const VAPID_KEY =
  "BNVihyc2MIQDWWH62ALfYEvfHQj_suTRYbYZPO4ore83TDvaiTToA7KQgN8d1-UBNnY9L_tIT0hJXIM4Q_1ewlA";

/**
 * Check if we're in a browser environment
 */
const isBrowser =
  typeof window !== "undefined" && typeof navigator !== "undefined";

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isBrowser || !("Notification" in window)) {
    console.warn("Notifications not supported");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log("📱 Notification permission:", permission);
    return permission === "granted";
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
};

/**
 * Get FCM token for this device
 */
export const getFCMToken = async (): Promise<string | null> => {
  if (!isBrowser) {
    console.warn("getFCMToken called on server-side");
    return null;
  }

  try {
    // Check if service worker is supported
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker not supported");
      return null;
    }

    // Register service worker
    let registration;
    try {
      registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/" }
      );
      console.log("✅ Service worker registered:", registration.scope);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log("✅ Service worker is ready");
    } catch (error) {
      console.error("❌ Failed to register service worker:", error);
      return null;
    }

    // Dynamically import Firebase messaging
    const { messaging } = await import("@/config/firebase");
    const { getToken: getTokenFn } = await import("firebase/messaging");

    if (!messaging) {
      console.error("❌ Firebase Messaging not initialized");
      return null;
    }

    const token = await getTokenFn(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log("✅ FCM Token obtained:", token.substring(0, 20) + "...");
    } else {
      console.warn("❌ No FCM token received");
    }

    return token || null;
  } catch (error) {
    console.error("❌ Error getting FCM token:", error);
    return null;
  }
};

/**
 * Save FCM token to backend
 */
export const saveFCMTokenToBackend = async (
  token: string,
  userToken: string
): Promise<boolean> => {
  try {
    console.log("💾 Saving FCM token to backend...");

    const response = await chatsApi.saveDeviceToken({
      deviceToken: token,
      deviceType: "web",
      deviceName: navigator.userAgent.substring(0, 100),
    });

    if (response.success) {
      console.log("✅ FCM token saved to backend successfully");
      return true;
    } else {
      console.error("❌ Failed to save FCM token:", response.message);
      return false;
    }
  } catch (error) {
    console.error("❌ Error saving FCM token to backend:", error);
    return false;
  }
};

/**
 * Remove FCM token from backend
 */
export const removeFCMTokenFromBackend = async (
  token: string
): Promise<boolean> => {
  try {
    console.log("🗑️ Removing FCM token from backend...");

    const response = await chatsApi.removeDeviceToken(token);

    if (response.success) {
      console.log("✅ FCM token removed successfully");
      return true;
    } else {
      console.error("❌ Failed to remove FCM token:", response.message);
      return false;
    }
  } catch (error) {
    console.error("❌ Error removing FCM token from backend:", error);
    return false;
  }
};

/**
 * Setup listener for foreground notifications
 */
export const setupNotificationListener = async (
  onMessageCallback: (payload: any) => void
): Promise<(() => void) | null> => {
  if (!isBrowser) {
    console.warn("setupNotificationListener called on server-side");
    return null;
  }

  try {
    console.log("👂 Setting up notification listener...");

    const { messaging } = await import("@/config/firebase");
    const { onMessage: onMessageFn } = await import("firebase/messaging");

    if (!messaging) {
      console.error("❌ Firebase Messaging not initialized");
      return null;
    }

    const unsubscribe = onMessageFn(messaging, (payload) => {
      console.log("📬 Foreground message received:", payload);

      onMessageCallback(payload);

      // Show browser notification if permission granted
      if (Notification.permission === "granted") {
        try {
          const notificationTitle = payload.notification?.title || "TradeLynk";
          const notificationBody =
            payload.notification?.body || "You have a new message";
          const chatId = payload.data?.chatId;

          const notification = new Notification(notificationTitle, {
            body: notificationBody,
            icon: "/icon-192x192.png",
            badge: "/badge-72x72.png",
            tag: chatId || "message",
            requireInteraction: false,
            data: {
              chatId: chatId,
              url: chatId ? `/chat?chatId=${chatId}` : "/chat",
            },
          });

          // Handle notification click
          notification.onclick = (event) => {
            event.preventDefault();
            const url = chatId ? `/chat?chatId=${chatId}` : "/chat";
            window.focus();
            window.location.href = url;
            notification.close();
          };

          console.log("✅ Foreground notification shown");
        } catch (error) {
          console.error("❌ Error showing notification:", error);
        }
      }
    });

    console.log("✅ Notification listener setup complete");
    return unsubscribe;
  } catch (error) {
    console.error("❌ Error setting up notification listener:", error);
    return null;
  }
};

/**
 * Initialize FCM on app start (usually after login)
 */
export const initializeFCM = async (
  userToken: string,
  onNewMessage: (payload: any) => void
): Promise<string | null> => {
  if (!isBrowser) {
    console.warn("initializeFCM called on server-side");
    return null;
  }

  try {
    console.log("🚀 Initializing FCM...");

    // Request permission
    const hasPermission = await requestNotificationPermission();

    if (!hasPermission) {
      console.warn("⚠️ Notification permission not granted");
      return null;
    }

    // Get token
    const fcmToken = await getFCMToken();

    if (!fcmToken) {
      console.warn("⚠️ Failed to get FCM token");
      return null;
    }

    // Save to backend
    const saved = await saveFCMTokenToBackend(fcmToken, userToken);

    if (!saved) {
      console.warn("⚠️ Failed to save FCM token to backend");
      // Don't return null - still setup listener
    }

    // Store locally
    localStorage.setItem("fcmToken", fcmToken);

    // Setup listener
    await setupNotificationListener(onNewMessage);

    console.log("✅ FCM initialized successfully");
    return fcmToken;
  } catch (error) {
    console.error("❌ Error initializing FCM:", error);
    return null;
  }
};

/**
 * Clean up FCM on app logout
 */
export const cleanupFCM = async (): Promise<void> => {
  if (!isBrowser) {
    return;
  }

  try {
    console.log("🧹 Cleaning up FCM...");

    const fcmToken = localStorage.getItem("fcmToken");

    if (fcmToken) {
      await removeFCMTokenFromBackend(fcmToken);
      localStorage.removeItem("fcmToken");
      console.log("✅ FCM cleaned up successfully");
    }
  } catch (error) {
    console.error("❌ Error cleaning up FCM:", error);
  }
};
