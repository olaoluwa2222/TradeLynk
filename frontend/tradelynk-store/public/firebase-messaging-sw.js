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

messaging.onBackgroundMessage((payload) => {
  console.log("Background message received:", payload);

  const notificationTitle = payload.notification.title || "TradeLynk";
  const notificationOptions = {
    body: payload.notification.body || "You have a new message",
    icon: "/logo.png",
    badge: "/badge.png",
    tag: payload.data.chatId || "chat-notification",
    requireInteraction: false,
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const chatId = event.notification.data.chatId;
  if (chatId) {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        // Check if there's already a window/tab open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === `/chat/${chatId}` && "focus" in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(`/chat/${chatId}`);
        }
      })
    );
  }
});
