"use client";

import { useEffect, useState } from "react";
import { IconTrendingUp } from "@/components/shared/icons";

type CraftsmanStatsData = {
  views: number;
  calls: number;
  whatsapp: number;
  updated_at: string | null;
};

/**
 * يجلب عدادات المشاهدات/الاتصالات من /api/craftsman-stats/[id]
 * ويعرضها client-side — بحيث لا تُسبب أي ISR Write عند تغير العداد.
 *
 * المسار /api/craftsman-stats/[id] مُكَّش على Vercel 5 دقائق، لذا
 * لا يضرب Supabase مع كل زائر جديد.
 *
 * الاستخدام:
 *   <ViewsCounter craftsmanId={craftsman.id} />
 */
export function ViewsCounter({ craftsmanId }: { craftsmanId: string }) {
  const [stats, setStats] = useState<CraftsmanStatsData | null>(null);

  useEffect(() => {
    if (!craftsmanId) return;

    let cancelled = false;
    fetch(`/api/craftsman-stats/${craftsmanId}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json() as Promise<CraftsmanStatsData>;
      })
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        // فشل صامت — لا يُظهر الكومبوننت
      });

    return () => {
      cancelled = true;
    };
  }, [craftsmanId]);

  // لا نعرض شيئاً حتى تصل البيانات أو إذا كان عداد المشاهدات صفراً
  if (!stats || stats.views === 0) return null;

  return (
    <div
      aria-label={`${stats.views} مشاهدة`}
      className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-sm font-bold text-muted"
    >
      <IconTrendingUp className="h-4 w-4 shrink-0 text-accent" aria-hidden />
      <span>{stats.views.toLocaleString("ar-EG")} مشاهدة</span>
    </div>
  );
}
