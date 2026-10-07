"use client";

import { useLiveTick } from "@/hooks/leads/useLiveTick";
import {
  formatRelativePast,
  formatRemainingUntil,
  isNewWithinMinutes,
} from "@/lib/utils/time";

/**
 * عرض زمني نسبي حي ("منذ ساعتين" / "ينتهي خلال 3 ساعات") — يُحسب أولاً
 * على السيرفر (`initial` حتمي، والنبضة صفر) ثم يُعاد حسابه كل دقيقة
 * على العميل.
 */
export function RelativeTime({
  value,
  mode,
  initial,
  className,
}: {
  value: string;
  mode: "past" | "remaining";
  initial: string;
  className?: string;
}) {
  const tick = useLiveTick();
  const text =
    tick === 0
      ? initial
      : mode === "past"
        ? formatRelativePast(value)
        : formatRemainingUntil(value);
  return <span className={className}>{text}</span>;
}

/**
 * شارة "جديد" (أقل من 30 دقيقة) بنفس عقد hydration الآمن: قيمة السيرفر
 * (`initial`) أولاً، ثم إعادة التقييم بوقت العميل مع النبضة الحية.
 */
export function NewLeadBadge({
  value,
  initial,
}: {
  value: string;
  initial: boolean;
}) {
  const live = useLiveTick();
  const show = live ? isNewWithinMinutes(value) : initial;
  if (!show) return null;
  return (
    <span className="bg-accent/10 text-accent px-2 py-1 rounded text-xs font-bold animate-pulse">
      جديد
    </span>
  );
}
