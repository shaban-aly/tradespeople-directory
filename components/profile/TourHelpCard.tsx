"use client";

import { TOUR_START_EVENT } from "@/hooks/tour/useTour";
import { Button } from "@/components/shared/ui/Button";
import { IconSparkles, IconChevronLeft } from "@/components/shared/icons";

/** بطاقة تشغيل الجولة التعريفية يدوياً من إعدادات البروفايل. */
export function TourHelpCard() {
  const startTour = () => {
    window.dispatchEvent(new Event(TOUR_START_EVENT));
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <IconSparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-bold text-foreground">
            جولة تعريفية
          </p>
          <p className="text-xs text-muted">
            تعرّف على دليل الصنايعية في أقل من دقيقة
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="outline" size="sm" onClick={startTour}>
          ابدأ الجولة
        </Button>
        <IconChevronLeft className="h-5 w-5 text-muted" />
      </div>
    </div>
  );
}