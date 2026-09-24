import {
  deleteImageByUrl,
  moveImageToCraftsman,
  uploadCraftsmanImage,
} from "../storage/images";
import {
  anyError,
  cleanText,
  firstError,
  sanitizeAndNormalizePhone,
  validateCategoryFields,
  validateCraftsmanFields,
  validateEmail,
  validateName,
  validateSocialLinks,
} from "../utils/validation";
import { createSupabase } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { Json } from "./database.types";
import type {
  CategoryChartItem,
  MostContactedItem,
  OverviewMetrics,
} from "./admin-selectors";

export const CATEGORY_ICON_OPTIONS = [
  "plumbing",
  "electrical",
  "carpentry",
  "hvac",
  "painting",
  "tiling",
  "aluminum",
  "metalwork",
  "masonry",
  "marble",
  "glass",
  "welding",
  "locksmith",
  "mechanic",
  "appliances",
  "upholstery",
  "cleaning",
  "pest",
  "moving",
  "elevator",
  "satellite",
  "security",
  "roofing",
  "garden",
  "parquet",
  "kitchen",
  "bathroom",
  "handyman",
] as const;

export type CategoryIcon = (typeof CATEGORY_ICON_OPTIONS)[number];

type CategoryJoin = {
  slug: string;
  name: string;
};

type AreaJoin = {
  name: string;
};

export type SocialLinkRow = {
  platform: "facebook" | "instagram" | "tiktok" | "other";
  url: string;
};

export type JoinRequestRow = {
  id: string;
  slug: string | null;
  name: string | null;
  category_id: string | null;
  area_id: string | null;
  phone: string | null;
  whatsapp: string | null;
  description: string | null;
  image_url: string | null;
  status: "pending" | "approved" | "rejected";
  submitted_by: string | null;
  created_at: string;
  category: CategoryJoin | null;
  area: AreaJoin | null;
  socialLinks?: SocialLinkRow[];
};

export type ReportRow = {
  id: string;
  craftsman_name: string;
  phone: string | null;
  message: string;
  status: "pending" | "reviewed" | "dismissed";
  reporter_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  singular_name: string;
  plural_name: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
};

export type AreaRow = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type CraftsmanStats = {
  views: number;
  calls: number;
  whatsapp: number;
};

export type CraftsmanRow = {
  id: string;
  slug: string;
  name: string;
  category_id: string;
  area_id: string;
  phone: string;
  whatsapp: string | null;
  description: string | null;
  image_url: string | null;
  verified: boolean;
  is_published: boolean;
  added_at: string;
  created_at: string;
  category: CategoryJoin | null;
  area: AreaJoin | null;
  stats: CraftsmanStats | null;
  socialLinks?: SocialLinkRow[];
};

export type ContactMessageRow = {
  id: string;
  name: string;
  phone: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type CraftsmanInput = {
  slug: string;
  name: string;
  category_id: string;
  area_id: string;
  phone: string;
  whatsapp: string | null;
  description: string | null;
  verified: boolean;
  is_published: boolean;
  image?: File | null;
  existingImageUrl?: string | null;
  socialLinks?: SocialLinkRow[];
};

export type CountRow = {
  category: { slug: string } | null;
  area: { name: string } | null;
};

type RequestSelectRow = {
  id: string;
  slug: string | null;
  name: string | null;
  category_id: string | null;
  area_id: string | null;
  phone: string | null;
  whatsapp: string | null;
  description: string | null;
  image_url: string | null;
  status: string;
  submitted_by: string | null;
  created_at: string;
  category: CategoryJoin | null;
  area: AreaJoin | null;
  social_links: Json;
};

type CraftsmanSelectRow = Omit<CraftsmanRow, "slug" | "socialLinks"> & {
  slug: string | null;
  social_links: Json;
};

const REQUESTS_SELECT =
  "id, slug, name, category_id, area_id, phone, whatsapp, description, image_url, status, submitted_by, created_at, category:categories(slug, name), area:areas(name), social_links";

const CRAFTSMEN_ADMIN_SELECT =
  "id, slug, name, category_id, area_id, phone, whatsapp, description, image_url, verified, is_published, added_at, created_at, category:categories(slug, name), area:areas(name), stats:craftsman_stats(views, calls, whatsapp), social_links";

const COUNTS_SELECT = "id, category:categories(slug), area:areas(name)";

function mapSocialLinks(raw: unknown): SocialLinkRow[] {
  if (!Array.isArray(raw)) return [];
  const links: SocialLinkRow[] = [];
  for (const item of raw) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof (item as { platform?: unknown }).platform === "string" &&
      typeof (item as { url?: unknown }).url === "string"
    ) {
      const platform = (item as { platform: string }).platform;
      const url = (item as { url: string }).url;
      if (
        platform === "facebook" ||
        platform === "instagram" ||
        platform === "tiktok" ||
        platform === "other"
      ) {
        links.push({ platform, url });
      }
    }
  }
  return links;
}

