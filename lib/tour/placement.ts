// خوارزمية تموضع كارت الجولة حول الهدف — دالة خالصة (بلا DOM) قابلة للاختبار.
// الأولوية: أسفل ← أعلى ← يمين ← يسار، مع كشف التصادم مع شريط التمرير
// ومناطق keep-out (الهيدر الثابت/الشريط السفلي/شريط الاتصال الثابت) و clamp نهائي.

import type { ElementRect } from "@/lib/tour/dom";

export type TourPlacement = "bottom" | "top" | "right" | "left";

/** ارتفاعات العناصر الثابتة بالبكسل (تستخدم في منع تغطية الكارت لها). */
export const HEADER_HEIGHT = 64;
export const BOTTOM_BAR_HEIGHT = 72;
export const STICKY_CALL_HEIGHT = 84;

export interface KeepOutZone {
  /** ما لا يجب أن يغطيه الكارت أعلى الشاشة (ارتفاع الهيدر الثابت). */
  top: number;
  /** ما لا يجب أن يغطيه الكارت أسفل الشاشة (الشريط السفلي/شريط الاتصال في الموبايل). */
  bottom: number;
}

export interface PlacementRequest {
  target: ElementRect;
  tooltipWidth: number;
  tooltipHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  /** مسافة بين حافة الهدف وحافة الكارت */
  gap?: number;
  /** هامش أمان من حواف الشاشة */
  padding?: number;
  keepOut?: KeepOutZone;
}

export interface PlacementResult {
  placement: TourPlacement;
  /** إحداثيات أعلى يسار الكارت */
  x: number;
  y: number;
  /** هل يظهر الكارت بوضوح دون تغطية الهدف أو تجاوز المناطق المحجوزة */
  fits: boolean;
}

const ORDER: TourPlacement[] = ["bottom", "top", "right", "left"];

interface DesiredBox {
  x: number;
  y: number;
}

/** مربع المطلوب لكل اتجاه (كل <ـ target) دون clamp. */
function desiredBox(
  placement: TourPlacement,
  target: ElementRect,
  w: number,
  h: number,
  gap: number,
): DesiredBox {
  switch (placement) {
    case "bottom":
      return {
        x: target.left + target.width / 2 - w / 2,
        y: target.bottom + gap,
      };
    case "top":
      return {
        x: target.left + target.width / 2 - w / 2,
        y: target.top - gap - h,
      };
    case "right":
      return {
        x: target.right + gap,
        y: target.top + target.height / 2 - h / 2,
      };
    case "left":
      return {
        x: target.left - gap - w,
        y: target.top + target.height / 2 - h / 2,
      };
  }
}

function intersects(a: { x: number; y: number; w: number; h: number }, b: ElementRect) {
  return (
    a.x < b.right &&
    a.x + a.w > b.left &&
    a.y < b.bottom &&
    a.y + a.h > b.top
  );
}

export function computePlacement(req: PlacementRequest): PlacementResult {
  const { target, tooltipWidth: w, tooltipHeight: h, viewportWidth: vw, viewportHeight: vh } = req;
  const gap = req.gap ?? 12;
  const padding = req.padding ?? 12;
  const keepOut = req.keepOut ?? { top: 0, bottom: 0 };

  const best: {
    placement: TourPlacement;
    x: number;
    y: number;
    fits: boolean;
    score: number;
  } = { placement: ORDER[0], x: 0, y: 0, fits: false, score: -Infinity };

  for (const placement of ORDER) {
    const desired = desiredBox(placement, target, w, h, gap);

    // حدّ البداية رأسي: لا نغطي منطقة الهيدر ولا ننزل تحت منطقة الشريط السفلي
    const minY = keepOut.top;
    const maxYStart = Math.max(minY, vh - keepOut.bottom - h);
    const y = Math.min(Math.max(desired.y, minY), Math.max(minY, maxYStart));
    const x = Math.min(Math.max(desired.x, padding), Math.max(padding, vw - w - padding));

    const withinY = desired.y >= minY && desired.y + h <= vh - keepOut.bottom;
    const withinX = desired.x >= padding && desired.x + w <= vw - padding;
    // التغطية تُحسب على الصندوق الفعلي بعد الـ clamp (لا على الصندوق المرغوب)
    const overlapsTarget = intersects({ x, y, w, h }, target);
    const fits = withinX && withinY && !overlapsTarget && y + h <= vh - keepOut.bottom && y >= minY;

    // درجة النجاح: الموضع الفائز أولاً، ثم عدم تغطية الهدف حتى مع الـ clamp،
    // ثم الأقرب لمركز الهدف أفقياً/رأسياً
    const centerOffset =
      Math.abs(x + w / 2 - (target.left + target.width / 2)) +
      Math.abs(y + h / 2 - (target.top + target.height / 2));
    const score = (fits ? 10_000 : 0) + (overlapsTarget ? -5_000 : 0) - centerOffset;

    if (score > best.score) {
      best.placement = placement;
      best.x = x;
      best.y = y;
      best.fits = fits;
      best.score = score;
    }
  }

  return { placement: best.placement, x: best.x, y: best.y, fits: best.fits };
}