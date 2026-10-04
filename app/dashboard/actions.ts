"use server";

import { revalidateTag } from "next/cache";
import { getServerSession } from "@/lib/db/server";
import { CACHE_TAGS, SEARCH_TAG } from "@/lib/db/cache";

/**
 * إبطال كاش الموقع العام بعد تعديل الفني لبياناته في لوحة التحكم.
 * يُستدعى من المتصفح بعد حفظ ناجح، ويتحقق أولاً أن المستخدم فعلاً فني مربوط.
 */
export async function revalidateProfileAfterSave(slug?: string): Promise<void> {
  const { user, supabase } = await getServerSession();
  if (!user) return;
  const { count } = await supabase
    .from("craftsmen")
    .select("id", { count: "exact", head: true })
    .eq("owner_user_id", user.id);

  if (count && count > 0) {
    revalidateTag(SEARCH_TAG, {});
    revalidateTag(CACHE_TAGS.allCraftsmen, {});
    revalidateTag(CACHE_TAGS.homeVerified, {});
    revalidateTag(CACHE_TAGS.homeStats, {});
    if (slug) {
      revalidateTag(CACHE_TAGS.craftsmanSlug(slug), {});
    }
  }
}