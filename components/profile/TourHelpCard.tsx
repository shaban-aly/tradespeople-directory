"use client";

import { TOUR_START_EVENT } from "@/hooks/tour/useTour";
import { IconSparkles, IconChevronLeft } from "@/components/shared/icons";

/** بطاقة تشغيل الجولة التعريفية يدوياً من إعدادات البروفايل. */
export function TourHelpCard() {
  const startTour = () => {
    window.dispatchEvent(new Event(TOUR_START_EVENT));
  };

  return (
    <button
      type="button"
      onClick={startTour}
      className="w-full flex items-center justify-between gap-3 p-4 text-right transition-colors hover:bg-accent/5 group"
      aria-label="بدء الجولة التعريفية بدليل الصنايعية"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 transition-colors group-hover:bg-amber-500 group-hover:text-white">
          <IconSparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-foreground group-hover:text-accent transition-colors">
            الجولة التعريفية بالدليل
          </p>
          <p className="text-xs text-muted">
            تعرّف على كيفية البحث والوصول لأفضل صنايعي في دقيقة
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-accent">
        <span>ابدأ الآن</span>
        <IconChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
      </div>
    </button>
  );
}