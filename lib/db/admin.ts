import {
  deleteImageByUrl,
  moveImageToCraftsman,
  uploadCraftsmanImage,
} from "../storage/images";
import {
  anyError,
  firstError,
  validateCategoryFields,
  validateCraftsmanFields,
  validateName,
  validateSocialLinks,
} from "../utils/validation";
import { createSupabase } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { Json } from "./database.types";

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
    .select("id, slug, name, icon, sort_order, is_active")
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
  if (payload.image) {
    const uploaded = await uploadCraftsmanImage(payload.image, "craftsmen");
    imageUrl = uploaded.url;
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
      slug: payload.slug,
      name: payload.name,
      category_id: payload.category_id,
      area_id: payload.area_id,
      phone: payload.phone,
      whatsapp: payload.whatsapp,
      description: payload.description,
      image_url: imageUrl,
      verified: payload.verified,
      is_published: payload.is_published,
      status: "approved",
      social_links: socialLinks,
    })
    .select("id")
    .single();
  if (error) throw new Error("مقدرناش نضيف الصنايعي");
}

export async function updateCraftsman(
  id: string,
  payload: CraftsmanInput,
): Promise<void> {
  validateCraftsmanPayload(payload);
  let imageUrl = payload.existingImageUrl ?? null;
  if (payload.image) {
    const uploaded = await uploadCraftsmanImage(payload.image, "craftsmen");
    imageUrl = uploaded.url;
    if (payload.existingImageUrl) {
      await deleteImageByUrl(payload.existingImageUrl);
    }
  }
  const { error } = await createSupabase()
    .from("craftsmen")
    .update({
      slug: payload.slug,
      name: payload.name,
      category_id: payload.category_id,
      area_id: payload.area_id,
      phone: payload.phone,
      whatsapp: payload.whatsapp,
      description: payload.description,
      image_url: imageUrl,
      verified: payload.verified,
      is_published: payload.is_published,
      social_links: Array.isArray(payload.socialLinks) ? payload.socialLinks : [],
    })
    .eq("id", id);
  assertNoError(error, "مقدرناش نحدّث الصنايعي");
}

export async function deleteCraftsman(
  id: string,
  craftsmen: CraftsmanRow[],
): Promise<void> {
  const target = craftsmen.find((craftsman) => craftsman.id === id);
  if (target?.image_url) {
    await deleteImageByUrl(target.image_url);
  }
  const { error } = await createSupabase().from("craftsmen").delete().eq("id", id);
  assertNoError(error, "مقدرناش نحذف الصنايعي");
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
  if (data.image_url) {
    await deleteImageByUrl(data.image_url);
  }
  const { error } = await supabase.from("craftsmen").delete().eq("id", requestId);
  if (error) throw new Error(error.message);
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
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("يرجى إدخال بريد إلكتروني صحيح");
  }

  const { error } = await createSupabase().rpc("link_craftsman_user", {
    craftsman_id_input: craftsmanId,
    user_email_input: cleanEmail,
  });

  if (error) {
    throw new Error(error.message || "تعذر ربط الحساب — تأكد من أن المستخدم قد سجل دخوله بالموقع أولاً");
  }
}
