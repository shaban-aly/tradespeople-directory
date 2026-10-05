import { createServerReadClient } from "./client";

/**
 * صور أصحاب التقييمات.
 *
 * `profiles.avatar_url` هو المصدر الوحيد لصور المستخدمين، وسياسة
 * `profiles read own` تجعل الـanon يرى صفّه فقط — فقراءة صور المراجعين
 * تحتاج مساراً عاماً مقيّداً: `get_public_reviewer_avatars` (migration 0033)
 * تُعيد `avatar_url` لمن نشر تقييماً فقط، بسقف 50 مُعرّفاً لكل نداء وبلا كشف
 * أي حقل آخر من `profiles`.
 *
 * لماذا بلا `unstable_cache` هنا؟
 * المستدعي هو من يُكاش: `getCraftsmanReviews` مغلّفة بـ`makeKeyedCache` بوسم
 * `reviews:craftsman:<id>`، فالصورة تعيش داخل نفس مدخل الكاش وتُبطَل معه
 * (نفس دورة حياة `reviews.user_name` المخزَّن أصلاً). كاش مستقل هنا كان
 * سيحتاج وسماً لا يُبطله أحد (لا `profiles` في `/api/webhooks/supabase`)
 * ومع `revalidate: false` تتجمّد الصورة بعد تغييرها فعلياً.
 */

/** أقصى عدد مُعرّفات في نداء واحد — يطابق سقف الدالة في القاعدة. */
const MAX_IDS_PER_CALL = 50;

/**
 * خريطة `userId → avatarUrl` لمن لديه صورة. المفاتيح الغائبة = بلا صورة
 * (تعرض الواجهة الحرف الأول).
 */
export async function getReviewerAvatars(
  userIds: string[],
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (unique.length === 0) return {};

  const client = createServerReadClient();
  const map: Record<string, string> = {};

  // تقسيم الدفعات: السقف في القاعدة 50، فلا نُرسل أطول منه أبداً.
  for (let i = 0; i < unique.length; i += MAX_IDS_PER_CALL) {
    const chunk = unique.slice(i, i + MAX_IDS_PER_CALL);
    const { data, error } = await client.rpc("get_public_reviewer_avatars", {
      p_user_ids: chunk,
    });
    // فشل دفعة لا يُسقط التقييمات نفسها: تبقى بلا صورة (الحرف الأول).
    if (error || !data) continue;
    for (const row of data) {
      if (row.avatar_url) map[row.user_id] = row.avatar_url;
    }
  }

  return map;
}
