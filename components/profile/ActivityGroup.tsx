import Link from "next/link";
import {
  IconActivity,
  IconBell,
  IconShieldCheck,
  IconStar,
} from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";
import type { ProfileRole } from "@/lib/db/profile";

/**
 * شريط المؤشرات الحيوية والنشاط المدمج — مستوحى من نمط Instagram Profile
 * (عرض خالص — Server Component بدون "use client").
 */
export function ActivityGroup({
  role,
  favoritesCount,
  reviewsCount,
}: {
  role: ProfileRole;
  favoritesCount: number;
  reviewsCount: number;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-2 sm:p-2.5 shadow-xs grid grid-cols-3 divide-x divide-x-reverse divide-border/60">
      {/* 1. المفضلة */}
      <Link
        href="/favorites"
        className="flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-colors hover:bg-muted/40 group"
      >
        <span className="font-heading text-lg sm:text-xl font-black text-foreground group-hover:text-amber-500 transition-colors">
          {toArabicDigits(favoritesCount)}
        </span>
        <span className="mt-0.5 text-xs font-bold text-muted flex items-center gap-1 group-hover:text-amber-500/90 transition-colors">
          <IconStar className="h-3.5 w-3.5 text-amber-500 fill-current" />
          <span>المفضلة</span>
        </span>
      </Link>

      {/* 2. التقييمات */}
      <Link
        href="/activity"
        className="flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-colors hover:bg-muted/40 group"
      >
        <span className="font-heading text-lg sm:text-xl font-black text-foreground group-hover:text-accent transition-colors">
          {toArabicDigits(reviewsCount)}
        </span>
        <span className="mt-0.5 text-xs font-bold text-muted flex items-center gap-1 group-hover:text-accent transition-colors">
          <IconActivity className="h-3.5 w-3.5 text-accent" />
          <span>تقييماتي</span>
        </span>
      </Link>

      {/* 3. المؤشر الثالث حسب الدور */}
      {role === "client" ? (
        <Link
          href="/profile/requests"
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-colors hover:bg-muted/40 group"
        >
          <span className="font-heading text-lg sm:text-xl font-black text-foreground group-hover:text-action transition-colors">
            طلباتي
          </span>
          <span className="mt-0.5 text-xs font-bold text-muted flex items-center gap-1 group-hover:text-action transition-colors">
            <IconBell className="h-3.5 w-3.5 text-action" />
            <span>متابعة</span>
          </span>
        </Link>
      ) : role === "craftsman" ? (
        <Link
          href="/dashboard/leads"
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-colors hover:bg-muted/40 group"
        >
          <span className="font-heading text-lg sm:text-xl font-black text-foreground group-hover:text-action transition-colors">
            الطلبات
          </span>
          <span className="mt-0.5 text-xs font-bold text-muted flex items-center gap-1 group-hover:text-action transition-colors">
            <IconBell className="h-3.5 w-3.5 text-action" />
            <span>عروض عمل</span>
          </span>
        </Link>
      ) : (
        <Link
          href="/admin"
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-colors hover:bg-muted/40 group"
        >
          <span className="font-heading text-lg sm:text-xl font-black text-foreground group-hover:text-amber-500 transition-colors">
            الإدارة
          </span>
          <span className="mt-0.5 text-xs font-bold text-muted flex items-center gap-1 group-hover:text-amber-500 transition-colors">
            <IconShieldCheck className="h-3.5 w-3.5 text-amber-500" />
            <span>شاملة</span>
          </span>
        </Link>
      )}
    </div>
  );
}
