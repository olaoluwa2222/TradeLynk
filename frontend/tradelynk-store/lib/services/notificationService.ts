import { messaging } from "@/config/firebase";
import { getToken, onMessage } from "firebase/messaging";
import { authApi } from "@/lib/api";

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

    // 4. Save token to backend
    try {
      await authApi.saveDeviceToken({
        token,
        deviceType: "web",
        deviceName: `${navigator.userAgent.substring(0, 50)}`,
      });
      console.log("✅ Device token saved to backend");
    } catch (err) {
      console.error("❌ Failed to save device token:", err);
      // Don't throw - notifications can still work from other devices
    }

    // 5. Setup foreground message handler
    onMessage(messaging, (payload) => {
      console.log("📬 Foreground FCM message received:", payload);

      const notificationData = {
        title: payload.notification?.title || "New Message",
        body: payload.notification?.body || payload.data?.body || "",
        data: payload.data || {},
      };

      // Call custom handler if provided (e.g., show toast)
      if (onForegroundMessage) {
        onForegroundMessage(notificationData);
      } else {
        // Default: show browser notification
        new Notification(notificationData.title, {
          body: notificationData.body,
          icon: "/favicon.ico",
          tag: notificationData.data?.chatId || "message",
        });
      }
    });

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
    await authApi.removeDeviceToken({ token });
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
