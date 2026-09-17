"use client";

import { useAutoPushEnabler } from "@/hooks/useAutoPushEnabler";

/**
 * مكوّن غير مرئي (بلا أي UI) — مسؤول عن التفعيل التلقائي لإشعارات المتصفح
 * عند أول تفاعل من المستخدم المسجّل. يُركَّب مرة واحدة في الـ Root Layout.
 */
export function PushAutoEnabler() {
  useAutoPushEnabler();
  return null;
}