import {
  copyImageToCraftsman,
  deleteImageByUrl,
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
  type: "register" | "report";
  name: string | null;
  category_id: string | null;
  area_id: string | null;
  phone: string | null;
  whatsapp: string | null;
  description: string | null;
  image_url: string | null;
  craftsman_name: string | null;
  report_message: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  category: CategoryJoin | null;
  area: AreaJoin | null;
  socialLinks?: SocialLinkRow[];
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
  type: string;
  name: string | null;
  category_id: string | null;
  area_id: string | null;
  phone: string | null;
  whatsapp: string | null;
  description: string | null;
  image_url: string | null;
  craftsman_name: string | null;
  report_message: string | null;
  status: string;
  created_at: string;
  category: CategoryJoin | null;
  area: AreaJoin | null;
  social_links: Json;
};

type CraftsmanSelectRow = Omit<CraftsmanRow, "socialLinks"> & {
  social_links: { platform: string; url: string }[] | null;
};

const REQUESTS_SELECT =
  "id, type, name, category_id, area_id, phone, whatsapp, description, image_url, craftsman_name, report_message, status, created_at, category:categories(slug, name), area:areas(name), social_links";

const CRAFTSMEN_ADMIN_SELECT =
  "id, slug, name, category_id, area_id, phone, whatsapp, description, image_url, verified, is_published, added_at, created_at, category:categories(slug, name), area:areas(name), stats:craftsman_stats(views, calls, whatsapp), social_links:social_links(platform, url)";

const COUNTS_SELECT = "id, category:categories(slug), area:areas(name)";

function mapSocialLinks(row: RequestSelectRow): JoinRequestRow {
  return {
    id: row.id,
    type: row.type as JoinRequestRow["type"],
    name: row.name,
    category_id: row.category_id,
    area_id: row.area_id,
    phone: row.phone,
    whatsapp: row.whatsapp,
    description: row.description,
    image_url: row.image_url,
    craftsman_name: row.craftsman_name,
    report_message: row.report_message,
    status: row.status as JoinRequestRow["status"],
    created_at: row.created_at,
    category: row.category,
    area: row.area,
    socialLinks: Array.isArray(row.social_links)
      ? (row.social_links as SocialLinkRow[])
      : undefined,
  };
}

function mapCraftsmanSocialLinks(row: CraftsmanSelectRow): CraftsmanRow {
  return {
    ...row,
    socialLinks: row.social_links?.map((link) => ({
      platform: link.platform as SocialLinkRow["platform"],
      url: link.url,
    })),
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

export async function fetchRequests(): Promise<JoinRequestRow[]> {
  const { data, error } = await createSupabase()
    .from("join_requests")
    .select(REQUESTS_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw new Error("مقدرناش نحمّل بيانات لوحة التحكم");
  return (data ?? []).map(mapSocialLinks);
}

export async function fetchCategories(): Promise<CategoryRow[]> {
  const { data, error } = await createSupabase()
    .from("categories")
    .select("id, slug, name, icon, sort_order, is_active")
    .order("sort_order");
  if (error) throw new Error("مقدرناش نحمّل بيانات لوحة التحكم");
  return data ?? [];
}

export async function fetchAreas(): Promise<AreaRow[]> {
  const { data, error } = await createSupabase()
    .from("areas")
    .select("id, name, sort_order, is_active")
    .order("sort_order");
  if (error) throw new Error("مقدرناش نحمّل بيانات لوحة التحكم");
  return data ?? [];
}

export async function fetchCraftsmen(): Promise<CraftsmanRow[]> {
  const { data, error } = await createSupabase()
    .from("craftsmen")
    .select(CRAFTSMEN_ADMIN_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw new Error("مقدرناش نحمّل بيانات لوحة التحكم");
  return (data ?? []).map(mapCraftsmanSocialLinks);
}

export async function fetchMessages(): Promise<ContactMessageRow[]> {
  const { data, error } = await createSupabase()
    .from("contact_messages")
    .select("id, name, phone, message, is_read, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error("مقدرناش نحمّل بيانات لوحة التحكم");
  return data ?? [];
}

export async function fetchCounts(): Promise<CountRow[]> {
  const { data, error } = await createSupabase()
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

async function saveSocialLinks(
  craftsmanId: string,
  links: SocialLinkRow[],
): Promise<void> {
  if (links.length === 0) return;
  const { error } = await createSupabase().from("social_links").insert(
    links.map((link) => ({
      craftsman_id: craftsmanId,
      platform: link.platform,
      url: link.url.trim(),
    })),
  );
  assertNoError(error, "مقدرناش نحفظ روابط السوشيال");
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
  const { data: inserted, error } = await createSupabase()
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
    })
    .select("id")
    .single();
  if (error) throw new Error("مقدرناش نضيف الصنايعي");
  await saveSocialLinks(inserted.id, payload.socialLinks ?? []);
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
    })
    .eq("id", id);
  assertNoError(error, "مقدرناش نحدّث الصنايعي");
  const { error: linksDeleteError } = await createSupabase()
    .from("social_links")
    .delete()
    .eq("craftsman_id", id);
  assertNoError(linksDeleteError, "مقدرناش نحدّث روابط السوشيال");
  await saveSocialLinks(id, payload.socialLinks ?? []);
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
  if (request.type === "report") {
    const { error } = await createSupabase()
      .from("join_requests")
      .update({ status: "approved" })
      .eq("id", request.id);
    assertNoError(error, "مقدرناش نوافق على البلاغ");
    return;
  }

  if (!request.name || !request.category_id || !request.area_id || !request.phone) {
    throw new Error("طلب التسجيل ناقص ومحتاج مراجعة يدوية");
  }

  const { data: createdCraftsmanId, error: rpcError } =
    await createSupabase().rpc("approve_join_request", {
      p_request_id: request.id,
    });
  if (rpcError) {
    if ((rpcError.message ?? "").includes("قبل")) {
      throw new Error("الطلب اتوافق عليه أو اترفض من قبل");
    }
    throw new Error("مقدرناش نوافق على الطلب");
  }

  if (request.image_url && createdCraftsmanId) {
    const imageUrl = await copyImageToCraftsman(request.image_url, createdCraftsmanId);
    const { error: imageError } = await createSupabase()
      .from("craftsmen")
      .update({ image_url: imageUrl })
      .eq("id", createdCraftsmanId);
    assertNoError(imageError, "مقدرناش نحدّث صورة الصنايعي");
  }
}

export async function rejectJoinRequest(requestId: string): Promise<void> {
  const { error } = await createSupabase()
    .from("join_requests")
    .update({ status: "rejected" })
    .eq("id", requestId);
  assertNoError(error, "مقدرناش نرفض الطلب");
}

export async function deleteJoinRequest(
  requestId: string,
  requests: JoinRequestRow[],
): Promise<void> {
  const target = requests.find((request) => request.id === requestId);
  if (target?.image_url) {
    const { data: shared } = await createSupabase()
      .from("craftsmen")
      .select("id")
      .eq("image_url", target.image_url)
      .limit(1);
    if (!shared?.length) {
      await deleteImageByUrl(target.image_url);
    }
  }
  const { error } = await createSupabase()
    .from("join_requests")
    .delete()
    .eq("id", requestId);
  assertNoError(error, "مقدرناش نحذف الطلب");
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
