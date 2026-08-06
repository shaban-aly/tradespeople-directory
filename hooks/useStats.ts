"use client";

import { useCallback } from "react";
import { recordBehaviorEvent } from "@/lib/recommendations";

export type StatMetric = "view" | "call" | "whatsapp";

const DEVICE_ID_KEY = "suez:stats:device-id";
const SESSION_ID_KEY = "suez:stats:session-id";

function randomId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateStorageId(key: string, storage: Storage): string {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const id = randomId();
  storage.setItem(key, id);
  return id;
}

// معرّف مجهول مستمر للجهاز (localStorage) — لحساب الزوار الفريدين
function getDeviceId(): string {
  try {
    return getOrCreateStorageId(DEVICE_ID_KEY, window.localStorage);
  } catch {
    return "unknown";
  }
}

// معرّف الجلسة (sessionStorage) — جلسة واحدة لكل تبويب حتى إغلاقه،
// ويبقى ثابتاً مع إعادة التحميل داخل نفس التبويب لحساب معدل التحويل
function getSessionId(): string {
  try {
    return getOrCreateStorageId(SESSION_ID_KEY, window.sessionStorage);
  } catch {
    return `s-${randomId()}`;
  }
}

export function useStats() {
  const track = useCallback((slug: string, type: StatMetric) => {
    if (!slug) return;

    // إشارة سلوكية محلية لمقترحات «مقترحات لك» (تسجل حتى لو فشل الرفع)
    try {
      recordBehaviorEvent({ type, craftsmanSlug: slug, ts: Date.now() });
    } catch {
      // تجاهل
    }

    // view = صفحة تحميل تُحتسب دائماً (pageview)، بلا منع تكرار يومي.
    void fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        type,
        deviceId: getDeviceId(),
        sessionId: getSessionId(),
        path: window.location.pathname,
      }),
    }).catch(() => undefined);
  }, []);

  return { track };
}
