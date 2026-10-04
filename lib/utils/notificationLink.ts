import { isSafeInternalLink, resolveNotificationLink } from "./internalLink";
import { craftsmanHref } from "./url";

/** الأقسام الإدارية التي يوجّه إليها كل نوع إشعار بدل /admin العام */
const ADMIN_SECTION_BY_TYPE: Record<string, string> = {
  new_request: "/admin/requests",
  new_craftsman: "/admin/requests",
  new_report: "/admin/reports",
  new_message: "/admin/messages",
};

/** الصفحة التي نعود إليها عند غياب أي رابط صالح */
export const NOTIFICATIONS_FALLBACK_HREF = "/notifications";

interface NotificationLike {
  type: string;
  metadata?: unknown;
  recipient_id?: string;
}

export interface ResolveHrefOptions {
  /** المستخدم الحالي مشرف — بدونه نتجاهل روابط الإدارة (403 في proxy) */
  isAdmin: boolean;
  /** معرّف المستخدم الحالي — يمنع فتح رابط إشعار خاص بمستخدم آخر */
  currentUserId?: string | null;
}

function isAdminPath(link: string): boolean {
  return link === "/admin" || link.startsWith("/admin/") || link.startsWith("/admin?");
}

/**
 * يحدّد رابط التنقّل لإشعار، بلا أي خروج عن الموقع. ترتيب الأولويات:
 *   0) إشعار يخصّ مستخدماً آخر ⇒ لا رابط (سلامة إضافية فوق RLS).
 *   1) `metadata.link` إن كان رابطاً داخلياً صالحاً — ولا يُفتح مسار محمي
 *      (/admin*) لمستخدم ليس مشرفاً، لأن `proxy.ts` سيحوّله إلى redirect.
 *   2) القسم الإداري المعني لنوع الإشعار (وليس /admin العام) — للمشرف فقط،
 *      قبل slug حتى لا يبتلع `metadata.slug` مسار القسم.
 *   3) صفحة الصنايعي إن كان `metadata.slug` موجوداً.
 *   4) مركز الإشعارات كمسار احتياطي — فإشعار قديم برابط ناقص أو تالف
 *      يبقى قابلاً للفتح بدل رسالة غير قابلة للنقر.
 */
export function resolveNotificationHref(
  notification: NotificationLike,
  options: ResolveHrefOptions,
): string | null {
  const { isAdmin, currentUserId } = options;

  if (
    currentUserId &&
    notification.recipient_id &&
    notification.recipient_id !== currentUserId
  ) {
    return null;
  }

  // 1) رابط صريح: صالح داخلياً فقط، ولا مسار محمي لغير المشرف
  const explicit = resolveNotificationLink(notification.metadata, null);
  if (explicit && (isAdmin || !isAdminPath(explicit))) return explicit;

  // 2) القسم الإداري المعني — للمشرف فقط
  const section = ADMIN_SECTION_BY_TYPE[notification.type];
  if (section && isAdmin) return section;

  // 3) صفحة الصنايعي من slug — نتحقق من الرابط الناتج لأن slug بيانات واردة
  const slug =
    notification.metadata && typeof notification.metadata === "object"
      ? (notification.metadata as { slug?: unknown }).slug
      : undefined;
  if (typeof slug === "string" && slug.trim().length > 0) {
    const href = craftsmanHref(slug.trim());
    if (isSafeInternalLink(href)) return href;
  }

  // 4) مسار احتياطي آمن
  return NOTIFICATIONS_FALLBACK_HREF;
}