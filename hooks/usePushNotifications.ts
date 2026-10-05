"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/hooks/auth/useSession";
import { firebaseConfig } from "@/lib/push/config";
import {
  isRetryablePushFailure,
  revokePushToken,
  type PushFailureReason,
} from "@/lib/push/client";
import {
  PUSH_DEVICE_TOKEN_KEY,
  unregisterAnonymousPush,
  unregisterPushToken,
} from "@/lib/push/tokens";
import {
  executePushActivation,
  PUSH_ANON_TOKEN_KEY,
  PUSH_DISABLED_VALUE,
  PUSH_ENABLED_VALUE,
  PUSH_STORAGE_KEY,
} from "@/lib/push/activation";
import { reportPushDiagnostic } from "@/lib/push/diagnostics";

export type PushStatus =
  | "unsupported" // المتصفح لا يدعم Notification / ServiceWorker
  | "unconfigured" // مفاتيح Firebase غير معبأة بعد في env
  | "blocked" // المستخدم رفض الإذن نهائياً من إعدادات المتصفح
  | "idle" // جاهز — لم يُقر بعد
  | "asking" // طلب إذن جارٍ (يجب أن يأتي من تفاعل المستخدم)
  | "checking" // جارٍ التحقق من سلامة التسجيل الحالي (لا يطلب إذناً)
  | "enabled" // مُتحقَّق منه فعلاً: توكن صالح ومسجَّل في القاعدة
  | "disabled"; // مطفأ عند المستخدم

export interface PushNotificationsState {
  status: PushStatus;
  /** حقيقي فقط بعد نجاح تسجيل توكن فعلي — لا يُشتق من localStorage وحده */
  enabled: boolean;
  /** سبب آخر فشل تقني، ليُعرض بدل ابتلاعه */
  lastError: PushFailureReason | null;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
}

/**
 * قراءة قرار المستخدم المخزَّن:
 * - "1" → مفعّل صراحةً
 * - "0" → موقوف صراحةً (لا يُعاد التفعيل التلقائي)
 * - null → لم يُقرّر بعد (يسمح بالتفعيل التلقائي مرة واحدة)
 */
function readStoredValue(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(PUSH_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** التوكن المسجَّل سابقاً لهذا الجهاز — يبقي `disable()` قادراً على الحذف من القاعدة */
function readStoredDeviceToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(PUSH_DEVICE_TOKEN_KEY);
  } catch {
    return null;
  }
}

/** الحالة الابتدائية على المتصفح — لا تُرجع `enabled` أبداً (يلزم توكن مُتحقَّق منه) */
function computeBaseStatus(): PushStatus {
  if (typeof window === "undefined") return "idle";
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return "unsupported";
  if (!firebaseConfig()) return "unconfigured";
  if (Notification.permission === "denied") return "blocked";
  if (readStoredValue() === PUSH_DISABLED_VALUE) return "disabled";
  return "idle";
}

/**
 * هل يوجد على هذا الجهاز ما يستحق إعادة التحقق؟
 * شرطان: الإذن ممنوح + (قرار المستخدم "1" أو توكن مسجَّل محلياً).
 * لا يُطلب أي إذن هنا إطلاقاً.
 */
