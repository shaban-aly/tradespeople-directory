// أدوات المتصفح لإشعارات Web Push (Firebase Messaging).
// لا تُستدعى هذه الدوال إلا من داخل useEffect/event handlers — لا قراءة
// للبيئة أثناء الريندر؛ القاعدة: انقديم بقيمة محايدة ثم behave في التأثير.

import { firebaseConfig, PUSH_APP_NAME } from "./config";
import type { Messaging } from "firebase/messaging";

export const SW_PATH = "/firebase-messaging-sw.js";

let messaging: Promise<Messaging | null> | null = null;

function getMessagingSafe(): Promise<Messaging | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }
  const cfg = firebaseConfig();
  if (!cfg) return Promise.resolve(null);

  if (!messaging) {
    messaging = (async () => {
      const [{ initializeApp }, { getMessaging }] = await Promise.all([
        import("firebase/app"),
        import("firebase/messaging"),
      ]);
      const app = initializeApp(
        {
          apiKey: cfg.apiKey,
          authDomain: cfg.authDomain,
          projectId: cfg.projectId,
          messagingSenderId: cfg.messagingSenderId,
          appId: cfg.appId,
        },
        PUSH_APP_NAME,
      );
      return getMessaging(app);
    })().catch(() => null);
  }
  return messaging;
}

/** تسجيل الـ Service Worker الخاص بالإشعارات (idempotent) */
async function ensurePushSw(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register(SW_PATH);
    await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

/** طلب إذن الإخطارات من المستخدم + الحصول على FCM token للتسجيل */
export async function requestPushToken(): Promise<string | null> {
  if (typeof Notification === "undefined") return null;
  const cfg = firebaseConfig();
  if (!cfg) return null;

  let permission: NotificationPermission;
  try {
    permission = await Notification.requestPermission();
  } catch {
    return null;
  }
  if (permission !== "granted") return null;

  const swReg = await ensurePushSw();
  const msg = await getMessagingSafe();
  if (!msg || !swReg) return null;

  try {
    const { getToken } = await import("firebase/messaging");
    const token = await getToken(msg, {
      vapidKey: cfg.vapidKey,
      serviceWorkerRegistration: swReg,
    });
    return token || null;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Push Client] Failed to get FCM token:", err);
    }
    return null;
  }
}

/** إلغاء التوكن على الجهاز (يمنع البث مستقبلاً حتى لو بقي في القاعدة) */
export async function revokePushToken(): Promise<boolean> {
  const cfg = firebaseConfig();
  if (!cfg) return false;
  const msg = await getMessagingSafe();
  if (!msg) return false;
  try {
    const { deleteToken } = await import("firebase/messaging");
    await deleteToken(msg);
    return true;
  } catch {
    return false;
  }
}