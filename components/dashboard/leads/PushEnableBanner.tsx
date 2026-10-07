"use client";

import { useState } from "react";
import { Button } from "@/components/shared/ui/Button";
import { IconBell } from "@/components/shared/icons";
import { usePushNotifications } from "@/hooks/notifications/usePushNotifications";

/**
 * دعوة سياقية لتفعيل إشعارات الطلبات الجديدة في صفحة عروض الفني —
 * السرعة هنا = الفوز بالشغل. تختفي تماماً عند التفعيل.
 */
export function PushEnableBanner() {
  const { status, enable } = usePushNotifications();
  const [busy, setBusy] = useState(false);

  if (status === "enabled") return null;

  const blocked = status === "blocked" || status === "unsupported";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-accent/40 bg-accent/5 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <IconBell className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-base font-bold text-foreground">لا يفوتك أي طلب جديد</p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted">
            {blocked
              ? "إشعارات المتصفح محظورة أو غير مدعومة على هذا الجهاز — فعّلها من إعدادات المتصفح ليصلك كل طلب فوراً."
              : "فعّل الإشعارات ليصلك كل طلب في تخصصك لحظة وصوله — أول 3 صنايعية فقط يفوزون."}
          </p>
        </div>
      </div>
      {!blocked && (
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="w-full shrink-0 sm:w-auto"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void enable().finally(() => setBusy(false));
          }}
        >
          {busy ? "جاري التفعيل..." : "تفعيل الإشعارات"}
        </Button>
      )}
    </div>
  );
}
