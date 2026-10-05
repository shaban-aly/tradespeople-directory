import type { PushDiagnosticRow } from "@/lib/db/admin";
import { pushDiagnosticGroupOf } from "@/lib/db/admin-selectors";
import { formatFriendlyDeviceName } from "@/lib/push/device";
import { formatRelativeTimeArabic } from "@/lib/utils/format";

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
  technical: "bg-red-500/10 text-red-600 dark:text-red-400",
  permission: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  capability: "bg-muted/20 text-muted",
};

export function DiagnosticCard({ row }: { row: PushDiagnosticRow }) {
  const group = pushDiagnosticGroupOf(row.reason);
  const badgeClass = (group && GROUP_BADGE[group]) || GROUP_BADGE.capability;

  return (
    <article className="grid gap-2 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-bold ${badgeClass}`}
        >
          {REASON_LABELS[row.reason] ?? row.reason}
        </span>
        <span className="text-sm text-muted">
          {formatRelativeTimeArabic(row.created_at)}
        </span>
      </div>

      <p className="text-base text-foreground">
        {formatFriendlyDeviceName(row.user_agent)}
        <span className="text-sm text-muted">
          {" — "}
          {row.user_id ? "مستخدم مسجَّل" : "زائر"}
        </span>
      </p>

      <dl className="grid gap-1 text-sm text-muted">
        <div className="flex gap-2">
          <dt className="shrink-0 font-bold">المرحلة:</dt>
          <dd className="min-w-0 break-words">{row.stage}</dd>
        </div>
        {row.detail ? (
          <div className="flex gap-2">
            <dt className="shrink-0 font-bold">التفاصيل:</dt>
            <dd className="min-w-0 break-words">{row.detail}</dd>
          </div>
        ) : null}
        <div className="flex gap-2">
          <dt className="shrink-0 font-bold">بصمة الجهاز:</dt>
          <dd className="min-w-0 break-all font-mono text-xs">{row.device_hash}</dd>
        </div>
      </dl>
    </article>
  );
}
