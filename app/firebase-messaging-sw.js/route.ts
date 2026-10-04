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

// ---- حارس الروابط الداخلية -------------------------------------------------
// نفس قاعدة public/sw.js وlib/utils/internalLink.ts: أي رابط لا يبدأ بـ "/"
// واحد (أو "//evil.example" أو javascript:) لا يُفتح ولا يُمرَّر لـ openWindow.
function isSafeInternalPath(link) {
  if (typeof link !== "string" || link.length < 1 || link.length > 500) return false;
  if (!link.startsWith("/")) return false;
  if (link.startsWith("//")) return false;
  if (/[\\u0000-\\u001f\\u007f\\s\\\\]/.test(link)) return false;
  var path = link.split("?")[0].split("#")[0];
  if (path.indexOf(":") !== -1) return false;
  return true;
}

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || "إشعار جديد";
  const body = data.body || "";
  // رابط تالف ⇒ مسار مركز الإشعارات، ولا نخزّن قيمة غير داخلية في data
  const link = isSafeInternalPath(data.link) ? data.link : "/notifications";
  const notificationId = data.notification_id;
  self.registration.showNotification(title, {
    body,
    icon: "/web-app-manifest-192x192.png",
    data: { link },
    // tag يمنع تراكم إشعارات متطابقة في مركز الإشعارات (آلية ثانوية فقط)
    tag: notificationId || undefined,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  var raw = (event.notification.data && event.notification.data.link) || "/notifications";
  var target = isSafeInternalPath(raw) ? raw : "/notifications";
  try {
    var resolved = new URL(target, self.location.origin);
    if (resolved.origin !== self.location.origin) resolved = new URL("/notifications", self.location.origin);
    event.waitUntil(clients.openWindow(resolved.href));
  } catch (err) {
    event.waitUntil(clients.openWindow("/notifications"));
  }
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