function mapRequestRow(row: RequestSelectRow): JoinRequestRow {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category_id: row.category_id,
    area_id: row.area_id,
    phone: row.phone,
    whatsapp: row.whatsapp,
    description: row.description,
    image_url: row.image_url,
    status: row.status as JoinRequestRow["status"],
    submitted_by: row.submitted_by,
    created_at: row.created_at,
    category: row.category,
    area: row.area,
    socialLinks: mapSocialLinks(row.social_links),
  };
}

function mapCraftsmanSocialLinks(row: CraftsmanSelectRow): CraftsmanRow {
  return {
    ...row,
    slug: row.slug ?? "",
    socialLinks: mapSocialLinks(row.social_links),
  };
}

function assertNoError(error: unknown, message: string): void {
  if (error) throw new Error(message);
}

export async function revalidateSearchCache(): Promise<void> {
  try {
    await fetch("/api/revalidate?tag=search", { method: "POST" });
  } catch {
    // فشل إبطال الكاش لا يمنع استكمال العملية
  }
}

// ------------------------------ جلب البيانات ------------------------------

export async function fetchRequests(
  client: SupabaseClient<Database> = createSupabase(),
): Promise<JoinRequestRow[]> {
  const { data, error } = await client
    .from("craftsmen")
    .select(REQUESTS_SELECT)
    .or("status.eq.pending,status.eq.rejected")
    .order("created_at", { ascending: false });
  if (error) throw new Error("مقدرناش نحمّل بيانات لوحة التحكم");
  return (data ?? []).map(mapRequestRow);
}

export async function fetchCategories(
  client: SupabaseClient<Database> = createSupabase(),
): Promise<CategoryRow[]> {
  const { data, error } = await client
    .from("categories")
    .select("id, slug, name, singular_name, plural_name, icon, sort_order, is_active")
    .order("sort_order");
  if (error) throw new Error("مقدرناش نحمّل بيانات لوحة التحكم");
  return data ?? [];
}

export async function fetchAreas(
  client: SupabaseClient<Database> = createSupabase(),
): Promise<AreaRow[]> {
  const { data, error } = await client
    .from("areas")
    .select("id, name, sort_order, is_active")
    .order("sort_order");
  if (error) throw new Error("مقدرناش نحمّل بيانات لوحة التحكم");
  return data ?? [];
}

export async function fetchCraftsmen(
  client: SupabaseClient<Database> = createSupabase(),
): Promise<CraftsmanRow[]> {
  const { data, error } = await client
    .from("craftsmen")
    .select(CRAFTSMEN_ADMIN_SELECT)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw new Error("مقدرناش نحمّل بيانات لوحة التحكم");
  return (data ?? []).map(mapCraftsmanSocialLinks);
}

export type CraftsmanFilterOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  published?: "all" | "published" | "hidden";
  verified?: "all" | "verified" | "unverified";
};

export type PaginatedCraftsmenResult = {
  craftsmen: CraftsmanRow[];
  totalCount: number;
  page: number;
  pageCount: number;
};

