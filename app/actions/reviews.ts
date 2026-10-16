"use server";


import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/db/cache";
import { hasDangerousContent } from "@/lib/utils/validation";

export async function upsertReviewAction(params: {
  userId: string;
  craftsmanId: string;
  rating: number;
  comment?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { userId, craftsmanId, rating, comment } = params;

  if (!rating || rating < 1 || rating > 5) {
    return { success: false, error: "التقييم يجب أن يكون بين 1 و 5" };
  }

  const cleanedComment = comment?.trim() ?? "";
  if (rating <= 3 && cleanedComment.length < 10) {
    return { success: false, error: "يرجى كتابة تعليق لا يقل عن 10 أحرف لوصف تجربتك" };
  }

  if (hasDangerousContent(cleanedComment)) {
    return { success: false, error: "التعليق يحتوي على محتوى غير مسموح به" };
  }

  if (cleanedComment.length > 500) {
    return { success: false, error: "التعليق يجب ألا يتجاوز 500 حرف" };
  }

  // ── الأمان: استخرج هوية المستخدم من الجلسة على السيرفر فقط ──────────────
  // لا تثق بـ userId القادم من العميل — يُستخدم فقط للتحقق الأولي
  const { supabase, user } = await getServerSessionOrSupabase();

  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول أولاً" };
  }

  // منع تزوير الهوية: userId المُمرَّر يجب أن يطابق جلسة السيرفر
  if (user.id !== userId) {
    return { success: false, error: "طلب غير صالح" };
  }

  // الـ authenticatedUserId الموثوق من الجلسة يُستخدم في كل الاستعلامات التالية
  const authenticatedUserId = user.id;

  // فحص منع التقييم الذاتي
  const { count } = await supabase
    .from("craftsmen")
    .select("id", { count: "exact", head: true })
    .eq("owner_user_id", authenticatedUserId)
    .eq("id", craftsmanId);

  if (count && count > 0) {
    return { success: false, error: "لا يمكنك تقييم صفحتك الشخصية كفني" };
  }

  const { error } = await supabase.from("reviews").upsert(
    {
      user_id: authenticatedUserId,
      craftsman_id: craftsmanId,
      rating,
      comment: cleanedComment || null,
    },
    { onConflict: "user_id,craftsman_id" }
  );

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "لقد قيّمت هذا الصنايعي من قبل — التقييم الواحد لكل عميل وصانيعي" };
    }
    return { success: false, error: error.message || "فشل حفظ التقييم" };
  }

  revalidateTag(CACHE_TAGS.craftsmanReviews(craftsmanId), {});
  return { success: true };
}

export async function deleteReviewAction(
  userId: string,
  reviewId: string,
  craftsmanId?: string
): Promise<boolean> {
  const { supabase, user } = await getServerSessionOrSupabase();

  // الجلسة مطلوبة — لا تنفيذ بدون مستخدم مسجّل
  if (!user) return false;

  // منع تزوير الهوية: userId المُمرَّر يجب أن يطابق جلسة السيرفر
  if (user.id !== userId) return false;

  // الـ authenticatedUserId الموثوق من الجلسة يُستخدم في كل الاستعلامات
  const authenticatedUserId = user.id;

  let query = supabase.from("reviews").delete().eq("user_id", authenticatedUserId);

  if (craftsmanId) {
    query = query.eq("craftsman_id", craftsmanId);
  } else {
    query = query.eq("id", reviewId);
  }

  const { error } = await query;

  if (!error && craftsmanId) {
    revalidateTag(CACHE_TAGS.craftsmanReviews(craftsmanId), {});
  }

  return !error;
}

async function getServerSessionOrSupabase() {
  // Using direct import to avoid circular dependencies
  const { getServerSession } = await import("@/lib/db/server");
  return getServerSession();
}
