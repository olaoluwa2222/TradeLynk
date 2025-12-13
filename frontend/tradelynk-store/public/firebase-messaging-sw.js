importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"
);

console.log("🔧 [SW] Service Worker script loaded");

firebase.initializeApp({
  apiKey: "AIzaSyDYBdzWNsEFdpLMuGG5GFaEEFbOeWWzkRk",
  authDomain: "tradelynk-c8ddc.firebaseapp.com",
  projectId: "tradelynk-c8ddc",
  storageBucket: "tradelynk-c8ddc.firebasestorage.app",
  messagingSenderId: "827445968537",
  appId: "1:827445968537:web:ea262b6e14c84b81878208",
});

const messaging = firebase.messaging();
console.log("🔧 [SW] Firebase Messaging initialized");

// ✅ Handle background messages (when tab is not active)
messaging.onBackgroundMessage((payload) => {
  console.log("🔔 [SW] Background message received:", payload);

  const notificationTitle = payload.notification?.title || "TradeLynk";
  const notificationBody = payload.notification?.body || "New message";
  const chatId = payload.data?.chatId;

  console.log("📬 [SW] Preparing notification:", {
    title: notificationTitle,
    body: notificationBody,
    chatId: chatId,
  });

  const notificationOptions = {
    body: notificationBody,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: chatId || "message",
    requireInteraction: false,
    silent: false,
    data: {
      chatId: chatId,
      url: chatId ? `/chat?chatId=${chatId}` : "/chat",
    },
    timestamp: Date.now(),
  };

  console.log(
    "🔔 [SW] Calling showNotification with options:",
    notificationOptions
  );

  // ✅ Broadcast to all open tabs about the new message
  const broadcastPromise = self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) => {
      console.log("📢 [SW] Broadcasting to", clients.length, "client(s)");
      clients.forEach((client) => {
        client.postMessage({
          type: "SHOW_IN_APP_NOTIFICATION",
          title: notificationTitle,
          body: notificationBody,
          chatId: chatId,
        });
      });
    })
    .catch((error) => {
      console.error("❌ [SW] Failed to broadcast message:", error);
      // Don't throw - allow notification to continue
    });

  // ✅ Show notification
  const notificationPromise = self.registration
    .showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log("✅ [SW] Notification shown successfully");
    })
    .catch((error) => {
      console.error("❌ [SW] Failed to show notification:", error);
      // ✅ Try a simpler notification as fallback
      return self.registration.showNotification(notificationTitle, {
        body: notificationBody,
        icon: "/favicon.ico",
        tag: "fallback",
      });
    });

  // ✅ CRITICAL: Return combined promise to keep service worker alive
  return Promise.all([broadcastPromise, notificationPromise])
    .then(() => {
      console.log("✅ [SW] Both broadcast and notification completed");
    })
    .catch((error) => {
      console.error("❌ [SW] Error in message handling:", error);
      // Even if one fails, we tried our best
    });
});

// ✅ Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("👆 [SW] Notification clicked:", event.notification);
  console.log("👆 [SW] Action clicked:", event.action);

  event.notification.close();

  // Handle action buttons
  if (event.action === "dismiss") {
    console.log("❌ [SW] User dismissed notification");
    return;
  }

  const chatId = event.notification.data?.chatId;
  const urlToOpen = chatId
    ? `${self.location.origin}/chat?chatId=${chatId}`
    : `${self.location.origin}/chat`;

  console.log("🔗 [SW] Opening URL:", urlToOpen);

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        console.log("🔍 [SW] Found", clientList.length, "open windows");

        // Check if a window is already open
        for (const client of clientList) {
          if (client.url.includes("/chat") && "focus" in client) {
            console.log("🔍 [SW] Found existing chat window, focusing");
            if (chatId) {
              client.postMessage({
                type: "NAVIGATE_TO_CHAT",
                chatId: chatId,
              });
            }
            return client.focus();
          }
        }

        // No chat window open, check for any window
        if (clientList.length > 0) {
          console.log("🔍 [SW] Found existing window, navigating");
          return clientList[0].focus().then(() => {
            return clientList[0].navigate(urlToOpen);
          });
        }

        // No window open, open a new one
        console.log("🆕 [SW] Opening new window");
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error("❌ [SW] Error handling notification click:", error);
      })
  );
});

// ✅ Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("❌ [SW] Notification closed:", event.notification.tag);
});

// ✅ Add push event listener as backup
self.addEventListener("push", (event) => {
  console.log("📨 [SW] Push event received:", event);

  if (!event.data) {
    console.log("⚠️ [SW] Push event has no data");
    return;
  }

  try {
    const payload = event.data.json();
    console.log("📦 [SW] Push payload:", payload);

    const title = payload.notification?.title || "TradeLynk";
    const options = {
      body: payload.notification?.body || "New message",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: payload.data || {},
      tag: payload.data?.chatId || "message",
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
    };

    event.waitUntil(
      self.registration
        .showNotification(title, options)
        .then(() => console.log("✅ [SW] Push notification shown"))
        .catch((err) => console.error("❌ [SW] Push notification failed:", err))
    );
  } catch (error) {
    console.error("❌ [SW] Error parsing push data:", error);
  }
});

// ✅ Service Worker activation
self.addEventListener("activate", (event) => {
  console.log("🔄 [SW] Service Worker activated");
  event.waitUntil(self.clients.claim());
});

// ✅ Service Worker installation
self.addEventListener("install", (event) => {
  console.log("📥 [SW] Service Worker installed");
  self.skipWaiting();
});
