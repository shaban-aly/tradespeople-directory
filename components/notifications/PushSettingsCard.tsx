"use client";

import { IconBell, IconX } from "@/components/shared/icons";
import { ToggleSwitch } from "@/components/shared/ui/ToggleSwitch";
import { usePushNotifications, type PushStatus } from "@/hooks/notifications/usePushNotifications";
import type { PushFailureReason } from "@/lib/push/client";

function StatusIndicator({ status }: { status: PushStatus }) {
  if (status === "enabled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        مفعّلة
      </span>
    );
  }
  if (status === "disabled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/20 px-2 py-0.5 text-[11px] font-bold text-muted">
        متوقفة
      </span>
    );
  }
  if (status === "blocked") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
        محظورة
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/20 px-2 py-0.5 text-[11px] font-bold text-muted">
      غير مفعّلة
    </span>
  );
}

function getStatusDescription(status: PushStatus): string {
  switch (status) {
    case "enabled":
      return "ستصلك تنبيهات فورية بالصنايعية الجدد والردود على تقييماتك.";
    case "disabled":
      return "الإشعارات متوقفة — يمكنك تشغيلها في أي وقت لتلقي كل جديد.";
    case "blocked":
      return "تم رفض الإذن سابقاً من إعدادات المتصفح على جهازك.";
    case "asking":
      return "يرجى تأكيد الموافقة في نافذة المتصفح الظاهرة...";
    case "unsupported":
      return "متصفحك الحالي لا يدعم إشعارات الويب المباشرة.";
    case "unconfigured":
      return "خدمة الإشعارات قيد التجهيز في بيئة التطوير.";
    default:
      return "فعّل الإشعارات لتصلك تنبيهات بجديد الصنايعية وأنشطتك مباشرة.";
  }
}

/**
 * تلميح قابل للإصلاح لآخر فشل.
 * الأسباب التي تشرحها `getStatusDescription` (blocked/unsupported/unconfigured)
 * مقصودة هنا — لا نكرر نفس النص مرتين.
 */
function getErrorHint(reason: PushFailureReason | null): string | null {
  switch (reason) {
    case "sw_failed":
      return "تعذّر تجهيز خدمة الإشعارات في متصفحك. أعد تحميل الصفحة ثم حاول مجدداً.";
    case "messaging_failed":
      return "تعذّر الاتصال بخدمة الإشعارات. تحقّق من اتصالك بالإنترنت ثم أعد المحاولة.";
    case "token_failed":
      return "لم يُصدر متصفحك رمزاً للإشعارات. انتظر لحظات ثم أعد المحاولة.";
    case "register_failed":
      return "تعذّر حفظ رمز الإشعارات على الخادم. أعد المحاولة بعد قليل.";
    case "not_granted":
      return "لم يُمنح إذن الإشعارات بعد — اضغط المفتاح مرة أخرى لعرض نافذة الموافقة.";
    default:
      return null;
  }
}

export function PushSettingsCard() {
  const push = usePushNotifications();
  const errorHint = getErrorHint(push.lastError);

  const isSwitchDisabled =
    push.status === "unsupported" ||
    push.status === "unconfigured" ||
    push.status === "blocked" ||
    push.status === "asking";

  const handleToggle = (checked: boolean) => {
    if (checked) {
      void push.enable();
    } else {
      void push.disable();
    }
  };

  return (
    <div className="flex flex-col gap-3 py-1">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${push.enabled
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-accent/10 text-accent"
              }`}
          >
            <IconBell className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-foreground">
                إشعارات المتصفح
              </span>
              <StatusIndicator status={push.status} />
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-muted line-clamp-2">
              {getStatusDescription(push.status)}
            </p>
          </div>
        </div>

        {/* مفتاح تبديل ناعم ومريح للمس */}
        <div className="shrink-0 ps-2">
          <ToggleSwitch
            checked={push.enabled}
            onChange={handleToggle}
            disabled={isSwitchDisabled}
            label="تشغيل أو إيقاف إشعارات المتصفح"
          />
        </div>
      </div>

      {push.status === "blocked" && (
        <div className="mt-1 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300 border border-amber-500/20">
          <IconX className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            لتشغيل الإشعارات مجدداً: افتح إعدادات المتصفح على جهازك (أو إعدادات الموقع)، واسمح بإرسال الإشعارات لدليل الصنايعية.
          </p>
        </div>
      )}

      {errorHint && push.status !== "blocked" && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300 border border-amber-500/20"
        >
          <IconX className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>{errorHint}</p>
        </div>
      )}
    </div>
  );
}