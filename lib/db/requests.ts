import { deleteImageByUrl, uploadCraftsmanImage } from "../storage/images";
import { createSupabase } from "./client";
import {
  anyError,
  cleanText,
  firstError,
  sanitizeAndNormalizePhone,
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

async function getCategoryId(slug: string): Promise<string> {
  const { data, error } = await createSupabase()
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) {
    throw new Error("التخصص المختار غير متاح حالياً");
  }
  return data.id;
}

async function getAreaId(name: string): Promise<string> {
  const { data, error } = await createSupabase()
    .from("areas")
    .select("id")
    .eq("name", name)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) {
    throw new Error("المنطقة المختارة غير متاح حالياً");
  }
  return data.id;
}

/**
 * يقدّم طلب انضمام كصنايعي — يُدرَج مباشرة في جدول `craftsmen` بحالة pending.
 * يظهر في الدليل بعد موافقة المشرف ( يولّد slug ويربط حساب المستخدم ).
 */
export async function submitCraftsmanApplication(
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

  if (!payload.image) {
    throw new Error("صورة الصنايعي مطلوبة");
  }

  const supabase = createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("سجّل دخولك الأول عشان تقدر تضيف صنايعي");
  }

  const { data: existingPending } = await supabase
    .from("craftsmen")
    .select("id")
    .eq("submitted_by", user.id)
    .eq("status", "pending")
    .maybeSingle();
  if (existingPending) {
    throw new Error("عندك طلب تسجيل قيد المراجعة بالفعل. تواصل معنا إذا كنت تريد تعديله.");
  }

  const [categoryId, areaId] = await Promise.all([
    getCategoryId(payload.category),
    getAreaId(payload.area),
  ]);

  let imageUrl: string | null = null;
  if (payload.image) {
    const uploaded = await uploadCraftsmanImage(payload.image, "requests");
    imageUrl = uploaded.url;
  }

  const { error } = await supabase.from("craftsmen").insert({
    slug: null,
    name: cleanText(payload.name),
    category_id: categoryId,
    area_id: areaId,
    phone: sanitizeAndNormalizePhone(payload.phone),
    whatsapp: payload.whatsapp ? sanitizeAndNormalizePhone(payload.whatsapp) : null,
    description: payload.description ? cleanText(payload.description) : null,
    image_url: imageUrl,
    status: "pending",
    is_published: false,
    verified: false,
    submitted_by: user.id,
    social_links: payload.socialLinks.map((link) => ({
      platform: link.platform,
      url: link.url.trim(),
    })),
  });

  if (error) {
    if (imageUrl) {
      await deleteImageByUrl(imageUrl);
    }
    if (error.code === "23505") {
      throw new Error("عندك طلب تسجيل قيد المراجعة بالفعل — هيظهر بعد ما المشرف يوافق");
    }
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

  const supabase = createSupabase();
  const { data } = await supabase.auth.getUser();

  const { error } = await supabase.from("reports").insert({
    craftsman_name: cleanText(payload.craftsmanName),
    phone: sanitizeAndNormalizePhone(payload.phone),
    message: cleanText(payload.message),
    reporter_user_id: data.user?.id ?? null,
  });

  if (error) {
    throw new Error("مقدرناش نستقبل البلاغ دلوقتي — جرّب تاني بعد شوية");
  }
}
