import Link from "next/link";
import { IconActivity, IconChevronLeft } from "@/components/shared/icons";

/**
 * صف الانتقال إلى «سجل نشاطاتي» في صفحة الملف الشخصي.
 * (عرض خالص — Server Component بدون "use client").
 */
export function ActivityLink() {
  return (
    <Link
      href="/activity"
      className="w-full min-h-12 flex items-center justify-between px-4 py-3.5 text-right transition-colors hover:bg-accent/5 group cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-on-accent">
          <IconActivity className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-foreground group-hover:text-accent transition-colors">
            سجل نشاطاتي
          </p>
          <p className="text-xs text-muted truncate">
            استعراض كل تفاعلاتك، تقييماتك، طلباتك، ومحفوظاتك
          </p>
        </div>
      </div>
      <IconChevronLeft className="h-5 w-5 text-muted transition-transform group-hover:-translate-x-1 group-hover:text-accent shrink-0" />
    </Link>
  );
}
