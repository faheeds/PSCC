import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

function getFirebaseAdmin() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Vercel stores \n as literal \n in env vars - this fixes it
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getMessaging();
}

export const messaging = getFirebaseAdmin();

export async function sendPushToTokens(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
) {
  if (!tokens.length) return { sent: 0, failed: 0 };

  const results = await Promise.allSettled(
    // FCM v1 allows up to 500 tokens per multicast
    chunkArray(tokens, 500).map((chunk) =>
      messaging.sendEachForMulticast({
        tokens: chunk,
        notification: { title, body },
        webpush: {
          notification: {
            title,
            body,
            icon: "/pscc-logo.png",
            badge: "/pscc-logo.png",
            vibrate: [200, 100, 200],
          },
          fcmOptions: { link: process.env.NEXTAUTH_URL || "https://pscc-mu.vercel.app" },
        },
        data,
      })
    )
  );

  let sent = 0, failed = 0;
  for (const r of results) {
    if (r.status === "fulfilled") {
      sent += r.value.successCount;
      failed += r.value.failureCount;
    } else {
      failed++;
    }
  }
  return { sent, failed };
}

export async function sendPushToAllMembers(
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const { prisma } = await import("@/lib/db");
  const tokens = await prisma.notificationToken.findMany({
    select: { token: true }
  });
  return sendPushToTokens(tokens.map(t => t.token), title, body, data);
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}
