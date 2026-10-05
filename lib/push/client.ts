// أدوات المتصفح لإشعارات Web Push (Firebase Messaging).
// لا تُستدعى هذه الدوال إلا من داخل useEffect/event handlers — لا قراءة
// للبيئة أثناء الريندر؛ القاعدة: انقديم بقيمة محايدة ثم behave في التأثير.
//
// قاعدة التصميم الحاكمة: **لا تُبتلع أخطاء التسجيل أبداً**.
// كل فشل يُعاد كـ PushTokenResult يحمل `reason` صريحاً، لأن ابتلاعه هو ما كان
// يجعل الواجهة تعرض «مفعّل» لجهاز لا يستقبل شيئاً ولا يمكن تشخيصه.

import { firebaseConfig, PUSH_APP_NAME } from "./config";
import type { Messaging } from "firebase/messaging";

export const SW_PATH = "/sw.js";

/**
 * أسباب فشل تفعيل/تجديد تسجيل الإشعارات.
 * `blocked` قرار من المتصفح ولا يُحاول تجاوزه؛ الباقي أسباب تقنية قابلة للإصلاح.
 */
export type PushFailureReason =
  | "unsupported" // لا Notification ولا ServiceWorker (أو iOS بلا تثبيت)
  | "unconfigured" // مفاتيح Firebase غير معبّأة
  | "blocked" // permission === "denied" — قرار المستخدم في المتصفح
  | "not_granted" // permission === "default" ولم يُطلب بعد (أو طُلب بلا gesture)
  | "sw_failed" // فشل تسجيل Service Worker
  | "messaging_failed" // فشل تهيئة firebase/messaging
  | "token_failed" // getToken رجع null أو threw
  | "register_failed"; // فشل تسجيل التوكن في القاعدة (RPC)

export type PushTokenResult =
  | { ok: true; token: string }
  | { ok: false; reason: PushFailureReason; detail?: string };

/** أي أسباب الفشل يستحق إعادة محاولة تلقائية (الشبكة/SW/token) */
const RETRYABLE_REASONS: ReadonlySet<PushFailureReason> = new Set([
  "sw_failed",
  "messaging_failed",
  "token_failed",
  "register_failed",
]);

export function isRetryablePushFailure(reason: PushFailureReason): boolean {
  return RETRYABLE_REASONS.has(reason);
}

function errorDetail(err: unknown): string | undefined {
  if (err instanceof Error) {
    const msg = err.message || err.name;
    return msg.slice(0, 200) || undefined;
  }
  if (typeof err === "string" && err.trim()) return err.trim().slice(0, 200);
  return undefined;
}

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

type SwResult =
  | { ok: true; reg: ServiceWorkerRegistration }
  | { ok: false; reason: PushFailureReason; detail?: string };

/**
 * تسجيل الـ Service Worker الموحد (idempotent).
 * `updateViaCache: "none"` يمنع المتصفح من خدمة نسخة قديمة من سكربت الـ SW من
 * HTTP cache دون إعادة تحقق — بدونه قد يبقى جهاز فوقي version مشغّلاً لأسابيع.
 */
async function ensurePushSw(): Promise<SwResult> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return { ok: false, reason: "unsupported" };
  }
  try {
    const reg = await navigator.serviceWorker.register(SW_PATH, {
      scope: "/",
      updateViaCache: "none",
    });
    await navigator.serviceWorker.ready;
    return { ok: true, reg };
  } catch (err) {
    return { ok: false, reason: "sw_failed", detail: errorDetail(err) };
  }
}

export interface PushTokenOptions {
  /**
   * `true` (الافتراضي): يُسمح بطلب الإذن — يجب استدعاؤها داخل user gesture.
   * `false`: لا يطلب الإذن إطلاقاً؛ يُفشل فوراً بـ`not_granted` إن لم يكن ممنوحاً.
   *   يُستخدم في الفحص الذاتي عند التحميل، لأن طلب الإذن بلا gesture يُرفض
   *   ويُسجّل كرفض دائم في بعض المتصفحات.
   */
  prompt?: boolean;
}

