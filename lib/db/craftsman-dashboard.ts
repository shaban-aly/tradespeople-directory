import { createSupabase } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getCraftsmanFavoritesCount } from "./favorites";
import { getCraftsmanReviews, getCraftsmanRatingSummary } from "./reviews";
import { uploadCraftsmanImage, deleteImageByUrl } from "../storage/images";
import {
  cleanText,
  sanitizeAndNormalizePhone,
  validateName,
  validatePhone,
  validateDescription,
  validateSocialLinks,
} from "../utils/validation";
import type { AvatarPosition } from "../data/craftsmen";

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
  avatarPosition?: AvatarPosition | null;
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
  calls?: number;
  whatsapp?: number;
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

export interface CraftsmanActivityItem {
  id: number;
  contactMethod: "phone" | "whatsapp";
  userStatus: "authenticated" | "anonymous";
  userDisplayName?: string | null;
  createdAt: string;
}

export interface CraftsmanDashboardData {
  profile: CraftsmanSelfProfile;
  stats: CraftsmanDashboardStats;
  recentInteractions: CraftsmanActivityItem[];
}


export interface UpdateCraftsmanSelfInput {
  name?: string;
  phone: string;
  whatsapp?: string;
  description?: string;
  areaId?: string;
  image?: File | null;
  removeImage?: boolean;
  existingImageUrl?: string | null;
  avatarPosition?: AvatarPosition | null;
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
      avatar_position,
      verified,
      is_published,
      area_id,
      social_links,
      category:categories(name),
      area:areas(name)
    `)
    .eq("id", craftsmanId)
    .maybeSingle();

  if (craftsmanError || !craftsman) {
    return null;
  }

  const rawSocialLinks = (craftsman as Record<string, unknown>).social_links;
  const socialLinks: DashboardSocialLink[] = Array.isArray(rawSocialLinks)
    ? (rawSocialLinks as Array<{ platform?: string; url?: string }>).filter(
        (item): item is DashboardSocialLink =>
          item != null &&
          typeof item.platform === "string" &&
          typeof item.url === "string",
      )
    : [];

  // 3. جلب الإحصائيات والمفضلة والتقييمات وسجل التفاعلات الأخير بالتوازي
  const [
    { data: statsData },
    favoritesCount,
    ratingSummary,
    reviewsList,
    interactionsResult,
  ] = await Promise.all([
    client
      .from("craftsman_stats")
      .select("views, calls, whatsapp")
      .eq("craftsman_id", craftsmanId)
      .maybeSingle(),
    getCraftsmanFavoritesCount(craftsmanId, client),
    getCraftsmanRatingSummary(craftsmanId, client),
    getCraftsmanReviews(craftsmanId, 30, client),
    client.rpc("get_craftsman_activity_feed", { p_limit: 15 }),
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

  const recentInteractions: CraftsmanActivityItem[] = (
    interactionsResult?.data || []
  ).map((row) => ({
    id: row.log_id,
    contactMethod: row.contact_method as "phone" | "whatsapp",
    userStatus: row.user_status as "authenticated" | "anonymous",
    userDisplayName: row.user_display_name,
    createdAt: row.created_at,
  }));

  const categoryName = (craftsman.category as unknown as { name: string } | null)?.name ?? "";
  const areaName = (craftsman.area as unknown as { name: string } | null)?.name ?? "";

  return {
    profile: {
      id: craftsman.id,
      slug: craftsman.slug ?? "",
      name: craftsman.name,
      phone: craftsman.phone,
      whatsapp: craftsman.whatsapp,
      description: craftsman.description,
      imageUrl: craftsman.image_url,
      avatarPosition: craftsman.avatar_position ? {
        x: Number((craftsman.avatar_position as Record<string, unknown>).x) || 50,
        y: Number((craftsman.avatar_position as Record<string, unknown>).y) || 50,
        zoom: Number((craftsman.avatar_position as Record<string, unknown>).zoom) || 1,
      } : null,
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
      calls,
      whatsapp,
      favoritesCount,
      rating,
      reviews,
    },
    recentInteractions,
  };
}

/**
 * جلب سجل التفاعلات الحديثة لصانع محدد
 */
export async function getCraftsmanRecentInteractions(
  craftsmanId: string,
  client: SupabaseClient<Database> = createSupabase(),
  limit = 20,
): Promise<CraftsmanActivityItem[]> {
  const { data, error } = await client
    .from("interaction_logs")
    .select("id, contact_method, user_status, created_at")
    .eq("craftsman_id", craftsmanId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[craftsman-dashboard] getCraftsmanRecentInteractions error:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    contactMethod: row.contact_method as "phone" | "whatsapp",
    userStatus: row.user_status as "authenticated" | "anonymous",
    createdAt: row.created_at,
  }));
}


/**
 * تحديث موضع الصورة وبؤرتها للصانع
 */
export async function updateCraftsmanAvatarPosition(
  craftsmanId: string,
  position: AvatarPosition
): Promise<void> {
  const supabase = createSupabase();
  const { error } = await supabase
    .from("craftsmen")
    .update({
      avatar_position: {
        x: position.x,
        y: position.y,
        zoom: position.zoom ?? 1,
      },
    })
    .eq("id", craftsmanId);

  if (error) {
    throw new Error("حدث خطأ أثناء حفظ موضع الصورة: " + error.message);
  }
}

export interface SaveCraftsmanAvatarInput {
  craftsmanId: string;
  imageFile?: File | null;
  position: AvatarPosition;
  existingImageUrl?: string | null;
}

export interface SaveCraftsmanAvatarResult {
  imageUrl: string | null;
  avatarPosition: AvatarPosition;
  warning?: string;
}

/**
 * تدفق مستقل ومخصص لحفظ صورة الصانع وموضعها
 * يرفع الصورة الجديدة إن وُجدت، ويحدث قاعدة البيانات، ويحذف الصورة القديمة بأمان
 */
export async function saveCraftsmanAvatarStandalone({
  craftsmanId,
  imageFile,
  position,
  existingImageUrl,
}: SaveCraftsmanAvatarInput): Promise<SaveCraftsmanAvatarResult> {
  const supabase = createSupabase();

  let finalImageUrl = existingImageUrl ?? null;
  let newlyUploadedUrl: string | null = null;
  let warning: string | undefined;

  // 1. إذا وُجد ملف جديد: رفعه إلى التخزين
  if (imageFile) {
    const uploaded = await uploadCraftsmanImage(imageFile, "craftsmen");
    finalImageUrl = uploaded.url;
    newlyUploadedUrl = uploaded.url;
  }

  // 2. تحديث جدول craftsmen بالرابط وموضع وبؤرة الصورة
  const { error: updateError } = await supabase
    .from("craftsmen")
    .update({
      ...(imageFile ? { image_url: finalImageUrl } : {}),
      avatar_position: {
        x: position.x,
        y: position.y,
        zoom: position.zoom ?? 1,
      },
    })
    .eq("id", craftsmanId);

  if (updateError) {
    if (newlyUploadedUrl) {
      await deleteImageByUrl(newlyUploadedUrl);
    }
    throw new Error("حدث خطأ أثناء حفظ الصورة: " + updateError.message);
  }

  // 3. حذف الصورة القديمة فقط بعد نجاح التحديث في قاعدة البيانات
  if (newlyUploadedUrl && existingImageUrl && existingImageUrl !== newlyUploadedUrl) {
    const removed = await deleteImageByUrl(existingImageUrl);
    if (removed && !removed.ok) {
      warning = "الصورة القديمة لم تُحذف من التخزين بشكل نهائي.";
    }
  }

  return {
    imageUrl: finalImageUrl,
    avatarPosition: position,
    warning,
  };
}

/**
 * تحديث بيانات الفني الشخصية
 */
export async function updateCraftsmanSelfProfile(
  craftsmanId: string,
  payload: UpdateCraftsmanSelfInput
): Promise<{ warning?: string }> {
  const supabase = createSupabase();

  // التحقق من صحة المدخلات
  const nameError = payload.name !== undefined ? validateName(payload.name) : null;
  const phoneError = validatePhone(payload.phone);
  // الواتساب اختياري لكن إن وُجد يجب أن يكون رقم هاتف صالح
  const whatsappError = payload.whatsapp
    ? validatePhone(payload.whatsapp, false)
    : null;
  const descError = validateDescription(payload.description ?? "");
  const linksError = validateSocialLinks(payload.socialLinks);

  const errors = [nameError, phoneError, whatsappError, descError, linksError].filter(Boolean);
  if (errors.length > 0) {
    throw new Error(errors[0] as string);
  }

  // تنظيف الملفات القديمة أمر ثانوي — فشله لا يُسقط الحفظ بل يُبلَّغ كتحذير
  const warnings: string[] = [];

  // معالجة رفع الصورة إذا وجدت جديدة
  let imageUrl = payload.existingImageUrl ?? null;
  let newlyUploadedUrl: string | null = null;
  if (payload.image) {
    const uploaded = await uploadCraftsmanImage(payload.image, "craftsmen");
    imageUrl = uploaded.url;
    newlyUploadedUrl = uploaded.url;
  } else if (payload.removeImage) {
    // حذف مؤجل اتحجز من الفورم واتأكد عليه
    imageUrl = null;
  }

  const socialLinksJson = Array.isArray(payload.socialLinks)
    ? payload.socialLinks.map((link) => ({
        platform: link.platform,
        url: link.url,
      }))
    : [];

  // تحديث جدول craftsmen أولاً
  const { error: updateError } = await supabase
    .from("craftsmen")
    .update({
      ...(payload.name ? { name: cleanText(payload.name) } : {}),
      phone: sanitizeAndNormalizePhone(payload.phone),
      whatsapp: payload.whatsapp ? sanitizeAndNormalizePhone(payload.whatsapp) : null,
      description: payload.description ? cleanText(payload.description) : null,
      area_id: payload.areaId || undefined,
      image_url: imageUrl,
      ...(payload.avatarPosition !== undefined ? { avatar_position: payload.avatarPosition } : {}),
      social_links: socialLinksJson,
    })
    .eq("id", craftsmanId);

  if (updateError) {
    // إذا فشل التحديث: حذف الصورة الجديدة المرفوعة فوراً لمنع الملفات اليتيمة
    if (newlyUploadedUrl) {
      await deleteImageByUrl(newlyUploadedUrl);
    }
    throw new Error("حدث خطأ أثناء حفظ البيانات: " + updateError.message);
  }

  // حذف الصورة القديمة فقط بعد نجاح التحديث في قاعدة البيانات
  if (newlyUploadedUrl && payload.existingImageUrl && payload.existingImageUrl !== newlyUploadedUrl) {
    const removed = await deleteImageByUrl(payload.existingImageUrl);
    if (removed && !removed.ok) {
      warnings.push("الصورة القديمة مكانتش اتشالت من التخزين.");
    }
  } else if (payload.removeImage && payload.existingImageUrl) {
    const removed = await deleteImageByUrl(payload.existingImageUrl);
    if (removed && !removed.ok) {
      warnings.push("الصورة مكانتش اتشالت من التخزين بشكل نهائي.");
    }
  }

  return warnings.length > 0 ? { warning: warnings.join(" ") } : {};
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

