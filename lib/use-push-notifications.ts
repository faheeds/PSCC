"use client";

import { useEffect, useState } from "react";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAHt7kSsNnR7dvlp87yzSzghocXEuFrZXg",
  authDomain: "pscc-fd46b.firebaseapp.com",
  projectId: "pscc-fd46b",
  storageBucket: "pscc-fd46b.firebasestorage.app",
  messagingSenderId: "539230006518",
  appId: "1:539230006518:web:5c8d73cbebe3809dacd0d7",
};

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
      // Step 1: Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setError("Notification permission denied");
        return;
      }

      // Step 2: Register service worker explicitly
      const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;

      // Step 3: Init Firebase
      const { initializeApp, getApps, getApp } = await import("firebase/app");
      const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();

      // Step 4: Get FCM token using the registered SW
      const { getMessaging, getToken } = await import("firebase/messaging");
      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });

      if (!token) {
        setError("Failed to get notification token. Check browser permissions.");
        return;
      }

      // Step 5: Save token to server
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, platform: "web" }),
      });

      setIsSubscribed(true);
    } catch (err: any) {
      console.error("Push notification error:", err);
      setError(err?.message || "Failed to enable notifications");
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribe() {
    setIsLoading(true);
    try {
      const { getMessaging, getToken, deleteToken } = await import("firebase/messaging");
      const { getApp } = await import("firebase/app");
      const messaging = getMessaging(getApp());
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        await fetch("/api/notifications/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        await deleteToken(messaging);
      }
      setIsSubscribed(false);
      setPermission("default");
    } catch (err) {
      console.error("Unsubscribe error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const isSupported =
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  return { permission, isSubscribed, isLoading, error, subscribe, unsubscribe, isSupported };
}