function shouldSelfHeal(): boolean {
  if (typeof window === "undefined" || typeof Notification === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (Notification.permission !== "granted") return false;
  return readStoredValue() === PUSH_ENABLED_VALUE || !!readStoredDeviceToken();
}

/**
 * جدول إعادة التحقق: محاولة فورية ثم تراجعات قصيرة.
 * الغرض:
 *   1) فشل مؤقت (شبكة/تسجيل SW/FCM) يجب أن يُفي لاحقاً دون تدخل المستخدم.
 *   2) `getToken` قد يتأخر على شبكات بطيئة ⇒ نحاول مرتين قبل إعلان الفشل.
 */
const SELF_HEAL_DELAYS_MS = [0, 4000, 15000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * إدارة إشعارات المتصفح (Firebase Messaging) للمسجلين والزوار المجهولين.
 *
 * المبدأ الحاكم: **لا حالة `enabled` بلا توكن مُتحقَّق منه في هذه الجلسة**.
 * كان `localStorage = "1"` + إذن ممنوح كافياً وحده، فتعطّل `getToken` أو فشل
 * تسجيل الـ SW كان يترك الواجهة تقول "مفعّل" لجهاز لا يستقبل شيئاً، ولا يبقى
 * أي أثر يسمح بتشخيص السبب.
 */
export function usePushNotifications(): PushNotificationsState {
  const { isLoggedIn } = useSession();
  const [status, setStatus] = useState<PushStatus>("idle");
  const [lastError, setLastError] = useState<PushFailureReason | null>(null);
  const registeredTokenRef = useRef<string | null>(null);
  // تسلسل الإجراءات: ختم (mutex) قائم على الوعد، فلا يُفقد أي user gesture
  // وكل إجراء ينتظر ما قبله بدل أن يُهمَل بوجود طلب جارٍ.
  const chainRef = useRef<Promise<unknown>>(Promise.resolve());

  const runExclusive = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const next = chainRef.current.then(task, task);
    chainRef.current = next.catch(() => undefined);
    return next;
  }, []);

  /** يحوّل نتيجة التفعيل إلى حالة الواجهة، ولا يقبل النجاح بلا توكن */
  const applyResult = useCallback(
    (res: {
      ok: boolean;
      status: "enabled" | "blocked" | "idle" | "unsupported";
      token: string | null;
      reason?: PushFailureReason;
    }) => {
      if (res.ok && res.token) {
        registeredTokenRef.current = res.token;
        setLastError(null);
        setStatus("enabled");
        return;
      }
      setLastError(res.reason ?? null);
      setStatus(
        res.status === "blocked"
          ? "blocked"
          : res.status === "unsupported"
            ? "unsupported"
            : "idle",
      );
    },
    [],
  );

  const report = useCallback(
    (reason: PushFailureReason | undefined, stage: string, detail?: string) => {
      if (!reason) return;
      void reportPushDiagnostic({
        reason,
        stage,
        detail: reason === "register_failed" ? undefined : detail,
      });
    },
    [],
  );

  /**
   * التحقق الذاتي: لا يطلب الإذن، ويعيد تسجيل التوكن في القاعدة.
   * يتوقف فوراً عند سبب غير قابل للإعادة (denied/unsupported/unconfigured)،
   * ويحاول الباقي حتى ينفد الجدول.
   */
  const selfHeal = useCallback(
    async (isAlive: () => boolean) => {
      let lastReason: PushFailureReason = "token_failed";

      for (const delay of SELF_HEAL_DELAYS_MS) {
        if (delay > 0) await sleep(delay);
        if (!isAlive()) return;

        const res = await executePushActivation({ isLoggedIn, prompt: false });
        if (res.ok) {
          if (!isAlive()) return;
          applyResult({ ok: true, status: "enabled", token: res.token });
          return;
        }
        if (res.reason) lastReason = res.reason;

        if (res.reason && !isRetryablePushFailure(res.reason)) {
          if (!isAlive()) return;
          applyResult({ ok: false, status: res.status, token: null, reason: res.reason });
          report(res.reason, "self_heal");
          return;
        }
      }

      // نفدت المحاولات القابلة للإعادة — نُعلن الفشل صراحةً بدل العودة
      // الصامتة إلى "مفعّل" كأن شيئاً لم يحدث.
      if (!isAlive()) return;
      applyResult({ ok: false, status: "idle", token: null, reason: lastReason });
      report(lastReason, "self_heal_exhausted");
    },
    [applyResult, isLoggedIn, report],
  );

  /**
   * الحالة الابتدائية + التحقق الذاتي عند التركيب.
   * لا يطلب الإذن هنا أبداً — الفحص الذاتي بـ `prompt:false` فقط.
   */
  useEffect(() => {
    let cancelled = false;
    const isAlive = () => !cancelled;

    void (async () => {
      // microtask أولاً — setState بعد استدعاء غير متزامن يمنع الفحوصات المتزامنة
      await Promise.resolve();
      if (!isAlive()) return;

      registeredTokenRef.current = readStoredDeviceToken();

      const base = computeBaseStatus();
      if (!isAlive()) return;
      setLastError(null);
      setStatus(base);
      if (base !== "idle") return;
      if (!shouldSelfHeal()) return;

      // "جارٍ التحقق" بدل "مفعّل": لا ندّعي تفعيلاً لم نُثبته، ولا نومض
      // بحالة مطفأة قبل أن ينتهي الفحص.
      setStatus("checking");
      await runExclusive(() => selfHeal(isAlive));
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, runExclusive, selfHeal]);

  /** تفعيل من user gesture: يطلب الإذن إن لم يكن ممنوحاً ثم يسجّل التوكن */
  const enable = useCallback(async () => {
    if (typeof Notification === "undefined") {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setLastError("blocked");
      setStatus("blocked");
      return;
    }
    setStatus("asking");
    await runExclusive(async () => {
      const res = await executePushActivation({ isLoggedIn, trigger: "manual", prompt: true });
      applyResult(res);
      if (!res.ok) {
        report(
          res.reason,
          "manual_enable",
          res.reason === "register_failed" ? undefined : res.detail,
        );
      }
    });
  }, [applyResult, isLoggedIn, report, runExclusive]);

  const disable = useCallback(async () => {
    await runExclusive(async () => {
      // نحتاج التوكن لإزالته من القاعدة؛ إن لم يُحفظ في هذه الجلسة نقرأه من
      // التخزين المحلي، وإلا بقي توكن ميت يستهلك Broadcast بلا فائدة.
      const current = registeredTokenRef.current ?? readStoredDeviceToken();
      await revokePushToken();
      if (current) {
        if (isLoggedIn) {
          await unregisterPushToken(current);
        } else {
          await unregisterAnonymousPush(current);
        }
      }
      registeredTokenRef.current = null;
      try {
        window.localStorage.removeItem(PUSH_ANON_TOKEN_KEY);
        window.localStorage.setItem(PUSH_STORAGE_KEY, PUSH_DISABLED_VALUE);
      } catch {
        // تجاهل قيود التخزين
      }
      setLastError(null);
      setStatus("disabled");
    });
  }, [isLoggedIn, runExclusive]);

  return {
    status,
    enabled: status === "enabled",
    lastError,
    enable,
    disable,
  };
}