/** الحصول على FCM token للتسجيل، مع سبب صريح عند الفشل (لا null صامت) */
export async function requestPushToken(
  options: PushTokenOptions = {},
): Promise<PushTokenResult> {
  const prompt = options.prompt !== false;

  if (typeof Notification === "undefined") {
    return { ok: false, reason: "unsupported" };
  }
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return { ok: false, reason: "unsupported" };
  }
  const cfg = firebaseConfig();
  if (!cfg) return { ok: false, reason: "unconfigured" };

  let permission: NotificationPermission;
  try {
    if (Notification.permission === "granted") {
      permission = "granted";
    } else if (Notification.permission === "denied") {
      return { ok: false, reason: "blocked" };
    } else if (!prompt) {
      return { ok: false, reason: "not_granted" };
    } else {
      permission = await Notification.requestPermission();
    }
  } catch (err) {
    return { ok: false, reason: "token_failed", detail: errorDetail(err) };
  }
  if (permission !== "granted") return { ok: false, reason: "blocked" };

  const sw = await ensurePushSw();
  if (!sw.ok) return { ok: false, reason: sw.reason, detail: sw.detail };

  const msg = await getMessagingSafe();
  if (!msg) return { ok: false, reason: "messaging_failed" };

  try {
    const { getToken } = await import("firebase/messaging");
    const token = await getToken(msg, {
      vapidKey: cfg.vapidKey,
      serviceWorkerRegistration: sw.reg,
    });
    if (!token) {
      return { ok: false, reason: "token_failed", detail: "getToken returned empty" };
    }
    return { ok: true, token };
  } catch (err) {
    return { ok: false, reason: "token_failed", detail: errorDetail(err) };
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

export type PushPermissionState = NotificationPermission | "unsupported";
export type PushSwState =
  | "unsupported"
  | "none"
  | "installing"
  | "waiting"
  | "activated";

export interface PushHealth {
  supported: boolean;
  configured: boolean;
  permission: PushPermissionState;
  swState: PushSwState;
  /** هل يسيطر SW على الصفحة الحالية (يعني أن الـ push سيصل بلا فتح تبويب) */
  controlled: boolean;
}

/**
 * فحص صحة سلسلة Push بلا أي طلب إذن وبلا minting لـ token.
 * آمن للاستدعاء عند التحميل: لا يعرض أي شيء على المستخدم ولا يغيّر حالة.
 */
export async function getPushHealth(): Promise<PushHealth> {
  const base: PushHealth = {
    supported: false,
    configured: false,
    permission: "unsupported",
    swState: "unsupported",
    controlled: false,
  };

  if (typeof window === "undefined") return base;

  base.configured = firebaseConfig() !== null;

  if (typeof Notification === "undefined") {
    base.permission = "unsupported";
    return base;
  }
  base.permission = Notification.permission;

  if (!("serviceWorker" in navigator)) return base;

  base.supported = true;
  base.swState = "none";
  base.controlled = !!navigator.serviceWorker.controller;

  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) return base;
    if (reg.installing) base.swState = "installing";
    else if (reg.waiting) base.swState = "waiting";
    else if (reg.active) base.swState = "activated";
  } catch {
    // فحص فقط — الفشل يُترك للخطوة الحقيقية التي تُرجع سبباً صريحاً
  }

  return base;
}

export interface ForegroundPushMessage {
  title: string;
  body: string;
  link?: string;
  notificationId?: string;
}

/**
 * الاستماع لإشعارات FCM الواردة أثناء فتح واستخدام التطبيق (Foreground).
 * يستخرج البيانات من payload.data فقط (data-only).
 * يُعيد دالة إلغاء اشتراك (cleanup) لفك الـ listener بأمان.
 */
export function listenToForegroundPush(
  callback: (message: ForegroundPushMessage) => void,
): () => void {
  if (
    typeof window === "undefined" ||
    typeof Notification === "undefined" ||
    Notification.permission !== "granted"
  ) {
    return () => {};
  }

  let unsubscribe: (() => void) | null = null;
  let isCancelled = false;

  void (async () => {
    const msg = await getMessagingSafe();
    if (!msg || isCancelled) return;

    try {
      const { onMessage } = await import("firebase/messaging");
      if (isCancelled) return;

      unsubscribe = onMessage(msg, (payload) => {
        const data = (payload.data ?? {}) as Record<string, string>;
        const title = data.title || "إشعار جديد";
        const body = data.body || "";
        const link = data.link || undefined;
        const notificationId = data.notification_id || undefined;

        callback({
          title,
          body,
          link,
          notificationId,
        });
      });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[Push Client] Failed to listen to foreground push:", err);
      }
    }
  })();

  return () => {
    isCancelled = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}