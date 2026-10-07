"use client";

import { useLeadsRealtime } from "@/hooks/leads/useLeadsRealtime";

/** Client island: يفعّل التحديث اللحظي للصفحة الحالية عند تغيّر العروض. */
export function LeadsRealtimeBridge() {
  useLeadsRealtime(true);
  return null;
}
