// نواة التفعيل الموحدة (Push Activation Core).
// القاعدة الذهبية:
// "The user must never need to open Settings to receive Push Notifications for the first time."
// التفعيل يتم في لحظة قيمة (Contextual Value Moment) داخل user gesture تلقائياً،
// ويوجه المسار بسلاسة للمسجل (register_push_token) أو الزائر (register_anonymous_push).

import { requestPushToken } from "./client";
import {
  registerPushToken,
  registerAnonymousPush,
  updateAnonymousInterests,
  subscribeUserInterest,
  unsubscribeUserInterest,
} from "./tokens";

export type ActivationScope = "category" | "general" | "search";

export interface ActivationContext {
  scope: ActivationScope;
  refId?: string; // مثلاً: slug التصنيف مثل "plumbing"
  label?: string; // مثلاً: "سباكة"
}

export const PUSH_STORAGE_KEY = "push:enabled";
export const PUSH_INTERESTS_KEY = "push:interests";
export const PUSH_ANON_TOKEN_KEY = "push:anon_token";
export const PUSH_SESSION_ASKED_KEY = "push:session_asked";

export const PUSH_ENABLED_VALUE = "1";
export const PUSH_DISABLED_VALUE = "0";

/** قراءة الاهتمامات المحلية المخزنة */
export function getStoredInterests(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PUSH_INTERESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** حفظ الاهتمامات محلياً */
export function saveStoredInterests(interests: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const unique = Array.from(new Set(interests.filter(Boolean)));
    window.localStorage.setItem(PUSH_INTERESTS_KEY, JSON.stringify(unique));
  } catch {
    // تجاهل قيود التخزين
  }
}

/** إضافة اهتمام جديد (مثل متابعة تصنيف) وتحديث السيرفر (زائر عبر RPC / مسجل عبر DB) */
export async function addStoredInterest(
  categorySlug: string,
  isLoggedIn = false,
): Promise<string[]> {
  if (!categorySlug) return getStoredInterests();
  const current = getStoredInterests();
  const next = current.includes(categorySlug) ? current : [...current, categorySlug];
  saveStoredInterests(next);

  if (typeof window !== "undefined") {
    try {
      if (isLoggedIn) {
        await subscribeUserInterest(categorySlug);
      } else {
        const anonToken = window.localStorage.getItem(PUSH_ANON_TOKEN_KEY);
        if (anonToken) {
          await updateAnonymousInterests(anonToken, next);
        }
      }
    } catch {
      // تجاهل
    }
  }

  return next;
}

/** إزالة اهتمام محلي وتحديث السيرفر */
export async function removeStoredInterest(
  categorySlug: string,
  isLoggedIn = false,
): Promise<string[]> {
  const current = getStoredInterests();
  const next = current.filter((x) => x !== categorySlug);
  saveStoredInterests(next);

  if (typeof window !== "undefined") {
    try {
      if (isLoggedIn) {
        await unsubscribeUserInterest(categorySlug);
      } else {
        const anonToken = window.localStorage.getItem(PUSH_ANON_TOKEN_KEY);
        if (anonToken) {
          await updateAnonymousInterests(anonToken, next);
        }
      }
    } catch {
      // تجاهل
    }
  }

  return next;
}

/** هل المستخدم رفض الإشعارات نهائياً من المتصفح أو أوقفها صراحة من الموقع */
export function isPushBlockedOrOptedOut(): boolean {
  if (typeof window === "undefined") return true;
  if (typeof Notification === "undefined") return true;
  if (Notification.permission === "denied") return true;

  try {
    const stored = window.localStorage.getItem(PUSH_STORAGE_KEY);
    if (stored === PUSH_DISABLED_VALUE) return true;
  } catch {
    // تجاهل
  }

  return false;
}

