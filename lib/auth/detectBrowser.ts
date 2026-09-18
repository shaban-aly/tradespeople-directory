// كشف متصفحات التطبيقات المضمّنة (In-App Browsers) ومصدر الزيارة
// دوال نقيّة آمنة على الخادم والمتصفح — تُستدعى من Server Components و Client.

export type InAppBrowserKind =
  | "facebook"
  | "messenger"
  | "instagram"
  | "whatsapp"
  | "other";

export type TrafficSource = "facebook" | "direct" | "other";

export type MobileBrowserKind = "in-app" | "chrome" | "safari" | "other";

export interface ExternalOpenHref {
  href: string;
  target?: "_blank";
  rel?: string;
}

const ANDROID_UA = /android/i;

const IOS_UA = /(iphone|ipad|ipod|ios)/i;

const MOBILE_UA = /(mobile|iphone|ipad|ipod|android|webos|blackberry|iemobile)/i;

const MOBILE_OTHER_BROWSER_TOKENS =
  /(edga|samsungbrowser|\bopr\/|fennec|\bucbrowser|opera mini)/i;

const FACEBOOK_TOKENS = /(fban|fbav|fbios|fb_iab|fb4a)/;

const GEO_COVERED_WEBVIEW_TOKENS = /(; wv\)|twitter|linkedin|snapchat)/;

/**
 * هل الـ User-Agent لجهاز موبايل (أندرويد/أيفون/تابلت/WebOS...)؟
 */
export function isMobileUserAgent(ua: string): boolean {
  if (!ua) return false;
  return MOBILE_UA.test(ua);
}

/**
 * تحديد نوع المتصفح المحمول:
 * - `in-app`: متصفح تطبيق مضمّن (فيسبوك/ماسنجر/واتساب/انستغرام/WebView عام).
 * - `chrome`: كروم جوال (أندرويد Chrome أو iOS CriOS).
 * - `safari`: سفاري iOS.
 * - `other`: متصفح جوال آخر (Edge موبايل/سامسونج إنترنت/فايرفوكس/أوبرا/UC...).
 * - `null`: ليس جهاز موبايل (ديسكتوب).
 */
export function detectMobileBrowserKind(ua: string): MobileBrowserKind | null {
  if (!ua) return null;
  if (detectInAppBrowser(ua)) return "in-app";
  if (!isMobileUserAgent(ua)) return null;
  const lower = ua.toLowerCase();
  if (MOBILE_OTHER_BROWSER_TOKENS.test(lower)) return "other";
  if (/(crios|chrome\/)/.test(lower)) return "chrome";
  if (/\bversion\/[\d.]+.*\bsafari\//i.test(lower)) return "safari";
  return "other";
}

/**
 * هل يجب اقتراح فتح الموقع في متصفح الجهاز الأساسي (كروم/سفاري)؟
 * نفعل ذلك فقط على الموبايل في متصفح مضمّن أو متصفح جوال ثانوي —
 * الديسكتوب (أي متصفح) لا يُنقل أبدًا.
 */
export function shouldPromptMobileBrowserSwitch(ua: string): boolean {
  const kind = detectMobileBrowserKind(ua);
  return kind === "in-app" || kind === "other";
}

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

/**
 * بناء رابط فتح الموقع في كروم تحديدًا (المتصفح الأساسي على الأندرويد
 * الذي يكون عليه حساب جيميل مسجّل عادةً):
 * - أندرويد: intent://… مع package=com.android.chrome لفتح كروم نفسه،
 *   و browser_fallback_url يعيد للرابط العادي إن لم يكن كروم مثبّتًا.
 * - iOS: مخطط googlechrome:// يحاول فتح كروم إن وُجد (مع fallback في
 *   الطبقة التفاعلية إلى سفاري عبر openInExternalBrowser).
 * - غيرها: فتح خارجي بسيط.
 */
export function buildChromeOpenHref(
  url: string,
  ua: string,
): ExternalOpenHref {
  if (ANDROID_UA.test(ua)) {
    try {
      const parsed = new URL(url);
      const data = `//${parsed.host}${parsed.pathname}${parsed.search}`;
      const fallback = encodeURIComponent(url);
      return {
        href: `intent:${data}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`,
      };
    } catch {
      return { href: url, target: "_blank", rel: "noopener noreferrer" };
    }
  }
  if (IOS_UA.test(ua)) {
    return { href: `googlechrome://${url.replace(/^https?:\/\//, "")}` };
  }
  return { href: url, target: "_blank", rel: "noopener noreferrer" };
}

/**
 * فتح الموقع في متصفح الجهاز الأساسي من داخل معالج نقرة (Client فقط):
 * - iOS: جرّب كروم أولًا عبر googlechrome://، وإن لم يشتغل خلال مهلة قصيرة
 *   ينتقل تلقائيًا إلى الرابط العادي (سفاري) — «جرب كروم وإلا سفاري».
 * - غير iOS: اعتماد href المبنى (intent كروم على أندرويد / فتح خارجي).
 */
export function openInExternalBrowser(url: string, ua: string): void {
  if (typeof window === "undefined") return;
  const open = buildChromeOpenHref(url, ua);
  if (open.href.startsWith("googlechrome:")) {
    const startedAt = Date.now();
    window.location.href = open.href;
    window.setTimeout(() => {
      if (Date.now() - startedAt < 3000) {
        window.location.href = url;
      }
    }, 2500);
    return;
  }
  window.location.href = open.href;
}