/**
 * عرض الوقت النسبي بالعربية (client-safe، بلا اعتماد على Date.now في الريندر
 * إلا عبر تمرير قيمة الآن من المستدعي عند الحاجة للحتمية).
 */

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["minute", 60_000],
  ["hour", 3_600_000],
  ["day", 86_400_000],
];

const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });

/** «منذ 12 دقيقة» — فارق في الماضي فقط؛ أقل من دقيقة = "الآن". */
export function formatRelativePast(date: Date | string, now: Date = new Date()): string {
  const target = typeof date === "string" ? new Date(date) : date;
  const diff = now.getTime() - target.getTime();
  if (diff < 60_000) return "الآن";

  let unit: Intl.RelativeTimeFormatUnit = "minute";
  let value = Math.round(diff / 60_000);
  for (const [u, ms] of RELATIVE_UNITS) {
    const v = Math.round(diff / ms);
    if (v >= 1) {
      unit = u;
      value = v;
    }
  }
  return rtf.format(-value, unit);
}

/** «ينتهي خلال 5 ساعات» — فارق في المستقبل؛ منقضٍ = "انتهى". */
export function formatRemainingUntil(date: Date | string, now: Date = new Date()): string {
  const target = typeof date === "string" ? new Date(date) : date;
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "انتهى";

  if (diff < 60_000) return "ينتهي خلال أقل من دقيقة";

  let unit: Intl.RelativeTimeFormatUnit = "minute";
  let value = Math.round(diff / 60_000);
  for (const [u, ms] of RELATIVE_UNITS) {
    const v = Math.round(diff / ms);
    if (v >= 1) {
      unit = u;
      value = v;
    }
  }
  return `ينتهي ${rtf.format(value, unit)}`;
}

/** هل الطلب جديد (أقل من 30 دقيقة)؟ */
export function isNewWithinMinutes(date: Date | string, now: Date = new Date()): boolean {
  const target = typeof date === "string" ? new Date(date) : date;
  return now.getTime() - target.getTime() < 30 * 60_000;
}

/** تنظيف رقم الهاتف لروابط tel:/wa.me (أرقام فقط مع + اختياري في البداية). */
export function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return `tel:${digits}`;
}

export function whatsappHref(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `20${digits.slice(1)}`;
  if (!digits.startsWith("20")) digits = `20${digits}`;
  return `https://wa.me/${digits}`;
}
