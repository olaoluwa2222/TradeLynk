import { messaging, getToken, onMessage } from "@/config/firebase";

const VAPID_KEY =
  "BNVihyc2MIQDWWH62ALfYEvfHQj_suTRYbYZPO4ore83TDvaiTToA7KQgN8d1-UBNnY9L_tIT0hJXIM4Q_1ewlA";

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const permission = await Notification.requestPermission();
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
  try {
    // Check if service worker is supported
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker not supported");
      return null;
    }

    // Register service worker
    try {
      await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    } catch (error) {
      console.warn("Failed to register service worker:", error);
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token || null;
  } catch (error) {
    console.error("Error getting FCM token:", error);
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
    const response = await fetch("/api/chats/device-token", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceToken: token,
        deviceType: "web",
        deviceName: navigator.userAgent,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error saving FCM token to backend:", error);
    return false;
  }
};

/**
 * Remove FCM token from backend
 */
export const removeFCMTokenFromBackend = async (
  token: string,
  userToken: string
): Promise<boolean> => {
  try {
    const response = await fetch("/api/chats/device-token", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ deviceToken: token }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error removing FCM token from backend:", error);
    return false;
  }
};

/**
 * Setup listener for foreground notifications
 */
export const setupNotificationListener = (
  onMessageCallback: (payload: any) => void
): (() => void) => {
  const unsubscribe = onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);

    onMessageCallback(payload);

    // Show browser notification
    if (Notification.permission === "granted") {
      try {
        new Notification(payload.notification?.title || "TradeLynk", {
          body: payload.notification?.body || "You have a new message",
          icon: "/logo.png",
          badge: "/badge.png",
          data: payload.data,
        });
      } catch (error) {
        console.error("Error showing notification:", error);
      }
    }
  });

  return unsubscribe;
};

/**
 * Initialize FCM on app start (usually after login)
 */
export const initializeFCM = async (
  userToken: string,
  onNewMessage: (payload: any) => void
): Promise<string | null> => {
  try {
    // Request permission
    const hasPermission = await requestNotificationPermission();

    if (!hasPermission) {
      console.warn("Notification permission not granted");
      return null;
    }

    // Get token
    const fcmToken = await getFCMToken();

    if (!fcmToken) {
      console.warn("Failed to get FCM token");
      return null;
    }

    // Save to backend
    const saved = await saveFCMTokenToBackend(fcmToken, userToken);

    if (!saved) {
      console.warn("Failed to save FCM token to backend");
      return null;
    }

    // Store locally
    localStorage.setItem("fcmToken", fcmToken);

    // Setup listener
    setupNotificationListener(onNewMessage);

    console.log("FCM initialized successfully");
    return fcmToken;
  } catch (error) {
    console.error("Error initializing FCM:", error);
    return null;
  }
};

/**
 * Clean up FCM on app logout
 */
export const cleanupFCM = async (userToken: string): Promise<void> => {
  try {
    const fcmToken = localStorage.getItem("fcmToken");

    if (fcmToken) {
      await removeFCMTokenFromBackend(fcmToken, userToken);
      localStorage.removeItem("fcmToken");
    }
  } catch (error) {
    console.error("Error cleaning up FCM:", error);
  }
};
