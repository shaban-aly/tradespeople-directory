// أدوات DOM خاصة بالجولة — تعمل في المتصفح فقط (client-only).
// تُبقي منطق الانتظار/القياس/التمرير خارج الكومبوننت ليكون قابلاً للتبديل في الاختبار.

export const TOUR_WAIT_INTERVAL = 160;
export const TOUR_WAIT_TIMEOUT = 8000;

export interface ElementRect {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
}

/** مقياس الموبايل: نفس كسر Tailwind `sm` (640px). */
export function isMobileViewport(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(max-width: 639px)").matches;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function findTourElement(selector: string): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(selector);
}

/** رابط أول كارت صنايعي في الصفحة (يُستخدم لخطوة الانتقال للتفاصيل). */
export function findFirstCardLink(): string | null {
  if (typeof document === "undefined") return null;
  const card = document.querySelector<HTMLElement>('[data-tour="craftsman-card"]');
  const link = card?.querySelector<HTMLAnchorElement>('a[href^="/craftsman/"]');
  return link?.getAttribute("href") ?? null;
}

export function getElementRect(el: HTMLElement): ElementRect {
  const r = el.getBoundingClientRect();
  return {
    top: r.top,
    bottom: r.bottom,
    left: r.left,
    right: r.right,
    width: r.width,
    height: r.height,
  };
}

/** هل القياسان متطابقان رقمياً (لتجنّب re-render بلا داعٍ في حلقة القياس)؟ */
export function rectsEqual(a: ElementRect, b: ElementRect): boolean {
  return (
    a.top === b.top &&
    a.bottom === b.bottom &&
    a.left === b.left &&
    a.right === b.right &&
    a.width === b.width &&
    a.height === b.height
  );
}

/** زوايا العنصر الدائرية بالبكسل لقصّ spotlight على شكله (بسقف 24px لأشكال الـ pill). */
export function getElementRadius(el: HTMLElement): number {
  if (typeof window === "undefined" || typeof window.getComputedStyle !== "function") {
    return 0;
  }
  const value = window.getComputedStyle(el).borderRadius;
  if (!value) return 14;
  const px = parseFloat(value);
  if (!Number.isFinite(px) || px <= 0) return 14;
  return Math.min(px, 24);
}

/** هل العنصر ما زال متصلاً بالـ DOM (يعالج إعادة البناء بعد Reveal/Suspense/تغيّر auth)؟ */
export function isElementConnected(el: HTMLElement): boolean {
  if (typeof el.isConnected === "boolean") return el.isConnected;
  return typeof document !== "undefined" && document.body.contains(el);
}

export function isElementInViewport(rect: ElementRect, padding = 8): boolean {
  if (typeof window === "undefined") return false;
  return (
    rect.top >= -padding &&
    rect.left >= -padding &&
    rect.bottom <= window.innerHeight + padding &&
    rect.right <= window.innerWidth + padding
  );
}

/** تمرير برمجي مراعٍ للحركة المقلّلة والهيدر الثابت. */
export function scrollElementIntoView(el: HTMLElement): void {
  if (typeof window === "undefined") return;
  const rect = getElementRect(el);
  const fits = rect.height <= window.innerHeight * 0.65;
  if (isElementInViewport(rect) && fits) return;
  el.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "center",
  });
}