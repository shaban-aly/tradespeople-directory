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

export interface CraftsmanBrief {
  id: string;
  slug: string | null;
  name: string;
  categoryName: string;
  status: string;
  imageUrl: string | null;
  verified: boolean;
  isPublished: boolean;
}

/**
 * جلب جميع ملفات الصنايعي المملوكة للمستخدم
 */
export async function getMyCraftsmen(
  userId: string,
  client: SupabaseClient<Database> = createSupabase(),
): Promise<CraftsmanBrief[]> {
  const { data, error } = await client
    .from("craftsmen")
    .select("id, slug, name, status, image_url, verified, is_published, category:categories(name)")
    .eq("owner_user_id", userId)
    .order("added_at", { ascending: false });

  if (error || !data) return [];

  return data.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    status: c.status,
    imageUrl: c.image_url,
    verified: c.verified,
    isPublished: c.is_published,
    categoryName: (c.category as unknown as { name: string } | null)?.name ?? "",
  }));
}

/**
 * جلب بيانات الفني وإحصائياته المجمعة للوحة التحكم
 */
export async function getCraftsmanDashboardData(
  userId: string,
  craftsmanSlugOrId: string,
  client: SupabaseClient<Database> = createSupabase(),
): Promise<CraftsmanDashboardData | null> {
  // 1. تحديد الملف المطلوب والتحقق من الملكية
  let query = client.from("craftsmen").select("id").eq("owner_user_id", userId);
  
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(craftsmanSlugOrId)) {
    query = query.eq("id", craftsmanSlugOrId);
  } else {
    query = query.eq("slug", craftsmanSlugOrId);
  }

  const { data: matchedRows, error: matchError } = await query.limit(1);

  if (matchError || !matchedRows || matchedRows.length === 0) {
    return null;
  }

  const craftsmanId = matchedRows[0].id;

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
    getCraftsmanRatingSummary(craftsmanId),
    getCraftsmanReviews(craftsmanId, 30),
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
 * جلب سجل التفاعلات الحديثة لصنايعي محدد
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



