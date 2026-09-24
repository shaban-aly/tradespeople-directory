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
  | "click_whatsapp"
  | "contact_click"
  | "login"
  | "sign_up"
  | "in_app_browser_notice"
  | "external_browser_prompt"
  | "page_404";

type AnalyticsEventParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * يُطلق حدث GA4 عبر gtag أو dataLayer.
 * لا يفعل شيئاً على الخادم أو في بيئة بلا GA.
 */
export function track(eventName: AnalyticsEventName, params?: AnalyticsEventParams): void {
  if (typeof window === "undefined") return;

  const eventData = params ?? {};

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, eventData);
    return;
  }

  const dl = window.dataLayer;
  if (Array.isArray(dl)) {
    dl.push({ event: eventName, ...eventData });
  }
}