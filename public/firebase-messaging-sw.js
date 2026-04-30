// Firebase Cloud Messaging Service Worker
// Must be served from root as /firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAHt7kSsNnR7dvlp87yzSzghocXEuFrZXg",
  authDomain: "pscc-fd46b.firebaseapp.com",
  projectId: "pscc-fd46b",
  storageBucket: "pscc-fd46b.firebasestorage.app",
  messagingSenderId: "539230006518",
  appId: "1:539230006518:web:5c8d73cbebe3809dacd0d7"
});

const messaging = firebase.messaging();

// Handle background messages (when app is not in focus)
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background message received:", payload);
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || "PSCC", {
    body: body || "",
    icon: icon || "/pscc-logo.png",
    badge: "/pscc-logo.png",
    vibrate: [200, 100, 200],
    data: payload.data || {},
    tag: "pscc-notification",
  });
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.link || "https://pscc-mu.vercel.app/account";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
