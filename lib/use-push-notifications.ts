"use client";

import { useEffect, useState } from "react";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
      setIsSubscribed(Notification.permission === "granted");
    }
  }, []);

  async function subscribe() {
    setIsLoading(true);
    setError(null);
    try {
      // Dynamically import Firebase to avoid SSR issues
      const { initializeApp, getApps } = await import("firebase/app");
      const { getMessaging, getToken } = await import("firebase/messaging");

      if (!getApps().length) {
        initializeApp({
          apiKey: "AIzaSyAHt7kSsNnR7dvlp87yzSzghocXEuFrZXg",
          authDomain: "pscc-fd46b.firebaseapp.com",
          projectId: "pscc-fd46b",
          storageBucket: "pscc-fd46b.firebasestorage.app",
          messagingSenderId: "539230006518",
          appId: "1:539230006518:web:5c8d73cbebe3809dacd0d7",
        });
      }

      const messaging = getMessaging();
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });

      if (token) {
        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, platform: "web" }),
        });
        setIsSubscribed(true);
        setPermission("granted");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to enable notifications");
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribe() {
    setIsLoading(true);
    try {
      const { getMessaging, deleteToken } = await import("firebase/messaging");
      const messaging = getMessaging();
      const token = await (await import("firebase/messaging")).getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        await fetch("/api/notifications/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        await deleteToken(messaging);
      }
      setIsSubscribed(false);
    } catch (err) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  const isSupported = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;

  return { permission, isSubscribed, isLoading, error, subscribe, unsubscribe, isSupported };
}
