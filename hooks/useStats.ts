"use client";

import { useCallback } from "react";
import { recordBehaviorEvent } from "@/lib/recommendations";

export type StatMetric = "view" | "call" | "whatsapp";

/**
 * عدّادات Supabase (views/calls/whatsapp) — لا يُرسل sessionId/deviceId
 * (العدّادات تكفي؛ الجلسات والسلوك التفصيلي يُقاس في GA4).
 */
export function useStats() {
  const track = useCallback((slug: string, type: StatMetric) => {
    if (!slug) return;

    // إشارة سلوكية محلية لمقترحات «مقترحات لك» (تسجل حتى لو فشل الرفع)
    try {
      recordBehaviorEvent({ type, craftsmanSlug: slug, ts: Date.now() });
    } catch {
      // تجاهل
    }

    void fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, type }),
    }).catch(() => undefined);
  }, []);

  return { track };
}