/** هل يمكن طلب الإذن التلقائي في الجلسة الحالية */
export function canAutoPrompt(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "denied") return false;

  try {
    const stored = window.localStorage.getItem(PUSH_STORAGE_KEY);
    if (stored === PUSH_DISABLED_VALUE) return false;
    if (stored === PUSH_ENABLED_VALUE && Notification.permission === "granted") return false;

    const sessionAsked = window.sessionStorage.getItem(PUSH_SESSION_ASKED_KEY);
    if (sessionAsked) return false;
  } catch {
    return false;
  }

  return true;
}

export interface ActivationResult {
  ok: boolean;
  status: "enabled" | "blocked" | "idle" | "unsupported";
  token: string | null;
}

/**
 * تنفيذ التفعيل التلقائي (يجب استدعاؤها من داخل user gesture):
 * 1. تطلب إذن المتصفح Notification.requestPermission()
 * 2. تجلب توكن FCM
 * 3. توجه التسجيل (مسجل عبر register_push_token / زائر عبر register_anonymous_push)
 * 4. تربط الاهتمام السياقي إن وُجد
 */
export async function executePushActivation(options: {
  context?: ActivationContext;
  isLoggedIn: boolean;
  trigger?: "auto" | "manual";
}): Promise<ActivationResult> {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return { ok: false, status: "unsupported", token: null };
  }

  if (Notification.permission === "denied") {
    return { ok: false, status: "blocked", token: null };
  }

  // في حالة التفعيل التلقائي فقط: وضع علامة لمنع تكرار السؤال في نفس الجلسة
  if (options.trigger !== "manual") {
    try {
      window.sessionStorage.setItem(PUSH_SESSION_ASKED_KEY, "1");
    } catch {
      // تجاهل
    }
  }

  const token = await requestPushToken();
  if (!token) {
    // نُعيد قراءة الإذن بعد requestPushToken — TypeScript ضيّق النوع مسبقاً فنتجاوزه بـ cast
    const perm = (Notification as { permission: string }).permission;
    return {
      ok: false,
      status: perm === "denied" ? "blocked" : "idle",
      token: null,
    };
  }

  let ok = false;
  if (options.isLoggedIn) {
    ok = await registerPushToken(token);
    if (options.context?.scope === "category" && options.context.refId) {
      const interests = getStoredInterests();
      if (!interests.includes(options.context.refId)) {
        interests.push(options.context.refId);
        saveStoredInterests(interests);
      }
      await subscribeUserInterest(options.context.refId);
    }
  } else {
    // زائر مجهول: حفظ التوكن وربط الاهتمامات
    try {
      window.localStorage.setItem(PUSH_ANON_TOKEN_KEY, token);
    } catch {
      // تجاهل
    }

    const interests = getStoredInterests();
    if (options.context?.scope === "category" && options.context.refId) {
      if (!interests.includes(options.context.refId)) {
        interests.push(options.context.refId);
        saveStoredInterests(interests);
      }
    }

    ok = await registerAnonymousPush(token, interests);
  }

  if (ok) {
    try {
      window.localStorage.setItem(PUSH_STORAGE_KEY, PUSH_ENABLED_VALUE);
    } catch {
      // تجاهل
    }
    return { ok: true, status: "enabled", token };
  }

  return { ok: false, status: "idle", token: null };
}

/**
 * مزامنة تلقائية لتوكن الجهاز الحالي فور تسجيل الدخول إذا كان إذن المتصفح ممنوحاً مسبقاً
 */
export async function syncDevicePushOnLogin(): Promise<boolean> {
  if (typeof window === "undefined" || typeof Notification === "undefined") return false;
  if (Notification.permission !== "granted") return false;

  const token = await requestPushToken();
  if (!token) return false;

  const ok = await registerPushToken(token);
  if (ok) {
    try {
      window.localStorage.setItem(PUSH_STORAGE_KEY, PUSH_ENABLED_VALUE);
    } catch {
      // تجاهل
    }
  }
  return ok;
}
