import { createSupabase } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
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
import type { UpdateCraftsmanSelfInput } from "./craftsman-dashboard";

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
 * تدفق مستقل ومخصص لحفظ صورة الصنايعي وموضعها
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
    const uploaded = await uploadCraftsmanImage(imageFile, "craftsmen", craftsmanId);
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
    const uploaded = await uploadCraftsmanImage(payload.image, "craftsmen", craftsmanId);
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
