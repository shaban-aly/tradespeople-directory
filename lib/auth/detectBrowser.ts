// كشف متصفحات التطبيقات المضمّنة (In-App Browsers) ومصدر الزيارة
// دوال نقيّة آمنة على الخادم والمتصفح — تُستدعى من Server Components و Client.

export type InAppBrowserKind =
  | "facebook"
  | "messenger"
  | "instagram"
  | "whatsapp"
  | "other";

export type TrafficSource = "facebook" | "direct" | "other";

export interface ExternalOpenHref {
  href: string;
  target?: "_blank";
  rel?: string;
}

const ANDROID_UA = /android/i;

const FACEBOOK_TOKENS = /(fban|fbav|fbios|fb_iab|fb4a)/;

const GEO_COVERED_WEBVIEW_TOKENS = /(; wv\)|twitter|linkedin|snapchat)/;

/**
 * تحديد متصفح التطبيق المضمّن (فيسبوك/ماسنجر/انستغرام/واتساب/WebView عام)
 * من الـ User-Agent. يعيد null للمتصفحات العادية.
 */
export function detectInAppBrowser(ua: string): InAppBrowserKind | null {
  if (!ua) return null;
  const lower = ua.toLowerCase();

  if (lower.includes("messenger") || /(fbms|fban\/messenger)/.test(lower)) {
    return "messenger";
  }
  if (FACEBOOK_TOKENS.test(lower)) {
    return "facebook";
  }
  if (lower.includes("instagram")) {
    return "instagram";
  }
  if (lower.includes("whatsapp")) {
    return "whatsapp";
  }
  if (GEO_COVERED_WEBVIEW_TOKENS.test(lower)) {
    return "other";
  }
  return null;
}

/**
 * تحديد مصدر الزيارة: فيسبوك إذا وُجد fbclid أو جاء الـ referrer من فيسبوك،
 * مباشر إذا لا يوجد referrer، وغير ذلك "other" (محرك بحث/منصة أخرى).
 */
export function detectTrafficSource(
  searchParams: Record<string, string | undefined>,
  referrer: string | null | undefined,
): TrafficSource {
  if (searchParams.fbclid) return "facebook";
  if (!referrer) return "direct";
  const lower = referrer.toLowerCase();
  if (/(facebook\.com|fb\.me|m\.me)/.test(lower)) return "facebook";
  return "other";
}

/**
 * بناء رابط فتح الموقع في المتصفح الخارجي:
 * - أندرويد: intent://… بمعامل scheme=https و fallback حتى لو انهار الـ intent.
 * - iOS/غيرها: فتح مباشر عبر نافذة/تبويب خارجي بـ target=_blank.
 */
export function buildExternalBrowserOpenHref(
  url: string,
  ua: string,
): ExternalOpenHref {
  if (ANDROID_UA.test(ua)) {
    try {
      const parsed = new URL(url);
      const data = `//${parsed.host}${parsed.pathname}${parsed.search}`;
      const fallback = encodeURIComponent(url);
      return {
        href: `intent:${data}#Intent;scheme=https;S.browser_fallback_url=${fallback};end`,
      };
    } catch {
      return { href: url, target: "_blank", rel: "noopener noreferrer" };
    }
  }
  return { href: url, target: "_blank", rel: "noopener noreferrer" };
}