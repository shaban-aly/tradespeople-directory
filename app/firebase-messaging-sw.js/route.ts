import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /firebase-messaging-sw.js — ملف Service Worker الإشعارات.
 * يُقدَّم من السيرفر بإدخال إعدادات Firebase Web العامة (NEXT_PUBLIC_*) ديناميكياً —
 * لا نسخة ثابتة بأسرار في public/. كل هذه القيم عامة بطبيعتها (تُستخدم في الواجهة أيضاً)
 * وتُمرَّر كاملةً لأن خدمة Installations التي يعتمد عليها Messaging تتطلب projectId
 * ومفاتيح app كاملة، لا messagingSenderId فقط (وإلا: installations/missing-app-config-values).
 */
export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  const script = `importScripts(
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js"
);

const app = firebase.initializeApp(${JSON.stringify(config)});
const messaging = firebase.messaging(app);

messaging.onBackgroundMessage((payload) => {
  const data = (payload.data ?? {}) as Record<string, string>;
  const title = data.title || "إشعار جديد";
  const body = data.body || "";
  const link = data.link || "/notifications";
  const notificationId = data.notification_id;
  self.registration.showNotification(title, {
    body,
    icon: "/favicon.svg",
    data: { link },
    // tag يمنع تراكم إشعارات متطابقة في مركز الإشعارات (آلية ثانوية فقط)
    tag: notificationId || undefined,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/notifications";
  event.waitUntil(clients.openWindow(link));
});
`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "Service-Worker-Allowed": "/",
    },
  });
}