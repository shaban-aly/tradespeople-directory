import Link from "next/link";
import { StatCard } from "@/components/admin/StatCard";
import { IconAlert, IconInbox, IconMail } from "@/components/shared/icons";
import type { OverviewMetrics } from "@/lib/db/admin-selectors";
import { toArabicDigits } from "@/lib/utils/format";

/**
 * عدّادات الإجراءات — البطاقات الثلاثة العلوية الدائمة:
 * الطلبات المعلقة / البلاغات المعلّة / الرسائل غير المقروءة.
 * كل بطاقة رابط إلى قسمها.
 */
export function ActionCounters({ metrics }: { metrics: OverviewMetrics }) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      <Link href="/admin/requests">
        <StatCard
          icon={<IconInbox className="h-6 w-6" />}
          label="طلبات معلقة"
          value={toArabicDigits(metrics.pendingRequests.length)}
          hint="بانتظار المراجعة"
        />
      </Link>
      <Link href="/admin/reports">
        <StatCard
          icon={<IconAlert className="h-6 w-6" />}
          label="بلاغات معلّة"
          value={toArabicDigits(metrics.pendingReports.length)}
          hint="بانتظار المراجعة"
        />
      </Link>
      <Link href="/admin/messages">
        <StatCard
          icon={<IconMail className="h-6 w-6" />}
          label="رسائل غير مقروءة"
          value={toArabicDigits(metrics.unreadMessages)}
          hint="رسائل فورم التواصل"
        />
      </Link>
    </section>
  );
}
