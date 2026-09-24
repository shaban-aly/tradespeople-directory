"use client";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { IconDownload, IconCheck, IconChevronLeft } from "@/components/shared/icons";

/**
 * بطاقة تثبيت تطبيق الويب (PWA) داخل صفحة الملف الشخصي.
 * تتيح للمستخدم تثبيت التطبيق بضغطة زر في أي وقت أو تعرض حالة التثبيت الفعلية.
 */
export function PwaInstallCard() {
  const { installed, openInstallGuide } = useInstallPrompt();

  if (installed) {
    return (
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-action/10 text-action">
            <IconCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-foreground">
              تطبيق دليل الصنايعية
            </p>
            <p className="text-xs text-muted truncate">
              التطبيق مثبت بنجاح وتعمل بأسرع تجربة تصفح
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-action/15 px-3 py-1 text-xs font-bold text-action">
          مثبت ✓
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={openInstallGuide}
      className="w-full flex items-center justify-between gap-3 p-4 text-right transition-colors hover:bg-accent/5 group cursor-pointer"
      aria-label="تثبيت تطبيق دليل الصنايعية على هاتفك أو حاسوبك"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-on-accent">
          <IconDownload className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-foreground group-hover:text-accent transition-colors">
            تثبيت التطبيق على جهازك
          </p>
          <p className="text-xs text-muted truncate">
            وصول فوري من شاشتك الرئيسية وتصفح أسرع للصنايعية
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-accent">
        <span>تثبيت الآن</span>
        <IconChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
      </div>
    </button>
  );
}
