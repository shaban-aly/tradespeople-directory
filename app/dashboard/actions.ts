"use server";

import { revalidateTag } from "next/cache";
import { getServerSession } from "@/lib/db/server";
import { SEARCH_CACHE_REVALIDATE, SEARCH_TAG } from "@/lib/db/cache";

/**
 * إبطال كاش الموقع العام بعد تعديل الفني لبياناته في لوحة التحكم.
 * يُستدعى من المتصفح بعد حفظ ناجح، ويتحقق أولاً أن المستخدم فعلاً فني مربوط.
 */
export async function revalidateProfileAfterSave(): Promise<void> {
  const { user, supabase } = await getServerSession();
  if (!user) return;
  const { data: profile } = await supabase
    .from("profiles")
    .select("craftsman_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.craftsman_id) {
    revalidateTag(SEARCH_TAG, { expire: SEARCH_CACHE_REVALIDATE });
  }
}