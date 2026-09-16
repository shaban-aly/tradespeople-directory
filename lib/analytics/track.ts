/**
 * طبقة GA4 الموحدة — إطلاق أحداث سلوكية فقط (بلا أي PII).
 *
 * الملف يُستدعى من event handlers/effects في مكونات العميل فقط.
 * لا يُضاف "use client" هنا لأن الدالة تتصل بـ window في جسم الدالة فقط
 * (آمن على الخادم).
 */

export type AnalyticsEventName =
  | "view_craftsman"
  | "view_category"
  | "search"
  | "search_no_results"
  | "click_phone"
  | "click_whatsapp";

type AnalyticsEventParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * يُطلق حدث GA4 عبر dataLayer (gtag جاهز من layout.tsx).
 * لا يفعل شيئاً على الخادم أو في بيئة بلا GA.
 */
export function track(eventName: AnalyticsEventName, params?: AnalyticsEventParams): void {
  if (typeof window === "undefined") return;
  const dl = window.dataLayer;
  if (!Array.isArray(dl)) return;

  // gtag() pushes to dataLayer — نستدعيها مباشرة عبر dataLayer.push
  // لتجنب الحاجة إلى window.gtag غير الموثوق.
  dl.push(["event", eventName, params ?? {}]);
}