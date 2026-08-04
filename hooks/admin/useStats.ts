"use client";

import { useCallback } from "react";

export type StatMetric = "view" | "call" | "whatsapp";

const VIEWS_SEEN_KEY = "suez:stats:views-seen";
const DEVICE_ID_KEY = "suez:stats:device-id";

function getDeviceId(): string {
  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `d-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return "unknown";
  }
}

function todayKey(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function getSeenViews(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(VIEWS_SEEN_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function markViewSeen(slug: string): void {
  try {
    const seen = getSeenViews();
    seen[slug] = todayKey();
    window.localStorage.setItem(VIEWS_SEEN_KEY, JSON.stringify(seen));
  } catch {
    // تجاهل عدم توفر localStorage (وضع خاص مثلاً)
  }
}

export function useStats() {
  const track = useCallback((slug: string, type: StatMetric) => {
    if (!slug) return;

    // كل جهاز يحسب مشاهدة واحدة فقط لكل صنايعي في اليوم — نمنع ضرب السيرفر
    // والقاعدة عند كل دخول، ونحسب أقل عدد مشاهدات يومية لكل جهاز.
    if (type === "view") {
      const seen = getSeenViews();
      if (seen[slug] === todayKey()) return;
      markViewSeen(slug);
    }

    void fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, type, deviceId: getDeviceId() }),
    }).catch(() => undefined);
  }, []);

  return { track };
}