/** جلب الصنايعية خادمياً مع التقسيم لصفحات والفلترة في SQL بدلاً من تحميل كل الصفوف */
export async function fetchPaginatedCraftsmen(
  client: SupabaseClient<Database> = createSupabase(),
  options: CraftsmanFilterOptions = {},
  categoriesList?: CategoryRow[],
): Promise<PaginatedCraftsmenResult> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = options.pageSize ?? 8;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = client
    .from("craftsmen")
    .select(CRAFTSMEN_ADMIN_SELECT, { count: "exact" })
    .eq("status", "approved");

  if (options.search?.trim()) {
    const q = options.search.trim();
    query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  if (options.category && options.category !== "all") {
    let catId: string | undefined;
    if (categoriesList && categoriesList.length > 0) {
      catId = categoriesList.find((c) => c.slug === options.category)?.id;
    }
    if (!catId) {
      const { data: catData } = await client
        .from("categories")
        .select("id")
        .eq("slug", options.category)
        .maybeSingle();
      catId = catData?.id;
    }
    if (catId) {
      query = query.eq("category_id", catId);
    }
  }

  if (options.published === "published") {
    query = query.eq("is_published", true);
  } else if (options.published === "hidden") {
    query = query.eq("is_published", false);
  }

  if (options.verified === "verified") {
    query = query.eq("verified", true);
  } else if (options.verified === "unverified") {
    query = query.eq("verified", false);
  }

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw new Error("مقدرناش نحمّل قائمة الصنايعية");

  const totalCount = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    craftsmen: (data ?? []).map(mapCraftsmanSocialLinks),
    totalCount,
    page: Math.min(page, pageCount),
    pageCount,
  };
}

