"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TourStep } from "@/lib/tour/steps";
import type { TourStatus, TourTarget } from "@/hooks/tour/useTour";
import {
  computePlacement,
  type KeepOutZone,
  type TourPlacement,
} from "@/lib/tour/placement";
import { TourTooltip } from "@/components/tour/TourTooltip";

export interface TourOverlayProps {
  tour: "core" | "account" | null;
  step: TourStep | null;
  stepIndex: number;
  total: number;
  status: TourStatus;
  isMobile: boolean;
  target: TourTarget | null;
  keepOut: KeepOutZone;
  isFirst: boolean;
  isLast: boolean;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

interface Placed {
  x: number;
  y: number;
  placement: TourPlacement;
  w: number;
  h: number;
}

/** هامش الفتحة حول الهدف (بكسل) — يكبر قليلاً لكنه يترك الهدف قابلاً للنقر. */
const CUTOUT_PAD = 10;

/** طبقة الجولة: فتحة spotlight حقيقية حول الهدف + تعتيم البقية + كارت مرتبط بسهم. */
export function TourOverlay({
  tour,
  step,
  stepIndex,
  total,
  status,
  isMobile,
  target,
  keepOut,
  isFirst,
  isLast,
  onNext,
  onPrev,
  onClose,
}: TourOverlayProps) {
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [placed, setPlaced] = useState<Placed | null>(null);

  // القياس الصالح فقط للخطوة الحالية — يتجاهل قياسات الخطوات السابقة فور تبديلها
  const rect = target && step && target.step === step.id ? target.rect : null;
  const radius = target && step && target.step === step.id ? target.radius : 0;
  const hasTarget = Boolean(step?.target);
  const pendingTarget = hasTarget && rect === null;
  const anchored = hasTarget && rect !== null && placed !== null && status !== "closing";
  const centered = Boolean(step) && !pendingTarget && !anchored;
  const showTooltip = anchored || centered;

  useLayoutEffect(() => {
    if (!anchored || !rect || !tooltipRef.current) return;
    const w = tooltipRef.current.offsetWidth || 320;
    const h = tooltipRef.current.offsetHeight || 200;
    const result = computePlacement({
      target: rect,
      tooltipWidth: w,
      tooltipHeight: h,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      keepOut,
    });
    setPlaced({ x: result.x, y: result.y, placement: result.placement, w, h });
  }, [anchored, rect, stepIndex, isMobile, keepOut, status]);

  // نقل التركيز لكارت الجولة عند تغيّر الخطوة (إتاحة التصفح بلوحة المفاتيح)
  useLayoutEffect(() => {
    if (showTooltip && tooltipRef.current && status === "active") {
      tooltipRef.current.focus({ preventScroll: true });
    }
  }, [showTooltip, stepIndex, status]);

  if (status === "idle" || !tour || typeof document === "undefined") {
    return null;
  }

  const isClosing = status === "closing";

  // نقطة ربط السهم على حافة الكارت نحو مركز الهدف (بدون تجاوز حواف الكارت)
  let arrowX = 16;
  let arrowY = 16;
  if (anchored && rect && placed) {
    arrowX = Math.min(
      Math.max(rect.left + rect.width / 2 - placed.x, 18),
      Math.max(18, placed.w - 18),
    );
    arrowY = Math.min(
      Math.max(rect.top + rect.height / 2 - placed.y, 18),
      Math.max(18, placed.h - 18),
    );
  }

  const arrowStyle =
    placed?.placement === "bottom"
      ? { top: -5, left: arrowX - 5 }
      : placed?.placement === "top"
        ? { bottom: -5, left: arrowX - 5 }
        : placed?.placement === "right"
          ? { left: -5, top: arrowY - 5 }
          : { right: -5, top: arrowY - 5 };

  return createPortal(
    <div
      className={`pointer-events-none fixed inset-0 z-[100] transition-opacity duration-200 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      aria-live="polite"
    >
      {/* تعتيم خفيف فقط عندما لا توجد فتحة spotlight (مقدمة/بانتظار ظهور الهدف) */}
      {!anchored && <div className="absolute inset-0 bg-black/40" aria-hidden />}

      {/* فتحة spotlight حقيقية حول الهدف: يبقى الهدف قابلاً للنقر (pointer-events: none) */}
      {anchored && rect && (
        <div
          aria-hidden
          className="absolute ring-2 ring-accent/80"
          style={{
            top: rect.top - CUTOUT_PAD,
            left: rect.left - CUTOUT_PAD,
            width: rect.width + CUTOUT_PAD * 2,
            height: rect.height + CUTOUT_PAD * 2,
            borderRadius: Math.min(radius + CUTOUT_PAD, 9999),
            boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.55)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* كارت الخطوة مرتبط بالسهم */}
      {showTooltip && step && (
        <div
          className={
            anchored && placed
              ? "absolute w-[min(20rem,calc(100vw-1.5rem))] max-w-80"
              : "absolute inset-x-0 top-[16vh] flex justify-center px-4 sm:top-[20vh]"
          }
          style={
            anchored && placed
              ? { top: placed.y, left: placed.x }
              : undefined
          }
        >
          {anchored && (
            <div
              aria-hidden
              className="absolute h-2.5 w-2.5 rotate-45 rounded-[2px] border border-border bg-card"
              style={arrowStyle}
            />
          )}
          <div className="pointer-events-auto w-full">
            <div
              className={anchored ? "" : "mx-auto w-[min(26rem,100%)]"}
            >
              <TourTooltip
                ref={tooltipRef}
                step={step}
                stepIndex={stepIndex}
                total={total}
                isFirst={isFirst}
                isLast={isLast}
                isMobile={isMobile}
                onNext={onNext}
                onPrev={onPrev}
                onClose={onClose}
              />
            </div>
          </div>
        </div>
      )}

      {/* مؤشر عبور الصفحة أثناء الانتقال البرمجي */}
      {status === "navigating" && (
        <div className="absolute inset-x-0 top-[40%] flex justify-center px-4">
          <div className="pointer-events-auto rounded-full border border-border bg-card/95 px-4 py-2 text-sm font-bold text-foreground shadow-card backdrop-blur">
            بنفتح صفحة الصنايعي...
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}