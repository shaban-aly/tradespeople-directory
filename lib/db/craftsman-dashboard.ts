import { createSupabase } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getCraftsmanFavoritesCount } from "./favorites";
import { getCraftsmanReviews, getCraftsmanRatingSummary } from "./reviews";
import { uploadCraftsmanImage, deleteImageByUrl } from "../storage/images";
import {
  validatePhone,
  validateDescription,
  validateSocialLinks,
} from "../utils/validation";

export interface DashboardSocialLink {
  platform: "facebook" | "instagram" | "tiktok" | "other";
  url: string;
}

export interface CraftsmanSelfProfile {
  id: string;
  slug: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  description: string | null;
  imageUrl: string | null;
  verified: boolean;
  isPublished: boolean;
  categoryName: string;
  areaId: string | null;
  areaName: string | null;
  socialLinks: DashboardSocialLink[];
}

export interface CraftsmanDashboardStats {
  views: number;
  totalContacts: number; // مجموع الاتصال والواتساب (المتواصلين)
  favoritesCount: number; // عدد من وضعه في المفضلة
  rating: {
    average: number;
    totalReviews: number;
  };
  reviews: Array<{
    id: string;
    author: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

export interface CraftsmanDashboardData {
  profile: CraftsmanSelfProfile;
  stats: CraftsmanDashboardStats;
}

export interface UpdateCraftsmanSelfInput {
  phone: string;
  whatsapp?: string;
  description?: string;
  areaId?: string;
  image?: File | null;
  removeImage?: boolean;
  existingImageUrl?: string | null;
  socialLinks: DashboardSocialLink[];
}

/**
 * جلب بيانات الفني وإحصائياته المجمعة للوحة التحكم
 */
export async function getCraftsmanDashboardData(
  userId: string,
  client: SupabaseClient<Database> = createSupabase(),
): Promise<CraftsmanDashboardData | null> {
  // 1. جلب craftsman_id من جدول profiles
  const { data: profileRow, error: profileError } = await client
    .from("profiles")
    .select("craftsman_id, role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profileRow?.craftsman_id) {
    return null;
  }

  const craftsmanId = profileRow.craftsman_id;

  // 2. جلب بيانات الصنايعي مع التخصص والمنطقة وروابط السوشيال
  const { data: craftsman, error: craftsmanError } = await client
    .from("craftsmen")
    .select(`
      id,
      slug,
      name,
      phone,
      whatsapp,
      description,
      image_url,
      verified,
      is_published,
      area_id,
      category:categories(name),
      area:areas(name)
    `)
    .eq("id", craftsmanId)
    .maybeSingle();

  if (craftsmanError || !craftsman) {
    return null;
  }

  // 3. جلب روابط السوشيال
  const { data: linksData } = await client
    .from("social_links")
    .select("platform, url")
    .eq("craftsman_id", craftsmanId);

  const socialLinks: DashboardSocialLink[] = (linksData ?? []).map((l) => ({
    platform: l.platform as DashboardSocialLink["platform"],
    url: l.url,
  }));

  // 4. جلب الإحصائيات والمفضلة والتقييمات بالتوازي
  const [
    { data: statsData },
    favoritesCount,
    ratingSummary,
    reviewsList,
  ] = await Promise.all([
    client
      .from("craftsman_stats")
      .select("views, calls, whatsapp")
      .eq("craftsman_id", craftsmanId)
      .maybeSingle(),
    getCraftsmanFavoritesCount(craftsmanId, client),
    getCraftsmanRatingSummary(craftsmanId, client),
    getCraftsmanReviews(craftsmanId, 30, client),
  ]);

  const views = statsData?.views ?? 0;
  const calls = statsData?.calls ?? 0;
  const whatsapp = statsData?.whatsapp ?? 0;

  // إجمالي المتواصلين (مكالمات + واتساب)
  const totalContacts = calls + whatsapp;

  // قسم التقييمات الفعلي
  const rating = {
    average: ratingSummary.average,
    totalReviews: ratingSummary.totalReviews,
  };

  const reviews = reviewsList.map((r) => ({
    id: r.id,
    author: r.userName,
    rating: r.rating,
    comment: r.comment ?? "",
    date: r.createdAt,
  }));

  const categoryName = (craftsman.category as unknown as { name: string } | null)?.name ?? "";
  const areaName = (craftsman.area as unknown as { name: string } | null)?.name ?? "";

  return {
    profile: {
      id: craftsman.id,
      slug: craftsman.slug,
      name: craftsman.name,
      phone: craftsman.phone,
      whatsapp: craftsman.whatsapp,
      description: craftsman.description,
      imageUrl: craftsman.image_url,
      verified: craftsman.verified,
      isPublished: craftsman.is_published,
      categoryName,
      areaId: craftsman.area_id,
      areaName,
      socialLinks,
    },
    stats: {
      views,
      totalContacts,
      favoritesCount,
      rating,
      reviews,
    },
  };
}

/**
 * تحديث بيانات الفني الشخصية
 */
export async function updateCraftsmanSelfProfile(
  craftsmanId: string,
  payload: UpdateCraftsmanSelfInput
): Promise<void> {
  const supabase = createSupabase();

  // التحقق من صحة المدخلات
  const phoneError = validatePhone(payload.phone);
  // الواتساب اختياري لكن إن وُجد يجب أن يكون رقم هاتف صالح
  const whatsappError = payload.whatsapp
    ? validatePhone(payload.whatsapp, false)
    : null;
  const descError = validateDescription(payload.description ?? "");
  const linksError = validateSocialLinks(payload.socialLinks);

  const errors = [phoneError, whatsappError, descError, linksError].filter(Boolean);
  if (errors.length > 0) {
    throw new Error(errors[0] as string);
  }

  // معالجة رفع الصورة إذا وجدت جديدة
  let imageUrl = payload.existingImageUrl ?? null;
  if (payload.image) {
    const uploaded = await uploadCraftsmanImage(payload.image, "craftsmen");
    imageUrl = uploaded.url;

    // حذف الصورة القديمة إذا تغيرت
    if (payload.existingImageUrl && payload.existingImageUrl !== uploaded.url) {
      await deleteImageByUrl(payload.existingImageUrl);
    }
  } else if (payload.removeImage) {
    // حذف مؤجل اتحجز من الفورم واتأكد عليه — بينفذ فعلياً هنا
    imageUrl = null;
    if (payload.existingImageUrl) {
      await deleteImageByUrl(payload.existingImageUrl);
    }
  }

  // تحديث جدول craftsmen
  const { error: updateError } = await supabase
    .from("craftsmen")
    .update({
      phone: payload.phone.trim(),
      whatsapp: payload.whatsapp ? payload.whatsapp.trim() : null,
      description: payload.description ? payload.description.trim() : null,
      area_id: payload.areaId || undefined,
      image_url: imageUrl,
    })
    .eq("id", craftsmanId);

  if (updateError) {
    throw new Error("حدث خطأ أثناء حفظ البيانات: " + updateError.message);
  }

  // تحديث روابط السوشيال
  const { error: deleteLinksError } = await supabase
    .from("social_links")
    .delete()
    .eq("craftsman_id", craftsmanId);

  if (!deleteLinksError && payload.socialLinks.length > 0) {
    await supabase.from("social_links").insert(
      payload.socialLinks.map((l) => ({
        craftsman_id: craftsmanId,
        platform: l.platform as "facebook" | "instagram" | "tiktok" | "other",
        url: l.url.trim(),
      }))
    );
  }
}

/**
 * جلب قائمة المناطق المتاحة لاختيارها في البروفايل
 */
export async function getAreasList(
  client: SupabaseClient<Database> = createSupabase(),
): Promise<Array<{ id: string; name: string }>> {
  const { data } = await client
    .from("areas")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