export async function fetchMessages(
  client: SupabaseClient<Database> = createSupabase(),
): Promise<ContactMessageRow[]> {
  const { data, error } = await client
    .from("contact_messages")
    .select("id, name, phone, message, is_read, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error("مقدرناش نحمّل بيانات لوحة التحكم");
  return data ?? [];
}

export async function fetchCounts(
  client: SupabaseClient<Database> = createSupabase(),
): Promise<CountRow[]> {
  const { data, error } = await client
    .from("craftsmen")
    .select(COUNTS_SELECT);
  if (error) throw new Error("مقدرناش نحمّل بيانات لوحة التحكم");
  return data ?? [];
}

export type AdminNavCounts = {
  pendingRequests: number;
  pendingReports: number;
  unreadMessages: number;
};

/** عدّادات خفيفة لشريط التنقل الجانبي عبر RPC مجمعة مع fallback للاستعلامات المنفصلة */
export async function fetchAdminNavCounts(
  client: SupabaseClient<Database> = createSupabase(),
): Promise<AdminNavCounts> {
  try {
    const { data, error } = await client.rpc("get_admin_nav_counts");
    if (!error && data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      return {
        pendingRequests: Number(d.pendingRequests) || 0,
        pendingReports: Number(d.pendingReports) || 0,
        unreadMessages: Number(d.unreadMessages) || 0,
      };
    }
  } catch {
    // التراجع التلقائي للاستعلامات المنفصلة
  }

  const [requests, reports, messages] = await Promise.all([
    client.from("craftsmen").select("id", { count: "exact", head: true }).eq("status", "pending"),
    client.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
    client.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
  ]);
  for (const result of [requests, reports, messages]) {
    if (result.error) throw new Error("مقدرناش نحمّل عدّادات القائمة");
  }
  return {
    pendingRequests: requests.count ?? 0,
    pendingReports: reports.count ?? 0,
    unreadMessages: messages.count ?? 0,
  };
}

export type AdminBreakdownCounts = {
  byCategory: Record<string, number>;
  byArea: Record<string, number>;
};

/** أعداد الصنايعية المجمعة لكل تصنيف ومنطقة مباشرة من SQL دون تحميل الصفوف */
export async function fetchAdminBreakdownCounts(
  client: SupabaseClient<Database> = createSupabase(),
): Promise<AdminBreakdownCounts> {
  try {
    const { data, error } = await client.rpc("get_admin_breakdown_counts");
    if (!error && data && typeof data === "object") {
      const d = data as { byCategory?: Record<string, number>; byArea?: Record<string, number> };
      return {
        byCategory: d.byCategory ?? {},
        byArea: d.byArea ?? {},
      };
    }
  } catch {
    // التراجع للوضع اليدوي عند تعذر RPC
  }

  // Fallback يدوي: جلب الصفوف وتجميعها
  const counts = await fetchCounts(client);
  const byCategory: Record<string, number> = {};
  const byArea: Record<string, number> = {};
  for (const row of counts) {
    const cat = row.category?.slug ?? "unknown";
    byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    const area = row.area?.name ?? "unknown";
    byArea[area] = (byArea[area] ?? 0) + 1;
  }
  return { byCategory, byArea };
}

// ------------------------------ عمليات التصنيفات ------------------------------

export async function createCategory(
  payload: { slug: string; name: string; icon: CategoryIcon },
  categories: CategoryRow[],
): Promise<void> {
  const errors = validateCategoryFields({
    name: payload.name,
    slug: payload.slug,
  });
  if (anyError(errors)) {
    throw new Error(firstError(errors) ?? "بيانات التخصص غير صحيحة");
  }
  const sortOrder = (categories.at(-1)?.sort_order ?? 0) + 1;
  const { error } = await createSupabase().from("categories").insert({
    slug: payload.slug,
    name: payload.name,
    singular_name: payload.name,
    plural_name: payload.name,
    icon: payload.icon,
    sort_order: sortOrder,
  });
  assertNoError(error, "مقدرناش نضيف التخصص");
}

export async function updateCategory(
  id: string,
  payload: { slug: string; name: string; icon: CategoryIcon },
): Promise<void> {
  const errors = validateCategoryFields({
    name: payload.name,
    slug: payload.slug,
  });
  if (anyError(errors)) {
    throw new Error(firstError(errors) ?? "بيانات التخصص غير صحيحة");
  }
  const { error } = await createSupabase()
    .from("categories")
    .update({
      slug: payload.slug,
      name: payload.name,
      icon: payload.icon,
    })
    .eq("id", id);
  assertNoError(error, "مقدرناش نحدّث التخصص");
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await createSupabase().from("categories").delete().eq("id", id);
  assertNoError(error, "مقدرناش نحذف التخصص — ممكن عليه صنايعية");
}

export async function toggleCategoryActive(category: CategoryRow): Promise<void> {
  const { error } = await createSupabase()
    .from("categories")
    .update({ is_active: !category.is_active })
    .eq("id", category.id);
  assertNoError(error, "مقدرناش نحدّث حالة التخصص");
}

// ------------------------------ عمليات المناطق ------------------------------

export async function createArea(name: string, areas: AreaRow[]): Promise<void> {
  const errorMessage = validateName(name);
  if (errorMessage) throw new Error(errorMessage);
  const sortOrder = (areas.at(-1)?.sort_order ?? 0) + 1;
  const { error } = await createSupabase().from("areas").insert({
    name,
    sort_order: sortOrder,
  });
  assertNoError(error, "مقدرناش نضيف المنطقة");
}

export async function updateArea(id: string, name: string): Promise<void> {
  const errorMessage = validateName(name);
  if (errorMessage) throw new Error(errorMessage);
  const { error } = await createSupabase().from("areas").update({ name }).eq("id", id);
  assertNoError(error, "مقدرناش نحدّث المنطقة");
}

export async function deleteArea(id: string): Promise<void> {
  const { error } = await createSupabase().from("areas").delete().eq("id", id);
  assertNoError(error, "مقدرناش نحذف المنطقة — ممكن عليها صنايعية");
}

export async function toggleAreaActive(area: AreaRow): Promise<void> {
  const { error } = await createSupabase()
    .from("areas")
    .update({ is_active: !area.is_active })
    .eq("id", area.id);
  assertNoError(error, "مقدرناش نحدّث حالة المنطقة");
}

// ------------------------------ عمليات الصنايعية ------------------------------

export async function toggleCraftsmanVerified(
  craftsman: CraftsmanRow,
): Promise<void> {
  const { error } = await createSupabase()
    .from("craftsmen")
    .update({ verified: !craftsman.verified })
    .eq("id", craftsman.id);
  assertNoError(error, "مقدرناش نحدّث التوثيق");
}

export async function toggleCraftsmanPublished(
  craftsman: CraftsmanRow,
): Promise<void> {
  const { error } = await createSupabase()
    .from("craftsmen")
    .update({ is_published: !craftsman.is_published })
    .eq("id", craftsman.id);
  assertNoError(error, "مقدرناش نحدّث حالة النشر");
}

function validateCraftsmanPayload(payload: CraftsmanInput): void {
  const errors = validateCraftsmanFields({
    name: payload.name,
    slug: payload.slug,
    categoryId: payload.category_id,
    areaId: payload.area_id,
    phone: payload.phone,
    whatsapp: payload.whatsapp ?? "",
    description: payload.description ?? "",
  });
  if (anyError(errors)) {
    throw new Error(firstError(errors) ?? "بيانات الصنايعي غير صحيحة");
  }
  const socialLinksError = validateSocialLinks(payload.socialLinks ?? []);
  if (socialLinksError) {
    throw new Error(socialLinksError);
  }
}

export async function createCraftsman(payload: CraftsmanInput): Promise<void> {
  validateCraftsmanPayload(payload);
  let imageUrl = payload.existingImageUrl ?? null;
  let newlyUploadedUrl: string | null = null;
  if (payload.image) {
    const uploaded = await uploadCraftsmanImage(payload.image, "craftsmen");
    imageUrl = uploaded.url;
    newlyUploadedUrl = uploaded.url;
  }
  const socialLinks = Array.isArray(payload.socialLinks)
    ? payload.socialLinks.map((link) => ({
        platform: link.platform,
        url: link.url.trim(),
      }))
    : [];
  const { error } = await createSupabase()
    .from("craftsmen")
    .insert({
      slug: cleanText(payload.slug),
      name: cleanText(payload.name),
      category_id: payload.category_id,
      area_id: payload.area_id,
      phone: sanitizeAndNormalizePhone(payload.phone),
      whatsapp: payload.whatsapp ? sanitizeAndNormalizePhone(payload.whatsapp) : null,
      description: payload.description ? cleanText(payload.description) : null,
      image_url: imageUrl,
      verified: payload.verified,
      is_published: payload.is_published,
      status: "approved",
      social_links: socialLinks,
    })
    .select("id")
    .single();

  if (error) {
    if (newlyUploadedUrl) {
      await deleteImageByUrl(newlyUploadedUrl);
    }
    throw new Error("مقدرناش نضيف الصنايعي");
  }
}

export async function updateCraftsman(
  id: string,
  payload: CraftsmanInput,
): Promise<void> {
  validateCraftsmanPayload(payload);
  let imageUrl = payload.existingImageUrl ?? null;
  let newlyUploadedUrl: string | null = null;
  if (payload.image) {
    const uploaded = await uploadCraftsmanImage(payload.image, "craftsmen");
    imageUrl = uploaded.url;
    newlyUploadedUrl = uploaded.url;
  }
  const { error } = await createSupabase()
    .from("craftsmen")
    .update({
      slug: cleanText(payload.slug),
      name: cleanText(payload.name),
      category_id: payload.category_id,
      area_id: payload.area_id,
      phone: sanitizeAndNormalizePhone(payload.phone),
      whatsapp: payload.whatsapp ? sanitizeAndNormalizePhone(payload.whatsapp) : null,
      description: payload.description ? cleanText(payload.description) : null,
      image_url: imageUrl,
      verified: payload.verified,
      is_published: payload.is_published,
      social_links: Array.isArray(payload.socialLinks)
        ? payload.socialLinks.map((l) => ({ platform: l.platform, url: l.url.trim() }))
        : [],
    })
    .eq("id", id);

  if (error) {
    if (newlyUploadedUrl) {
      await deleteImageByUrl(newlyUploadedUrl);
    }
    assertNoError(error, "مقدرناش نحدّث الصنايعي");
  }

  // حذف الصورة القديمة فقط بعد نجاح تحديث السجل في قاعدة البيانات
  if (newlyUploadedUrl && payload.existingImageUrl && payload.existingImageUrl !== newlyUploadedUrl) {
    await deleteImageByUrl(payload.existingImageUrl);
  }
}

export async function deleteCraftsman(
  id: string,
  craftsmen: CraftsmanRow[],
): Promise<void> {
  const target = craftsmen.find((craftsman) => craftsman.id === id);
  const { error } = await createSupabase().from("craftsmen").delete().eq("id", id);
  assertNoError(error, "مقدرناش نحذف الصنايعي");

  // حذف الصورة القديمة فقط بعد نجاح حذف السجل في قاعدة البيانات
  if (target?.image_url) {
    try {
      await deleteImageByUrl(target.image_url);
    } catch {
      // فشل حذف الصورة التخزينية لا يمنع استكمال العملية طالما السجل حُذف
    }
  }
}

// ------------------------------ عمليات الطلبات ------------------------------

export async function approveJoinRequest(
  request: JoinRequestRow,
): Promise<void> {
  const supabase = createSupabase();
  const { error } = await supabase.rpc("approve_craftsman_application", {
    p_craftsman_id: request.id,
  });
  if (error) {
    throw new Error(error.message || "Approval failed");
  }
  if (request.image_url) {
    const movedUrl = await moveImageToCraftsman(request.image_url, request.id);
    if (movedUrl && movedUrl !== request.image_url) {
      const { error: updateError } = await supabase
        .from("craftsmen")
        .update({ image_url: movedUrl })
        .eq("id", request.id);
      if (updateError) {
        throw new Error(updateError.message || "Approval failed");
      }
    }
  }
}

export async function rejectJoinRequest(requestId: string): Promise<void> {
  const supabase = createSupabase();
  const { error } = await supabase.rpc("reject_craftsman_application", {
    p_craftsman_id: requestId,
  });
  if (error) {
    throw new Error(error.message || "Rejection failed");
  }
}

export async function deleteJoinRequest(requestId: string): Promise<void> {
  const supabase = createSupabase();
  const { data, error: fetchError } = await supabase
    .from("craftsmen")
    .select("image_url")
    .eq("id", requestId)
    .single();
  if (fetchError || !data) return;

  const { error } = await supabase.from("craftsmen").delete().eq("id", requestId);
  if (error) throw new Error(error.message);

  // حذف الصورة من مجلد الطلبات فقط بعد نجاح حذف السجل
  if (data.image_url) {
    try {
      await deleteImageByUrl(data.image_url);
    } catch {
      // فشل حذف الصورة التخزينية لا يمنع نجاح حذف السجل
    }
  }
}

// ------------------------------ عمليات البلاغات ------------------------------

const REPORTS_SELECT =
  "id, craftsman_name, phone, message, status, reporter_user_id, created_at, updated_at";

export async function fetchReports(
  client: SupabaseClient<Database> = createSupabase(),
): Promise<ReportRow[]> {
  const { data, error } = await client
    .from("reports")
    .select(REPORTS_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw new Error("مقدرناش نحمّل بيانات لوحة التحكم");
  return (data ?? []).map((row) => ({
    ...row,
    status: row.status as ReportRow["status"],
  }));
}

export async function updateReportStatus(
  reportId: string,
  status: ReportRow["status"],
): Promise<void> {
  const { error } = await createSupabase()
    .from("reports")
    .update({ status })
    .eq("id", reportId);
  assertNoError(error, "مقدرناش نحدّث حالة البلاغ");
}

export async function deleteReport(reportId: string): Promise<void> {
  const { error } = await createSupabase()
    .from("reports")
    .delete()
    .eq("id", reportId);
  assertNoError(error, "مقدرناش نحذف البلاغ");
}

// ------------------------------ عمليات الرسائل ------------------------------

export async function toggleMessageRead(message: ContactMessageRow): Promise<void> {
  const { error } = await createSupabase()
    .from("contact_messages")
    .update({ is_read: !message.is_read })
    .eq("id", message.id);
  assertNoError(error, "مقدرناش نحدّث حالة الرسالة");
}

export async function deleteContactMessage(messageId: string): Promise<void> {
  const { error } = await createSupabase()
    .from("contact_messages")
    .delete()
    .eq("id", messageId);
  assertNoError(error, "مقدرناش نحذف الرسالة");
}

// ------------------------------ ربط حساب الفني ------------------------------

export async function linkCraftsmanAccount(
  craftsmanId: string,
  email: string
): Promise<void> {
  const emailError = validateEmail(email);
  if (emailError) {
    throw new Error("يرجى إدخال بريد إلكتروني صحيح");
  }
  const cleanEmail = cleanText(email).toLowerCase();

  const { error } = await createSupabase().rpc("link_craftsman_user", {
    craftsman_id_input: craftsmanId,
    user_email_input: cleanEmail,
  });

  if (error) {
    throw new Error(error.message || "تعذر ربط الحساب — تأكد من أن المستخدم قد سجل دخوله بالموقع أولاً");
  }
}

// ------------------------------ سجل النشاط اللحظي (Activity Feed) ------------------------------

export type ActivityFeedItem = {
  logId: number;
  craftsmanId: string;
  craftsmanName: string;
  craftsmanSlug: string;
  contactMethod: "phone" | "whatsapp";
  userStatus: "authenticated" | "anonymous";
  userDisplayName?: string | null;
  metadata: Json | null;
  createdAt: string;
};

export async function fetchAdminActivityFeed(
  supabase: SupabaseClient<Database> = createSupabase(),
  timeframe: "today" | "week" | "month" = "today",
  limit = 50,
): Promise<ActivityFeedItem[]> {
  const { data, error } = await supabase.rpc("get_admin_activity_feed", {
    p_timeframe: timeframe,
    p_limit: limit,
    p_offset: 0,
  });

  if (error) {
    console.error("[admin] fetchAdminActivityFeed error:", error);
    return [];
  }

  return (data || []).map((row) => ({
    logId: row.log_id,
    craftsmanId: row.craftsman_id,
    craftsmanName: row.craftsman_name,
    craftsmanSlug: row.craftsman_slug,
    contactMethod: row.contact_method as "phone" | "whatsapp",
    userStatus: row.user_status as "authenticated" | "anonymous",
    userDisplayName: row.user_display_name,
    metadata: row.metadata,
    createdAt: row.created_at,
  }));
}

// ------------------------------ دوال مخصصة لترشيد صفحة النظرة العامة ------------------------------

/** جلب الطلبات المعلقة فقط بحد أقصى (بدون تحميل كافة الصنايعية والطلبات القديمة) */
export async function fetchPendingRequests(
  client: SupabaseClient<Database> = createSupabase(),
  limit = 5,
): Promise<JoinRequestRow[]> {
  const { data, error } = await client
    .from("craftsmen")
    .select(REQUESTS_SELECT)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("مقدرناش نحمّل الطلبات المعلقة");
  return (data ?? []).map(mapRequestRow);
}

/** جلب البلاغات المعلقة فقط بحد أقصى */
export async function fetchPendingReports(
  client: SupabaseClient<Database> = createSupabase(),
  limit = 5,
): Promise<ReportRow[]> {
  const { data, error } = await client
    .from("reports")
    .select("id, craftsman_name, phone, message, status, reporter_user_id, created_at, updated_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("مقدرناش نحمّل البلاغات المعلقة");
  return (data ?? []).map((row) => ({
    ...row,
    status: row.status as ReportRow["status"],
  }));
}

/** جلب أحدث الصنايعية المعتمدين فقط بحد أقصى */
export async function fetchRecentCraftsmen(
  client: SupabaseClient<Database> = createSupabase(),
  limit = 5,
): Promise<CraftsmanRow[]> {
  const { data, error } = await client
    .from("craftsmen")
    .select(CRAFTSMEN_ADMIN_SELECT)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("مقدرناش نحمّل أحدث الصنايعية");
  return (data ?? []).map(mapCraftsmanSocialLinks);
}

/** تجميع إحصائيات الصنايعية الشاملة وجلب الأعلى تواصلاً دون تحميل جداول الصنايعية الكاملة */
export async function fetchCraftsmanStatsOverview(
  client: SupabaseClient<Database> = createSupabase(),
  topLimit = 5,
): Promise<{
  totalCalls: number;
  totalWhatsapp: number;
  totalViews: number;
  mostContacted: MostContactedItem[];
}> {
  const { data: statsRows, error } = await client
    .from("craftsman_stats")
    .select("craftsman_id, calls, whatsapp, views");

  if (error || !statsRows || statsRows.length === 0) {
    return { totalCalls: 0, totalWhatsapp: 0, totalViews: 0, mostContacted: [] };
  }

  let totalCalls = 0;
  let totalWhatsapp = 0;
  let totalViews = 0;
  const sortedStats: { craftsmanId: string; contacts: number }[] = [];

  for (const row of statsRows) {
    const calls = row.calls ?? 0;
    const whatsapp = row.whatsapp ?? 0;
    const views = row.views ?? 0;
    totalCalls += calls;
    totalWhatsapp += whatsapp;
    totalViews += views;
    const contacts = calls + whatsapp;
    if (contacts > 0) {
      sortedStats.push({ craftsmanId: row.craftsman_id, contacts });
    }
  }

  sortedStats.sort((a, b) => b.contacts - a.contacts);
  const topSlice = sortedStats.slice(0, topLimit);

  if (topSlice.length === 0) {
    return { totalCalls, totalWhatsapp, totalViews, mostContacted: [] };
  }

  const ids = topSlice.map((s) => s.craftsmanId);
  const { data: craftsmenData } = await client
    .from("craftsmen")
    .select(CRAFTSMEN_ADMIN_SELECT)
    .in("id", ids);

  const mapped = (craftsmenData ?? []).map(mapCraftsmanSocialLinks);
  const craftsmenMap = new Map(mapped.map((c) => [c.id, c]));

  const mostContacted: MostContactedItem[] = [];
  for (const item of topSlice) {
    const craftsman = craftsmenMap.get(item.craftsmanId);
    if (craftsman) {
      mostContacted.push({ craftsman, contacts: item.contacts });
    }
  }

  return { totalCalls, totalWhatsapp, totalViews, mostContacted };
}

/** تجميع مقاييس النظرة العامة للوحة المشرف بكفاءة عبر RPCs واستعلامات مجتزأة */
export async function fetchAdminOverviewMetrics(
  client: SupabaseClient<Database> = createSupabase(),
): Promise<OverviewMetrics> {
  const [
    navCounts,
    breakdown,
    categories,
    areas,
    pendingRequests,
    pendingReports,
    recentCraftsmen,
    statsOverview,
    siteStatsRes,
  ] = await Promise.all([
    fetchAdminNavCounts(client),
    fetchAdminBreakdownCounts(client),
    fetchCategories(client),
    fetchAreas(client),
    fetchPendingRequests(client, 5),
    fetchPendingReports(client, 5),
    fetchRecentCraftsmen(client, 5),
    fetchCraftsmanStatsOverview(client, 5),
    client.rpc("get_site_stats"),
  ]);

  const categoryChart: CategoryChartItem[] = categories
    .filter((item) => item.is_active)
    .map((category) => ({
      name: category.name,
      count: breakdown.byCategory[category.slug] ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(1, ...categoryChart.map((item) => item.count));

  const siteStatsData = (siteStatsRes.data ?? {}) as Record<string, unknown>;
  const publishedCraftsmen = Number(siteStatsData.publishedCraftsmen) || 0;
  const totalCraftsmen = publishedCraftsmen + navCounts.pendingRequests;

  return {
    publishedCraftsmen,
    totalCraftsmen,
    pendingRequests,
    pendingReports,
    activeCategories: categories.filter((item) => item.is_active).length,
    totalCategories: categories.length,
    activeAreas: areas.filter((item) => item.is_active).length,
    totalAreas: areas.length,
    unreadMessages: navCounts.unreadMessages,
    recentCraftsmen,
    categoryChart,
    maxCount,
    totalCalls: statsOverview.totalCalls,
    totalWhatsapp: statsOverview.totalWhatsapp,
    totalViews: statsOverview.totalViews,
    mostContacted: statsOverview.mostContacted,
  };
}

// ------------------------------ إدارة المستخدمين ------------------------------

export type AdminUserRow = {
  id: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  role: "client" | "craftsman" | "admin";
  craftsmanId: string | null;
  craftsmanName?: string | null;
  craftsmanSlug?: string | null;
  createdAt: string;
};

export async function fetchAdminUsers(
  client: SupabaseClient<Database> = createSupabase(),
): Promise<AdminUserRow[]> {
  const { data, error } = await client.rpc("get_admin_users");

  if (error) {
    console.error("[admin] fetchAdminUsers error:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    displayName: row.display_name || "بدون اسم",
    email: row.email,
    avatarUrl: row.avatar_url,
    role: (row.role as AdminUserRow["role"]) || "client",
    craftsmanId: row.craftsman_id,
    craftsmanName: row.craftsman_name,
    craftsmanSlug: row.craftsman_slug,
    createdAt: row.created_at,
  }));
}


