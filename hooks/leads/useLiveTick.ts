"use client";

import { useEffect, useState } from "react";

/**
 * نبضة حية كل دقيقة — تُعيد الريندر لتحديث العدّادات الزمنية النسبية
 * ("منذ/متبقي") دون إعادة جلب. آمن للـ hydration: القيمة الأولية ثابتة
 * (0) على السيرفر والعميل معاً، والنبض يبدأ بعد الـ mount فقط.
 */
export function useLiveTick(intervalMs = 60_000): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return tick;
}
