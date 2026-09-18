"use client";

import { useHydratedValue } from "@/hooks/ui/useHydratedValue";
import {
  detectMobileBrowserKind,
  shouldPromptMobileBrowserSwitch,
  type MobileBrowserKind,
} from "@/lib/auth/detectBrowser";

/**
 * كشف نوع متصفح الزائر على العميل عبر نمط `useHydratedValue` الآمن للـ hydration
 * (قيمة محايدة على الخادم ثم قيمة المتصفح على العميل — لا mismatch).
 * مخصص لقرارات توجيه «افتح في متصفح الجهاز الأساسي».
 */
export function useExternalBrowserPrompt(): {
  ua: string;
  kind: MobileBrowserKind | null;
  shouldPrompt: boolean;
} {
  const ua = useHydratedValue("", () =>
    typeof navigator === "undefined" ? "" : navigator.userAgent,
  );
  return {
    ua,
    kind: ua ? detectMobileBrowserKind(ua) : null,
    shouldPrompt: ua ? shouldPromptMobileBrowserSwitch(ua) : false,
  };
}