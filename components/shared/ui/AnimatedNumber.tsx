"use client";

import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { toArabicDigits } from "@/lib/utils/format";

// عدّ متحرّك للأرقام (من 0 للقيمة النهائية) — يظهر عربي.
export function AnimatedNumber({
  value,
  duration,
}: {
  value: number;
  duration?: number;
}) {
  const { ref, value: current } = useAnimatedNumber(value, duration);
  return <span ref={ref}>{toArabicDigits(current)}</span>;
}
