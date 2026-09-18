"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";

// يسجّل في GA4 أي زيارة لصفحة غير موجودة لمراقبة أخطاء الموقع والروابط المكسورة
export function NotFoundTracker() {
  useEffect(() => {
    track("page_404", { path: window.location.pathname });
  }, []);

  return null;
}