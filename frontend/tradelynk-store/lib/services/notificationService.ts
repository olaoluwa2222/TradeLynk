import { messaging } from "@/config/firebase";
import { getToken, onMessage } from "firebase/messaging";
import { chatsApi } from "@/lib/api";

/**
 * Initialize FCM notifications
 * - Request permission from user
 * - Get FCM token
 * - Save token to backend
 * - Setup foreground message handler
 */
export const initializeNotifications = async (
  onForegroundMessage?: (payload: any) => void
): Promise<string | null> => {
  try {
    // 1. Check if notifications are supported
    if (!("Notification" in window)) {
      console.warn("🔔 Notifications not supported in this browser");
      return null;
    }

    // 2. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn(
        "🔔 User denied notification permission. Notifications disabled."
      );
      return null;
    }

    console.log("✅ Notification permission granted");

    // 3. Get FCM token
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (!token) {
      console.warn("🔔 Failed to get FCM token");
      return null;
    }

    console.log("✅ FCM token obtained:", token.substring(0, 20) + "...");

    // 4. Save token to backend with retry logic and periodic refresh
    const saveTokenToBackend = async (currentToken: string) => {
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          await chatsApi.saveDeviceToken({
            token: currentToken,
            deviceType: "web",
            deviceName: `${navigator.userAgent.substring(0, 50)}`,
          });
          console.log("✅ Device token saved to backend successfully");
          return true;
        } catch (err) {
          attempts++;
          console.warn(
            `⚠️ Failed to save device token (attempt ${attempts}/${maxAttempts}):`,
            err
          );
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }
      return false;
    };

    let saveSuccess = await saveTokenToBackend(token);

    if (!saveSuccess) {
      console.error("❌ Failed to save device token after multiple attempts");
    }

    // Setup token refresh every 24 hours to maintain notification capability
    const tokenRefreshInterval = setInterval(async () => {
      console.log("🔄 Refreshing FCM token...");
      try {
        const newToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });
        if (newToken && newToken !== token) {
          console.log("✅ New FCM token generated, saving...");
          await saveTokenToBackend(newToken);
        }
      } catch (err) {
        console.error("❌ Error refreshing FCM token:", err);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Store interval ID for cleanup if needed
    (window as any).__fcmTokenRefreshInterval = tokenRefreshInterval;

    // 5. Setup foreground message handler
    onMessage(messaging, (payload) => {
      console.log("📬 Foreground FCM message received:", payload);
      console.log("📋 Notification data:", {
        title: payload.notification?.title,
        body: payload.notification?.body,
        chatId: payload.data?.chatId,
      });

      const notificationData = {
        title: payload.notification?.title || "TradeLynk",
        body: payload.notification?.body || payload.data?.body || "New message",
        data: payload.data || {},
      };

      // Call custom handler if provided (e.g., show toast)
      if (onForegroundMessage) {
        console.log("🔔 Calling custom foreground handler");
        onForegroundMessage(notificationData);
      } else {
        // Default: show browser notification
        try {
          console.log("🔔 Attempting to show default browser notification...");
          const notification = new Notification(notificationData.title, {
            body: notificationData.body,
            icon: "/favicon.ico",
            badge: "/badge.png",
            tag: notificationData.data?.chatId || "message",
            requireInteraction: false,
            data: notificationData.data,
          });
          console.log("✅ Browser notification shown successfully");

          // Handle notification click
          notification.onclick = () => {
            console.log("👆 Notification clicked in foreground");
            if (notificationData.data?.chatId) {
              window.location.href = `/chat?chatId=${notificationData.data.chatId}`;
            }
          };
        } catch (err) {
          console.error("❌ Failed to show notification:", err);
          // Fallback: show in console
          console.warn(
            "⚠️ Notification suppressed but message received:",
            notificationData
          );
        }
      }
    });

    // 6. Verify FCM is working by checking service worker
    if ("serviceWorker" in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log(
          "📱 Service Worker registrations:",
          registrations.length,
          "active"
        );
        registrations.forEach((reg) => {
          console.log("✅ Service Worker active at:", reg.scope);
        });
      } catch (err) {
        console.error("Error checking service workers:", err);
      }
    }

    console.log("✅ Foreground message handler setup complete");
    return token;
  } catch (error) {
    console.error("❌ Error initializing notifications:", error);
    return null;
  }
};

/**
 * Remove device token on logout
 */
export const removeDeviceToken = async (token: string): Promise<void> => {
  try {
    await chatsApi.removeDeviceToken(token);
    console.log("✅ Device token removed from backend");
  } catch (error) {
    console.error("❌ Error removing device token:", error);
    // Don't throw - logout should still succeed
  }
};

/**
 * Show a toast notification (in-app)
 * You can replace this with your own toast library
 */
export const showNotificationToast = (
  title: string,
  body: string,
  chatId?: string
): void => {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    cursor: pointer;
    max-width: 400px;
  `;

  toast.innerHTML = `
    <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${title}</div>
    <div style="color: #666; font-size: 14px;">${body}</div>
  `;

  // Click to navigate to chat
  if (chatId) {
    toast.style.cursor = "pointer";
    toast.onclick = () => {
      window.location.href = `/chat?chatId=${chatId}`;
      toast.remove();
    };
  }

  // Auto-dismiss after 5 seconds
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
};
