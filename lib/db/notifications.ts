import { createSupabase } from "./client";
import type { Database } from "./database.types";

const MAX_NOTIFICATIONS = 50;
const MAX_PAGE_NOTIFICATIONS = 200;
const MAX_MARK_IDS = 200;

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

/**
 * نتيجة صريحة: نفصل «لا توجد بيانات» عن «فشل الاستعلام».
 * أي `error` غير فارغ = الطلب لم ينجح، ويجب على الواجهة عرض رسالة خطأ +
 * زر إعادة محاولة بدل إظهار حالة فارغة مضلّلة.
 */
export interface QueryResult<T> {
  data: T;
  error: string | null;
}

/**
 * جلب آخر إشعارات المستخدم (ترتيب زمني تنازلي — الأحدث أولاً).
 * الـ default يعود للجرس (50)؛ الصفحة الكاملة تطلب حداً أعلى (حتى 200).
 */
export async function getUserNotifications(
  userId: string,
  limit?: number,
): Promise<QueryResult<NotificationRow[]>> {
  const effective = Math.max(1, Math.min(limit ?? MAX_NOTIFICATIONS, MAX_PAGE_NOTIFICATIONS));
  const supabase = createSupabase();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(effective);

  if (error) {
    return { data: [], error: error.message || "تعذّر جلب الإشعارات" };
  }
  if (!data) {
    return { data: [], error: "تعذّر جلب الإشعارات" };
  }
  return { data: data as NotificationRow[], error: null };
}

/**
 * عدّاد الإشعارات غير المقروءة.
 * الفشل يُرجع `error` ولا يُصفّر العدّاد — التصفير عند الفشل يوحي للمستخدم
 * بأنه لا توجد إشعارات بينما هي موجودة ولم نتمكن من قراءتها.
 */
export async function getUnreadNotificationsCount(
  userId: string,
): Promise<QueryResult<number>> {
  const supabase = createSupabase();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact" })
    .eq("recipient_id", userId)
    .is("read_at", null)
    .limit(0);

  if (error) {
    return { data: 0, error: error.message || "تعذّر جلب عدّاد الإشعارات" };
  }
  if (typeof count !== "number") {
    return { data: 0, error: "تعذّر جلب عدّاد الإشعارات" };
  }
  return { data: count, error: null };
}

/**
 * تحديد إشعارات كمقروءة عبر RPC (تحقق ملكية + read_at IS NULL داخل الدالة).
 * يُستخدم لقراءة عنصر واحد أو مجموعة محددة معروفة مسبقاً (حتى 200 معرف).
 * يُعيد عدد الصفوف الفعلية المحدَّثة — قيمة موثوقة تُستخدم بعد نجاح RPC.
 */
export async function markNotificationsRead(ids: string[]): Promise<QueryResult<number>> {
  if (ids.length === 0) {
    return { data: 0, error: null };
  }
  const supabase = createSupabase();
  const { data, error } = await supabase.rpc("mark_notifications_read", {
    p_ids: ids.slice(0, MAX_MARK_IDS),
  });

  if (error) {
    return { data: 0, error: error.message || "تعذّر تعليم الإشعارات كمقروءة" };
  }
  if (typeof data !== "number") {
    return { data: 0, error: "استجابة غير متوقعة من القاعدة" };
  }
  return { data, error: null };
}

/**
 * تعليم كل إشعارات المستخدم كمقروءة — عملية واحدة داخل القاعدة.
 *
 * لا نرسل قائمة معرّفات من الواجهة (كانت تُقصّ عند 200 فتترك الباقي غير مقروء
 * بصمت)، بل RPC بلا مدخلات تعتمد على `auth.uid()` داخل القاعدة.
 */
export async function markAllNotificationsRead(): Promise<QueryResult<number>> {
  const supabase = createSupabase();
  const { data, error } = await supabase.rpc("mark_all_notifications_read");

  if (error) {
    return { data: 0, error: error.message || "تعذّر تعليم كل الإشعارات كمقروءة" };
  }
  if (typeof data !== "number") {
    return { data: 0, error: "استجابة غير متوقعة من القاعدة" };
  }
  return { data, error: null };
}
