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
    console.log("🔔 [NOTIF] Step 1: Checking notification support");

    if (!("Notification" in window)) {
      console.warn("🔔 [NOTIF] Notifications not supported");
      return null;
    }

    if (!("serviceWorker" in navigator)) {
      console.warn("🔔 [NOTIF] Service Worker not supported");
      return null;
    }

    console.log(
      "🔔 [NOTIF] Step 2: Current permission:",
      Notification.permission
    );

    // Request permission
    let permission = Notification.permission;

    if (permission === "default") {
      console.log("🔔 [NOTIF] Requesting permission...");
      permission = await Notification.requestPermission();
    }

    console.log("🔔 [NOTIF] Step 3: Permission result:", permission);

    if (permission !== "granted") {
      console.warn("🔔 [NOTIF] Permission denied or dismissed");
      return null;
    }

    // ✅ Verify service worker is registered and active
    console.log("🔔 [NOTIF] Step 4: Checking service worker");
    const registration = await navigator.serviceWorker.ready;
    console.log("🔔 [NOTIF] Service worker state:", registration.active?.state);

    if (!registration.active) {
      console.error("🔔 [NOTIF] Service worker not active!");
      return null;
    }

    // ✅ Test notification capability
    console.log("🔔 [NOTIF] Step 5: Testing notification display");
    try {
      await registration.showNotification("TradeLynk", {
        body: "Notifications are working!",
        icon: "/favicon.ico",
        tag: "test",
        requireInteraction: false,
      });
      console.log("✅ [NOTIF] Test notification shown successfully");

      // Close test notification after 2 seconds
      setTimeout(async () => {
        const notifications = await registration.getNotifications({
          tag: "test",
        });
        notifications.forEach((n) => n.close());
      }, 2000);
    } catch (testError) {
      console.error("❌ [NOTIF] Test notification failed:", testError);
      // Continue anyway - might still work for FCM
    }

    console.log("🔔 [NOTIF] Step 6: Getting FCM token");
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration, // ✅ Pass service worker explicitly
    });

    console.log(
      "🔔 [NOTIF] Step 7: Token result:",
      token ? `✅ Got token (${token.substring(0, 20)}...)` : "❌ No token"
    );

    if (!token) {
      console.error("🔔 [NOTIF] Failed to get FCM token!");
      console.error(
        "🔔 [NOTIF] Check VAPID key:",
        process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.substring(0, 20)
      );
      return null;
    }

    console.log("🔔 [NOTIF] Step 8: Saving to backend");
    await chatsApi.saveDeviceToken({
      token: token,
      deviceType: "web",
      deviceName: navigator.userAgent.substring(0, 50),
    });

    console.log("🔔 [NOTIF] Step 9: Setup foreground listener");

    // ✅ Setup foreground message handler
    onMessage(messaging, (payload) => {
      console.log("📬 [NOTIF] FOREGROUND message received:", payload);

      const notificationData = {
        title: payload.notification?.title || "TradeLynk",
        body: payload.notification?.body || "New message",
        data: payload.data || {},
      };

      // ✅ Check if user is currently on the chat page for this message
      const isOnChatPage = window.location.pathname.includes("/chat");
      const currentChatId = new URLSearchParams(window.location.search).get(
        "chatId"
      );
      const messageChatId = notificationData.data?.chatId;
      const isOnSameChat = isOnChatPage && currentChatId === messageChatId;

      console.log("🔍 [NOTIF] User location check:", {
        isOnChatPage,
        currentChatId,
        messageChatId,
        isOnSameChat,
      });

      // ✅ Only show notification if NOT on the same chat
      if (!isOnSameChat) {
        console.log("🔔 [NOTIF] User not on same chat, showing notification");

        // Show browser notification
        if (registration && registration.active) {
          console.log("🔔 [NOTIF] Showing foreground notification via SW");
          registration
            .showNotification(notificationData.title, {
              body: notificationData.body,
              icon: "/favicon.ico",
              badge: "/favicon.ico",
              tag: notificationData.data?.chatId || "message",
              requireInteraction: false,
              silent: false,
              data: notificationData.data,
              timestamp: Date.now(),
            })
            .then(() => {
              console.log("✅ [NOTIF] Foreground notification shown");
            })
            .catch((err) => {
              console.error(
                "❌ [NOTIF] Failed to show foreground notification:",
                err
              );
            });
        }

        // ✅ Also show in-app toast notification
        window.postMessage(
          {
            type: "FOREGROUND_MESSAGE",
            payload: {
              title: notificationData.title,
              body: notificationData.body,
              chatId: notificationData.data?.chatId,
            },
          },
          "*"
        );
      } else {
        console.log(
          "✅ [NOTIF] User is on the same chat, skipping notification"
        );
      }

      // ✅ Always call custom handler if provided
      if (onForegroundMessage) {
        onForegroundMessage(notificationData);
      }
    });

    console.log("✅ [NOTIF] All steps completed successfully");
    return token;
  } catch (error) {
    console.error("❌ [NOTIF] Error:", error);
    if (error instanceof Error) {
      console.error("❌ [NOTIF] Error details:", error.message, error.stack);
    }
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
    animation: slideIn 0.3s ease-out;
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
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease-out";
    setTimeout(() => toast.remove(), 300);
  }, 5000);
};

/**
 * Check if notifications are enabled
 */
export const areNotificationsEnabled = (): boolean => {
  return (
    "Notification" in window &&
    Notification.permission === "granted" &&
    "serviceWorker" in navigator
  );
};

/**
 * Get current notification permission status
 */
export const getNotificationPermission = (): NotificationPermission => {
  return "Notification" in window ? Notification.permission : "denied";
};
