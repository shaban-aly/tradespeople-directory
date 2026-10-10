"use client";

import { AdminButton } from "@/components/admin/ui/AdminButton";
import { IconCopy } from "@/components/shared/icons";
import { useToast } from "@/hooks/ui/useToast";
import type { PushDiagnosticRow } from "@/lib/db/admin";
import { pushDiagnosticGroupOf } from "@/lib/db/admin-selectors";
import { formatFriendlyDeviceName } from "@/lib/push/device";
import { toArabicDigits } from "@/lib/utils/format";
import { formatRelativePast } from "@/lib/utils/time";

/** نص عربي لكل سبب في القائمة المغلقة داخل `report_push_diagnostic` */
const REASON_LABELS: Record<string, string> = {
  unsupported: "المتصفح لا يدعم الإشعارات",
  unconfigured: "مفاتيح الإشعارات غير مضبوطة",
  blocked: "المستخدم رفض الإذن",
  not_granted: "لم يُمنح الإذن بعد",
  sw_failed: "فشل تسجيل Service Worker",
  messaging_failed: "فشل تهيئة خدمة المراسلة",
  token_failed: "فشل إصدار التوكن",
  register_failed: "فشل حفظ التوكن في القاعدة",
};

const GROUP_BADGE: Record<string, string> = {
  technical: "bg-danger/10 text-danger border border-danger/20",
  permission: "bg-warning/10 text-warning border border-warning/20",
  capability: "bg-muted/15 text-muted border border-border",
};

export function DiagnosticCard({ row }: { row: PushDiagnosticRow }) {
  const { toast } = useToast();
  const group = pushDiagnosticGroupOf(row.reason);
  const badgeClass = (group && GROUP_BADGE[group]) || GROUP_BADGE.capability;

  const handleCopyHash = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(row.device_hash);
      toast("success", "تم نسخ بصمة الجهاز");
    }
  };

  return (
    <article className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-card transition-colors hover:border-accent/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${badgeClass}`}
        >
          {REASON_LABELS[row.reason] ?? row.reason}
        </span>
        <span
          title={toArabicDigits(row.created_at.slice(0, 10))}
          className="text-xs text-muted sm:text-sm"
        >
          {formatRelativePast(row.created_at)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-base font-bold text-foreground">
          {formatFriendlyDeviceName(row.user_agent)}
        </p>
        <span className="inline-flex items-center rounded-md bg-muted/10 px-2 py-0.5 text-xs font-semibold text-muted">
          {row.user_id ? "مستخدم مسجَّل" : "زائر"}
        </span>
      </div>

      <dl className="grid gap-1.5 text-sm text-muted">
        <div className="flex gap-2">
          <dt className="shrink-0 font-bold text-foreground">المرحلة:</dt>
          <dd className="min-w-0 wrap-break-word font-mono text-xs">{row.stage}</dd>
        </div>
        {row.detail ? (
          <div className="flex gap-2">
            <dt className="shrink-0 font-bold text-foreground">التفاصيل:</dt>
            <dd className="min-w-0 wrap-break-word leading-relaxed">{row.detail}</dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <dt className="shrink-0 font-bold text-xs text-muted">بصمة الجهاز:</dt>
            <dd
              className="min-w-0 truncate font-mono text-xs text-muted"
              dir="ltr"
              title={row.device_hash}
            >
              {row.device_hash}
            </dd>
          </div>
          <AdminButton
            type="button"
            variant="ghost"
            size="sm"
            aria-label="نسخ بصمة الجهاز"
            onClick={handleCopyHash}
            className="shrink-0 h-7 px-2 text-xs gap-1"
          >
            <IconCopy className="h-3.5 w-3.5" />
            <span>نسخ</span>
          </AdminButton>
        </div>
      </dl>
    </article>
  );
}
