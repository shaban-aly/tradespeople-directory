import { createSupabase } from "@/lib/db/client";

export const MIN_TOKEN_LENGTH = 10;
export const MAX_TOKEN_LENGTH = 4096;

function isValidToken(token: string): boolean {
  return token.length >= MIN_TOKEN_LENGTH && token.length <= MAX_TOKEN_LENGTH;
}

/** تسجيل FCM token للمستخدم الحالي عبر RPC آمن (الملكية تُثبَّت سيرفراً) */
export async function registerPushToken(token: string): Promise<boolean> {
  if (!isValidToken(token)) return false;
  const supabase = createSupabase();
  const { error } = await supabase.rpc("register_push_token", {
    p_token: token,
    p_platform: "web",
  });
  return !error;
}

/** إلغاء تسجيل توكن (المستخدم الحالي فقط) — يستدعى مع الحذف من الجهاز */
export async function unregisterPushToken(token: string): Promise<boolean> {
  if (!isValidToken(token)) return false;
  const supabase = createSupabase();
  const { error } = await supabase.rpc("unregister_push_token", {
    p_token: token,
  });
  return !error;
}

/** تسجيل توكن الزائر المجهول واهتماماته عبر RPC آمن */
export async function registerAnonymousPush(
  token: string,
  interests: string[] = [],
): Promise<boolean> {
  if (!isValidToken(token)) return false;
  const supabase = createSupabase();
  const { error } = await supabase.rpc("register_anonymous_push", {
    p_token: token,
    p_interests: interests,
    p_platform: "web",
  });
  return !error;
}

/** إلغاء اشتراك توكن مجهول */
export async function unregisterAnonymousPush(token: string): Promise<boolean> {
  if (!isValidToken(token)) return false;
  const supabase = createSupabase();
  const { error } = await supabase.rpc("unregister_anonymous_push", {
    p_token: token,
  });
  return !error;
}

/** تحديث اهتمامات توكن مجهول */
export async function updateAnonymousInterests(
  token: string,
  interests: string[],
): Promise<boolean> {
  if (!isValidToken(token)) return false;
  const supabase = createSupabase();
  const { error } = await supabase.rpc("update_anonymous_interests", {
    p_token: token,
    p_interests: interests,
  });
  return !error;
}

/** متابعة تصنيف للمستخدم المسجل */
export async function subscribeUserInterest(categorySlug: string): Promise<boolean> {
  if (!categorySlug) return false;
  const supabase = createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from("user_interest_subscriptions").upsert(
    {
      user_id: user.id,
      category_slug: categorySlug,
    },
    { onConflict: "user_id,category_slug" },
  );
  return !error;
}

/** إلغاء متابعة تصنيف للمستخدم المسجل */
export async function unsubscribeUserInterest(categorySlug: string): Promise<boolean> {
  if (!categorySlug) return false;
  const supabase = createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("user_interest_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("category_slug", categorySlug);
  return !error;
}