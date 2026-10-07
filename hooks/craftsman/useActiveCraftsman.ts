"use client";

import { usePathname, useRouter } from "next/navigation";
import { ACTIVE_CRAFTSMAN_COOKIE } from "@/lib/db/craftsman-dashboard";

/**
 * تبديل الملف النشط للفني: يثبّت الاختيار في كوكي (يقرؤه السيرفر في أول
 * ريندر — بلا فلاش) ويبقيك في صفحتك الحالية مع تحديث الـ param فقط
 * (قابل للمشاركة) — لا رمي للداشبورد.
 */
export function useActiveCraftsman() {
  const router = useRouter();
  const pathname = usePathname();

  function setActiveCraftsman(id: string) {
    try {
      const oneYear = 60 * 60 * 24 * 365;
      document.cookie =
        `${ACTIVE_CRAFTSMAN_COOKIE}=${encodeURIComponent(id)}` +
        `; path=/; max-age=${oneYear}; SameSite=Lax`;
    } catch {
      // التخزين غير متاح (وضع خاص) — التنقل بالـ param يكفي للجلسة الحالية.
    }
    router.push(`${pathname}?craftsman=${encodeURIComponent(id)}`);
  }

  return { setActiveCraftsman };
}
