/**
 * التحقق من الروابط الداخلية (Internal Link Guard).
 *
 * `metadata.link` في الإشعارات يأتي من مصادر مختلفة (بث الإدارة تحديداً)، ويُستخدم
 * لاحقاً كـ `href` في `next/link` وكـ رابط نقرة لـ FCM. أي قيمة مثل `//evil.example`
 * أو `javascript:alert(1)` أو `https://…` كانت ستُخزَّن وتُستخدم كأمر تنقّل قابل
 * للتحويل خارجي أو للتنفيذ.
 *
 * القاعدة (مطابقة حرفياً لـ `public.is_safe_internal_link` في migration
 * `20261004072423_notification_internal_link_guard.sql` — أي تعديل هنا يجب أن
 * يقابله تعديل هناك):
 *   - يبدأ بـ `/` واحد
 *   - لا يبدأ بـ `//` (protocol-relative ⇒ تحويل خارجي)
 *   - لا محارف تحكّم / مسافات / backslash
 *   - لا `:` قبل أول `?` أو `#` (يمنع javascript:/data:/http:/tel:/mailto: …)
 *   - الطول بين 1 و 500
 */

/** الحد الأقصى لطول الرابط الداخلي (يطابق قيد القاعدة) */
export const MAX_INTERNAL_LINK_LENGTH = 500;

const CONTROL_OR_SPACE_OR_BACKSLASH = /[\u0000-\u001f\u007f\s\\]/;

export function isSafeInternalLink(link: unknown): link is string {
  if (typeof link !== "string") return false;
  if (link.length < 1 || link.length > MAX_INTERNAL_LINK_LENGTH) return false;

  // يبدأ بـ `/` واحد بالضبط — لا `//` ولا رابط مطلق
  if (!link.startsWith("/")) return false;
  if (link.startsWith("//")) return false;

  if (CONTROL_OR_SPACE_OR_BACKSLASH.test(link)) return false;

  // أي مخطط قبل أول `?` أو `#` مرفوض
  const path = link.split("?")[0].split("#")[0];
  if (path.includes(":")) return false;

  return true;
}

/**
 * يستخرج رابط التنقّل الداخلي الصالح من إشعار، مع مسار احتياطي آمن.
 * يُرجع `null` عندما لا يوجد رابط صالح — ولا يُرجع أبداً قيمة غير داخلية.
 */
export function resolveNotificationLink(
  metadata: unknown,
  fallback: string | null = null,
): string | null {
  if (metadata && typeof metadata === "object") {
    const link = (metadata as { link?: unknown }).link;
    if (isSafeInternalLink(link)) return link;
  }
  return fallback;
}
