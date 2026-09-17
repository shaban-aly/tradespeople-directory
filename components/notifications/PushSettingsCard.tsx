"use client";

import { Button } from "@/components/shared/ui/Button";
import { IconBell, IconBellOff, IconX } from "@/components/shared/icons";
import { usePushNotifications, type PushStatus } from "@/hooks/usePushNotifications";

function StatusPill({ status }: { status: PushStatus }) {
  if (status === "enabled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
        مفعّلة
      </span>
    );
  }
  if (status === "disabled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-border/60 px-2.5 py-0.5 text-xs font-semibold text-muted">
        موقوفة
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold text-muted">
      غير مفعّلة
    </span>
  );
}

function stateLabel(status: PushStatus): string {
  switch (status) {
    case "unsupported":
      return "متصفحك لا يدعم إشعارات المتصفح (يلزم Notification و Service Worker).";
    case "unconfigured":
      return "إعدادات Firebase لم تُضف بعد — عليك تفعيلها من مسؤول المشروع وتُظهر تلقائياً.";
    case "blocked":
      return "محظورة من إعدادات المتصفح.";
    case "asking":
      return "بانتظار موافقة المتصفح…";
    case "enabled":
      return "تعمل — ستصل إشعارات الفعاليات حتى لو أغلقت الموقع.";
    case "disabled":
      return "موقوفة منك — فعّلها متى شئت.";
    default:
      return "تُفعَّل تلقائياً عند أول تفاعل — وافق المتصفح وتسجَّل تلقائياً.";
  }
}

/**
 * صفّ إعدادات إشعارات المتصفح — يُعرض داخل صفحة الملف الشخصي (الإعدادات) فقط،
 * وليس داخل صفحة الإشعارات (التفعيل تلقائي؛ هنا التحكم بالوقف/إعادة التفعيل).
 */
export function PushSettingsCard() {
  const push = usePushNotifications();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <IconBell className="h-5 w-5" />
          </span>
          <div>
            <p className="flex flex-wrap items-center gap-2 text-base font-bold text-foreground">
              إشعارات المتصفح
              <StatusPill status={push.status} />
            </p>
            <p className="mt-0.5 max-w-sm text-xs leading-relaxed text-muted">
              {stateLabel(push.status)}
            </p>
          </div>
        </div>

        {push.enabled ? (
          <Button variant="outline" size="sm" onClick={() => void push.disable()}>
            <IconBellOff className="h-4 w-4" />
            إيقاف
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => void push.enable()}
            disabled={
              push.status === "unsupported" ||
              push.status === "unconfigured" ||
              push.status === "blocked"
            }
          >
            <IconBell className="h-4 w-4" />
            {push.status === "disabled" ? "إعادة التفعيل" : "تفعيل"}
          </Button>
        )}
      </div>

      {push.status === "blocked" && (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-danger">
          <IconX className="mt-0.5 h-4 w-4 shrink-0" />
          رفضت إذن الإشعارات سابقاً من المتصفح — عدّل من شريط العنوان: أيقونة القفل ←
          إشعارات هذا الموقع، ثم عُد هنا وشغّلها.
        </p>
      )}
    </div>
  );
}