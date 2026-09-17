"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/hooks/auth/useSession";
import { firebaseConfig } from "@/lib/push/config";
import { requestPushToken, revokePushToken } from "@/lib/push/client";
import { registerPushToken, unregisterPushToken } from "@/lib/push/tokens";

import {
  executePushActivation,
  PUSH_DISABLED_VALUE,
  PUSH_ENABLED_VALUE,
  PUSH_STORAGE_KEY,
} from "@/lib/push/activation";
import { unregisterAnonymousPush } from "@/lib/push/tokens";

export type PushStatus =
  | "unsupported" // المتصفح لا يدعم Notification / ServiceWorker
  | "unconfigured" // مفاتيح Firebase غير معبأة بعد في env
  | "blocked" // المستخدم رفض الإذن نهائياً من إعدادات المتصفح
  | "idle" // جاهز — لم يُقر بعد
  | "asking" // طلب إذن جارٍ (يجب أن يأتي من تفاعل المستخدم)
  | "enabled" // مفعّل ومسجّل
  | "disabled"; // مطفأ عند المستخدم

export interface PushNotificationsState {
  status: PushStatus;
  enabled: boolean;
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

function computeBaseStatus(): PushStatus {
  if (typeof window === "undefined") return "idle";
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return "unsupported";
  if (!firebaseConfig()) return "unconfigured";
  if (Notification.permission === "denied") return "blocked";
  const stored = readStoredValue();
  if (stored === PUSH_DISABLED_VALUE) return "disabled";
  if (Notification.permission === "granted" && stored === PUSH_ENABLED_VALUE) return "enabled";
  return "idle";
}

/**
 * إدارة إشعارات المتصفح (Firebase Messaging) للمسجلين والزوار المجهولين.
 * - بدء: قيمة محايدة ثم اشتقاق الحالة بعد أول تأثير (لا قراءة بيئة أثناء الريندر).
 * - enable/disable كلاهما إجراءات تفاعل مباشرة من المستخدم.
 * - التفعيل يفوّض لـ executePushActivation التي تطلب الإذن وتوجه للمسار الصحيح.
 */
export function usePushNotifications(): PushNotificationsState {
  const { isLoggedIn } = useSession();
  const [status, setStatus] = useState<PushStatus>("idle");
  const registeredTokenRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  const registerWithStored = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const res = await executePushActivation({ isLoggedIn });
      if (res.ok && res.token) {
        registeredTokenRef.current = res.token;
        setStatus("enabled");
      }
    } finally {
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // microtask أولاً — setState بعد استدعاء غير متزامن يمنع الفحوصات المتزامنة
      await Promise.resolve();
      const base = computeBaseStatus();
      if (cancelled) return;
      setStatus(base);
      if (base === "enabled" && readStoredValue() === PUSH_ENABLED_VALUE) {
        void registerWithStored();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const enable = useCallback(async () => {
    if (inFlightRef.current) return;
    if (typeof Notification === "undefined") {
      setStatus("unsupported");
      return;
    }
    inFlightRef.current = true;
    setStatus("asking");
    try {
      const res = await executePushActivation({ isLoggedIn, trigger: "manual" });
      if (res.ok && res.token) {
        registeredTokenRef.current = res.token;
        setStatus("enabled");
      } else {
        setStatus(res.status === "blocked" ? "blocked" : "idle");
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [isLoggedIn]);

  const disable = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const current = registeredTokenRef.current;
      await revokePushToken();
      if (current) {
        if (isLoggedIn) {
          await unregisterPushToken(current);
        } else {
          await unregisterAnonymousPush(current);
        }
        registeredTokenRef.current = null;
      }
      setStatus("disabled");
      try {
        window.localStorage.setItem(PUSH_STORAGE_KEY, PUSH_DISABLED_VALUE);
      } catch {
        // تجاهل
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [isLoggedIn]);

  return {
    status,
    enabled: status === "enabled",
    enable,
    disable,
  };
}