importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyDYBdzWNsEFdpLMuGG5GFaEEFbOeWWzkRk",
  authDomain: "tradelynk-c8ddc.firebaseapp.com",
  projectId: "tradelynk-c8ddc",
  storageBucket: "tradelynk-c8ddc.firebasestorage.app",
  messagingSenderId: "827445968537",
  appId: "1:827445968537:web:ea262b6e14c84b81878208",
});

const messaging = firebase.messaging();

console.log("🔧 Firebase Messaging Service Worker initialized");

messaging.onBackgroundMessage((payload) => {
  console.log("🔔 Background message received:", payload);

  try {
    const notificationTitle =
      payload.notification?.title || payload.data?.title || "TradeLynk";
    const notificationBody =
      payload.notification?.body ||
      payload.data?.body ||
      "You have a new message";
    const chatId = payload.data?.chatId;

    const notificationOptions = {
      body: notificationBody,
      icon: "/favicon.ico",
      badge: "/badge.png",
      tag: chatId || "chat-notification",
      requireInteraction: false,
      data: payload.data || {},
    };

    console.log("📬 Showing notification:", {
      title: notificationTitle,
      body: notificationBody,
      chatId,
    });

    self.registration.showNotification(notificationTitle, notificationOptions);
  } catch (error) {
    console.error("❌ Error showing notification:", error);
  }
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("👆 Notification clicked:", event.notification);
  event.notification.close();

  const chatId = event.notification.data?.chatId;
  const url = chatId ? `/chat?chatId=${chatId}` : "/chat";

  if (chatId) {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        console.log("🔍 Found", clientList.length, "open windows");

        // Check if there's already a window/tab open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          console.log("  Client URL:", client.url);
          if (
            client.url.includes("/chat") &&
            client.url.includes(`chatId=${chatId}`) &&
            "focus" in client
          ) {
            console.log("✅ Focusing existing window");
            return client.focus();
          }
        }

        // If not, open a new window/tab
        console.log("📖 Opening new window:", url);
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("❌ Notification closed:", event.notification);
});
