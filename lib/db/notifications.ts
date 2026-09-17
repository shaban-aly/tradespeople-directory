import { createSupabase } from "./client";
import type { Database } from "./database.types";

const MAX_NOTIFICATIONS = 50;
const MAX_PAGE_NOTIFICATIONS = 200;
const MAX_MARK_IDS = 200;

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

/**
 * جلب آخر إشعارات المستخدم (ترتيب زمني تنازلي — الأحدث أولاً)
 * الـ default يعود للجرس (50)؛ الصفحة الكاملة تطلب حداً أعلى (حتى 200)
 */
export async function getUserNotifications(
  userId: string,
  limit?: number,
): Promise<NotificationRow[]> {
  const effective = Math.max(1, Math.min(limit ?? MAX_NOTIFICATIONS, MAX_PAGE_NOTIFICATIONS));
  const supabase = createSupabase();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(effective);

  if (error || !data) {
    return [];
  }
  return data as NotificationRow[];
}

/**
 * عدّاد الإشعارات غير المقروءة (0 عند الفشل — لا نكسر الواجهة لخطأ مؤقت)
 */
export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const supabase = createSupabase();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .is("read_at", null);

  if (error || typeof count !== "number") {
    return 0;
  }
  return count;
}

/**
 * تحديد إشعارات كمقروءة عبر RPC (تحقق ملكية + read_at IS NULL داخل الدالة)
 * تعيد عدد الصفوف الفعلية المحدَّثة
 */
export async function markNotificationsRead(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const supabase = createSupabase();
  const { data, error } = await supabase.rpc("mark_notifications_read", {
    p_ids: ids.slice(0, MAX_MARK_IDS),
  });

  if (error || typeof data !== "number") {
    return 0;
  }
  return data;
}