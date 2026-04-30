// Firebase messaging service worker
// This file must be at the root - served from /firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// Config will be injected via query param or use defaults
const firebaseConfig = self.__FIREBASE_CONFIG__ || {
  apiKey: self.FIREBASE_API_KEY,
  authDomain: "pscc-fd46b.firebaseapp.com",
  projectId: "pscc-fd46b",
  storageBucket: "pscc-fd46b.appspot.com",
  messagingSenderId: "539230006518",
  appId: self.FIREBASE_APP_ID,
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || "PSCC", {
    body: body || "",
    icon: icon || "/pscc-logo.png",
    badge: "/pscc-logo.png",
    vibrate: [200, 100, 200],
    data: payload.data,
    actions: [
      { action: "open", title: "Open PSCC" },
    ],
  });
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.link || "https://pscc-mu.vercel.app/account";
  event.waitUntil(clients.openWindow(url));
});
