// كاشف بيانات ونوع الجهاز لإشعارات الـ Push
// يُستدعى فقط في بيئة المتصفح (Client-side) — آمن تماماً للـ SSR.

export type DeviceType = "mobile" | "tablet" | "desktop" | "unknown";

export interface DeviceInfo {
  deviceType: DeviceType;
  deviceName: string;
  userAgent: string;
}

/**
 * تحديد نوع الجهاز (موبايل، تابلت، كمبيوتر)
 */
export function detectDeviceType(ua: string): DeviceType {
  if (!ua) return "unknown";
  const lower = ua.toLowerCase();

  // تابلت أولاً (iPad, Android Tablet, etc.)
  if (
    lower.includes("ipad") ||
    (lower.includes("tablet") && !lower.includes("mobile")) ||
    (lower.includes("android") && !lower.includes("mobile"))
  ) {
    return "tablet";
  }

  // موبايل (iPhone, Android Mobile, Windows Phone, etc.)
  if (
    lower.includes("mobile") ||
    lower.includes("iphone") ||
    lower.includes("ipod") ||
    lower.includes("android") ||
    lower.includes("blackberry") ||
    lower.includes("webos")
  ) {
    return "mobile";
  }

  return "desktop";
}

/**
 * تحديد اسم المتصفح بالعربية
 */
export function detectBrowserName(ua: string): string {
  if (!ua) return "متصفح";
  const lower = ua.toLowerCase();

  if (lower.includes("edg/") || lower.includes("edge/")) return "Edge";
  if (lower.includes("samsungbrowser")) return "Samsung Internet";
  if (lower.includes("opr/") || lower.includes("opera/")) return "Opera";
  if (lower.includes("chrome") && !lower.includes("chromium")) return "Chrome";
  if (lower.includes("firefox")) return "Firefox";
  if (lower.includes("safari") && !lower.includes("chrome")) return "Safari";

  return "متصفح";
}

/**
 * تحديد نظام التشغيل بالعربية
 */
export function detectOsName(ua: string): string {
  if (!ua) return "";
  const lower = ua.toLowerCase();

  if (lower.includes("windows")) return "Windows";
  if (lower.includes("iphone") || lower.includes("ipad") || lower.includes("ipod")) return "iOS";
  if (lower.includes("android")) return "Android";
  if (lower.includes("macintosh") || lower.includes("mac os")) return "macOS";
  if (lower.includes("linux")) return "Linux";

  return "";
}

/**
 * استخراج اسم الجهاز الودود (مثال: "Chrome على Windows" أو "Safari على iPhone")
 */
export function formatFriendlyDeviceName(ua: string): string {
  const browser = detectBrowserName(ua);
  const os = detectOsName(ua);

  if (browser && os) {
    return `${browser} على ${os}`;
  }
  return browser || os || "جهاز غير معروف";
}

/**
 * قراءة بيانات الجهاز الحالي بشكل آمن للـ SSR
 */
export function getCurrentDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      deviceType: "unknown",
      deviceName: "جهاز غير معروف",
      userAgent: "",
    };
  }

  const ua = navigator.userAgent || "";
  const deviceType = detectDeviceType(ua);
  const deviceName = formatFriendlyDeviceName(ua);

  return {
    deviceType,
    deviceName,
    userAgent: ua.slice(0, 500),
  };
}
