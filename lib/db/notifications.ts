import { createSupabase } from "./client";
import type { Database } from "./database.types";

const MAX_NOTIFICATIONS = 50;
const MAX_MARK_IDS = 200;

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

/**
 * جلب آخر إشعارات المستخدم (ترتيب زمني تنازلي — الأحدث أولاً)
 */
export async function getUserNotifications(userId: string): Promise<NotificationRow[]> {
  const supabase = createSupabase();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_NOTIFICATIONS);

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