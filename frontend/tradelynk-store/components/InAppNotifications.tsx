"use client";
import React, { useState, useEffect } from "react";
import { X, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface NotificationToast {
  id: string;
  title: string;
  body: string;
  chatId?: string;
  timestamp: number;
}

export default function InAppNotifications() {
  const [notifications, setNotifications] = useState<NotificationToast[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Listen for messages from service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        console.log("📬 [InAppNotif] Received message from SW:", event.data);

        if (event.data.type === "SHOW_IN_APP_NOTIFICATION") {
          const { title, body, chatId } = event.data;

          const newNotification: NotificationToast = {
            id: `notif-${Date.now()}`,
            title,
            body,
            chatId,
            timestamp: Date.now(),
          };

          console.log(
            "🔔 [InAppNotif] Adding in-app notification:",
            newNotification
          );

          setNotifications((prev) => [...prev, newNotification]);

          // Auto-remove after 5 seconds
          setTimeout(() => {
            setNotifications((prev) =>
              prev.filter((n) => n.id !== newNotification.id)
            );
          }, 5000);
        }
      });
    }

    // Listen for foreground messages from Firebase
    const handleForegroundMessage = (event: MessageEvent) => {
      if (event.data?.type === "FOREGROUND_MESSAGE") {
        const { title, body, chatId } = event.data.payload;

        const newNotification: NotificationToast = {
          id: `notif-${Date.now()}`,
          title,
          body,
          chatId,
          timestamp: Date.now(),
        };

        console.log(
          "🔔 [InAppNotif] Adding foreground notification:",
          newNotification
        );

        setNotifications((prev) => [...prev, newNotification]);

        setTimeout(() => {
          setNotifications((prev) =>
            prev.filter((n) => n.id !== newNotification.id)
          );
        }, 5000);
      }
    };

    window.addEventListener("message", handleForegroundMessage);

    return () => {
      window.removeEventListener("message", handleForegroundMessage);
    };
  }, []);

  const handleNotificationClick = (notification: NotificationToast) => {
    if (notification.chatId) {
      router.push(`/chat?chatId=${notification.chatId}`);
    } else {
      router.push("/chat");
    }
    removeNotification(notification.id);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 w-80 animate-slideIn pointer-events-auto cursor-pointer hover:shadow-3xl transition-all"
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-gray-900 text-sm truncate">
                  {notification.title}
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notification.id);
                  }}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2">
                {notification.body}
              </p>

              <div className="mt-2 text-xs text-gray-400">Just now</div>
            </div>
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
