import { uploadCraftsmanImage } from "../storage/images";
import { createSupabase } from "./client";
import {
  anyError,
  cleanText,
  firstError,
  type SocialLinkDraft,
  validateRegisterFields,
  validateReportFields,
  validateSocialLinks,
} from "../utils/validation";

export type RegisterRequestPayload = {
  name: string;
  category: string;
  area: string;
  phone: string;
  whatsapp: string;
  description: string;
  image: File | null;
  socialLinks: SocialLinkDraft[];
};

export type ReportRequestPayload = {
  craftsmanName: string;
  phone: string;
  message: string;
};

type LookupRow = {
  id: string;
};

async function getCategoryId(slug: string): Promise<string> {
  const { data, error } = (await createSupabase()
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()) as { data: LookupRow | null; error: { message: string } | null };
  if (error || !data) {
    throw new Error("التخصص المختار غير متاح حالياً");
  }
  return data.id;
}

async function getAreaId(name: string): Promise<string> {
  const { data, error } = (await createSupabase()
    .from("areas")
    .select("id")
    .eq("name", name)
    .eq("is_active", true)
    .maybeSingle()) as { data: LookupRow | null; error: { message: string } | null };
  if (error || !data) {
    throw new Error("المنطقة المختارة غير متاحة حالياً");
  }
  return data.id;
}

export async function submitRegisterRequest(
  payload: RegisterRequestPayload,
): Promise<void> {
  const errors = validateRegisterFields({
    name: payload.name,
    category: payload.category,
    area: payload.area,
    phone: payload.phone,
    whatsapp: payload.whatsapp,
    description: payload.description,
  });
  if (anyError(errors)) {
    throw new Error(firstError(errors) ?? "البيانات غير صحيحة");
  }
  const socialLinksError = validateSocialLinks(payload.socialLinks);
  if (socialLinksError) {
    throw new Error(socialLinksError);
  }

  const supabase = createSupabase();
  const [categoryId, areaId] = await Promise.all([
    getCategoryId(payload.category),
    getAreaId(payload.area),
  ]);

  let imageUrl: string | null = null;
  if (payload.image) {
    const uploaded = await uploadCraftsmanImage(payload.image, "requests");
    imageUrl = uploaded.url;
  }

  const { error } = await supabase.from("join_requests").insert({
    type: "register",
    name: cleanText(payload.name),
    category_id: categoryId,
    area_id: areaId,
    phone: cleanText(payload.phone),
    whatsapp: payload.whatsapp ? cleanText(payload.whatsapp) : null,
    description: payload.description ? cleanText(payload.description) : null,
    image_url: imageUrl,
    social_links: payload.socialLinks.map((link) => ({
      platform: link.platform,
      url: link.url.trim(),
    })),
  });

  if (error) {
    throw new Error("مقدرناش نستقبل البيانات دلوقتي — جرّب تاني بعد شوية");
  }
}

export async function submitReportRequest(
  payload: ReportRequestPayload,
): Promise<void> {
  const errors = validateReportFields(payload);
  if (anyError(errors)) {
    throw new Error(firstError(errors) ?? "البيانات غير صحيحة");
  }

  const { error } = await createSupabase().from("join_requests").insert({
    type: "report",
    craftsman_name: cleanText(payload.craftsmanName),
    phone: cleanText(payload.phone),
    report_message: cleanText(payload.message),
  });

  if (error) {
    throw new Error("مقدرناش نستقبل البلاغ دلوقتي — جرّب تاني بعد شوية");
  }
}
