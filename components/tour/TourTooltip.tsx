"use client";

import { forwardRef } from "react";
import type { TourStep } from "@/lib/tour/steps";
import { stepDescription } from "@/lib/tour/steps";
import { Button } from "@/components/shared/ui/Button";
import { IconPointer, IconX } from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";

interface TourTooltipProps {
  step: TourStep;
  stepIndex: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  isMobile: boolean;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

/** كارت محتوى خطوة الجولة — بلا تحديد موضع (يُوضع داخل الـ Overlay). */
export const TourTooltip = forwardRef<HTMLDivElement, TourTooltipProps>(
  function TourTooltip(
    { step, stepIndex, total, isFirst, isLast, isMobile, onNext, onPrev, onClose },
    ref,
  ) {
    const titleId = `tour-dialog-title-${step.id}`;
    const descId = `tour-dialog-desc-${step.id}`;
    const interaction = step.interaction ?? "info";
    const interactive = interaction === "click-target" || interaction === "manual";

    return (
      <div
        ref={ref}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
            {toArabicDigits(stepIndex + 1)} من {toArabicDigits(total)}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق الجولة التعريفية"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-accent/10 hover:text-foreground"
          >
            <IconX className="h-4.5 w-4.5" />
          </button>
        </div>

        <h2
          id={titleId}
          className="mt-3 font-heading text-lg font-extrabold text-foreground sm:text-xl"
        >
          {step.title}
        </h2>
        <p id={descId} className="mt-1.5 text-sm leading-relaxed text-muted sm:text-base">
          {stepDescription(step, isMobile)}
        </p>

        {interactive && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-2.5 py-1.5 text-sm font-bold text-accent">
            <IconPointer className="h-4 w-4 shrink-0" aria-hidden />
            {interaction === "manual"
              ? "دوس على العنصر المبرز عشان تكمل"
              : "جرّب بنفسك واضغط على العنصر المبرز"}
          </p>
        )}

        <div className="mt-4 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            تخطّي الجولة
          </Button>
          <div className="flex-1" />
          {!isFirst && (
            <Button variant="ghost" size="sm" onClick={onPrev}>
              السابق
            </Button>
          )}
          {interaction === "info" ? (
            <Button variant="primary" size="sm" onClick={onNext}>
              {isLast ? "إنهاء الجولة" : "متابعة"}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onNext}>
              {isLast ? "إنهاء الجولة" : "متابعة لاحقاً"}
            </Button>
          )}
        </div>
      </div>
    );
  },
);