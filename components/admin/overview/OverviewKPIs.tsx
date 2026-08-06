import Link from "next/link";
import { StatCard } from "@/components/admin/StatCard";
import {
  IconInbox,
  IconMail,
  IconPin,
  IconTags,
  IconUsers,
} from "@/components/shared/icons";
import type { OverviewMetrics } from "@/lib/db/admin-selectors";
import { toArabicDigits } from "@/lib/utils/format";

export function OverviewKPIs({ metrics }: { metrics: OverviewMetrics }) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
      <StatCard
        icon={<IconUsers className="h-6 w-6" />}
        label="صنايعية منشورين"
        value={toArabicDigits(metrics.publishedCraftsmen)}
        hint={`من إجمالي ${toArabicDigits(metrics.totalCraftsmen)} صنايعي`}
      />
      <StatCard
        icon={<IconInbox className="h-6 w-6" />}
        label="طلبات معلقة"
        value={toArabicDigits(metrics.pendingRequests.length)}
        hint="بانتظار المراجعة"
      />
      <StatCard
        icon={<IconTags className="h-6 w-6" />}
        label="تصنيفات نشطة"
        value={toArabicDigits(metrics.activeCategories)}
        hint={`من إجمالي ${toArabicDigits(metrics.totalCategories)}`}
      />
      <StatCard
        icon={<IconPin className="h-6 w-6" />}
        label="مناطق نشطة"
        value={toArabicDigits(metrics.activeAreas)}
        hint={`من إجمالي ${toArabicDigits(metrics.totalAreas)}`}
      />
      <div className="col-span-2 lg:col-span-1">
        <Link href="/admin/messages" className="block">
          <StatCard
            icon={<IconMail className="h-6 w-6" />}
            label="رسائل غير مقروءة"
            value={toArabicDigits(metrics.unreadMessages)}
            hint="رسائل فورم التواصل"
          />
        </Link>
      </div>
    </section>
  );
}
