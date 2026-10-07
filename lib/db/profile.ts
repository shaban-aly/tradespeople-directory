import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * قراءات صفحة «حسابي» (الملف الشخصي).
 *
 * بيانات مرتبطة بالمستخدم الحالي (جلسة الكوكيز + RLS)، لذلك لا تُغلّف
 * بـ unstable_cache — الكاش المشترك هنا يسرّب بيانات بين المستخدمين.
 * كل استعلام يرمي خطأً عند الفشل بدل إرجاع قيم صفرية تُقدَّم كنجاح.
 */

type Client = SupabaseClient<Database>;

export type ProfileRole = "client" | "craftsman" | "admin";

export type ProfileSummary = {
  role: ProfileRole;
  displayName: string | null;
  avatarUrl: string | null;
};

export type LinkedCraftsman = {
  slug: string;
  isPublished: boolean;
};

export type ProfileOverview = {
  /** صف profiles — null إذا لم يكن للحساب صف بعد (يُعامَل كـ client) */
  profile: ProfileSummary | null;
  favoritesCount: number;
  reviewsCount: number;
  /** الصفحة العامة المرتبطة بحساب الفني (نفس اختيار /dashboard/profile) */
  linkedCraftsman: LinkedCraftsman | null;
};

function asRole(value: string | null | undefined): ProfileRole {
  return value === "craftsman" || value === "admin" ? value : "client";
}

export async function getProfileOverview(
  supabase: Client,
  userId: string,
): Promise<ProfileOverview> {
  const [profileResult, favoritesResult, reviewsResult, craftsmanResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("role, display_name, avatar_url")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("favorites")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("craftsmen")
        .select("slug, is_published")
        .eq("owner_user_id", userId)
        .order("added_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (profileResult.error) {
    throw new Error(`getProfileOverview profile: ${profileResult.error.message}`);
  }
  if (favoritesResult.error) {
    throw new Error(`getProfileOverview favorites: ${favoritesResult.error.message}`);
  }
  if (reviewsResult.error) {
    throw new Error(`getProfileOverview reviews: ${reviewsResult.error.message}`);
  }
  if (craftsmanResult.error) {
    throw new Error(`getProfileOverview craftsman: ${craftsmanResult.error.message}`);
  }

  const profileRow = profileResult.data;
  const craftsmanRow = craftsmanResult.data;

  return {
    profile: profileRow
      ? {
          role: asRole(profileRow.role),
          displayName: profileRow.display_name ?? null,
          avatarUrl: profileRow.avatar_url ?? null,
        }
      : null,
    favoritesCount: favoritesResult.count ?? 0,
    reviewsCount: reviewsResult.count ?? 0,
    linkedCraftsman:
      craftsmanRow && craftsmanRow.slug
        ? {
            slug: craftsmanRow.slug,
            isPublished: craftsmanRow.is_published,
          }
        : null,
  };
}
