"use server";

import { revalidatePath } from "next/cache";
import { createServerAdminClient, getServerSession } from "@/lib/db/server";
import {
  buildLeadImageTarget,
  extractImagePathFromUrl,
  IMAGE_BUCKET,
  isTempLeadUploadUrl,
  LEAD_IMAGES_MAX,
  publicImageUrl,
} from "@/lib/storage/images";
import {
  cleanText,
  firstError,
  isUuid,
  normalizePhone,
  validateLeadFields,
  validateDescription,
  validatePhone,
  type LeadErrors,
} from "@/lib/utils/validation";

export type SubmitLeadResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: LeadErrors };

export type ClaimLeadResult = { success: true } | { success: false; error: string };

const TOO_MANY_IMAGES_ERROR = `الحد الأقصى ${LEAD_IMAGES_MAX} صور للمشكلة`;

/** استخراج حقول الصور المؤقتة من FormData (أسماء `image_url` مكررة). */
function leadTempImages(formData: FormData): string[] {
  return formData
    .getAll("image_url")
    .filter((v): v is string => typeof v === "string" && v.length > 0);
}

/**
 * نقل صور مؤقتة (`requests/`) إلى مجلد الطلب النهائي عبر عميل إداري.
 * يعيد الـ URLs العامة للمنقول بنجاح فقط — الفشل الجزئي يُسجَّل ولا
 * يُفشل الطلب (الصور best-effort؛ تُعاد إضافتها بالتعديل).
 */
async function moveTempLeadImages(
  tempUrls: string[],
  leadId: string,
): Promise<string[]> {
  if (tempUrls.length === 0) return [];
  const admin = createServerAdminClient();
  const moved: string[] = [];
  const failed: string[] = [];
  for (const url of tempUrls) {
    const path = extractImagePathFromUrl(url);
    if (!path) continue;
    const ext = (path.split(".").pop() ?? "").toLowerCase();
    const target = buildLeadImageTarget(leadId, ext);
    const { error } = await admin.storage.from(IMAGE_BUCKET).move(path, target);
    if (error) {
      console.error("moveTempLeadImages:", path, error.message);
      failed.push(path);
      continue;
    }
    moved.push(publicImageUrl(admin, target));
  }
  // المصادر الفاشلة لا مرجع لها أبداً — تُمسح فوراً بدل أن تتيتم في requests/.
  if (failed.length > 0) {
    const { error: sweepError } = await admin.storage.from(IMAGE_BUCKET).remove(failed);
    if (sweepError) console.error("moveTempLeadImages sweep:", sweepError.message);
  }
  return moved;
}

/** حذف ملفات خرجت من مصفوفة الصور بعد نجاح التحديث — بلا عرقلة عند الفشل. */
export async function deleteLeadImages(urls: string[]): Promise<void> {
  if (urls.length === 0) return;
  const admin = createServerAdminClient();
  const paths = urls
    .map((u) => extractImagePathFromUrl(u))
    .filter((p): p is string => !!p);
  if (paths.length === 0) return;
  const { error } = await admin.storage.from(IMAGE_BUCKET).remove(paths);
  if (error) console.error("deleteLeadImages:", error.message);
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function submitLead(formData: FormData): Promise<SubmitLeadResult> {
  const fields = {
    categoryId: field(formData, "category_id"),
    areaId: field(formData, "area_id"),
    description: field(formData, "description"),
    phone: field(formData, "customer_phone"),
  };

  const fieldErrors = validateLeadFields(fields);
  const message = firstError(fieldErrors);
  if (message) return { success: false, error: message, fieldErrors };

  const { supabase, user } = await getServerSession();
  if (!user) return { success: false, error: "يجب تسجيل الدخول لإضافة طلب" };

  // طلبات الخدمة لحسابات العملاء فقط (الصنايعي/المشرف يُمنعان في الواجهة والسيرفر)
  // fail-closed: تعذّر قراءة الدور = رفض (الحماية الفعلية في حارس القاعدة guard_lead_insert)
  const { data: roleRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!roleRow) {
    return { success: false, error: "تعذر التحقق من الحساب، حاول مرة أخرى" };
  }
  if (roleRow.role === "craftsman" || roleRow.role === "admin") {
    return { success: false, error: "طلبات الخدمة متاحة لحسابات العملاء فقط" };
  }

  // صور اختيارية (حد 3): روابط مؤقتة من `requests/` تُنقل بعد الإنشاء.
  // الرفع نفسه يتم من المتصفح قبل الإرسال فلا يتامى تُرفع بلا طلب.
  const tempImages = leadTempImages(formData);
  if (tempImages.length > LEAD_IMAGES_MAX) {
    return { success: false, error: TOO_MANY_IMAGES_ERROR };
  }
  if (!tempImages.every(isTempLeadUploadUrl)) {
    return { success: false, error: "رابط صورة غير صالح — أعد اختيار الصور" };
  }

  const { data: created, error } = await supabase
    .from("leads")
    .insert({
      customer_id: user.id,
      category_id: cleanText(fields.categoryId),
      area_id: cleanText(fields.areaId),
      description: cleanText(fields.description),
      customer_phone: normalizePhone(cleanText(fields.phone)),
      status: "open",
    })
    .select("id")
    .single();

  if (error || !created) {
    // أي مؤقتات رُفعت في هذه المحاولة تُحذف فوراً — وإلا تراكمت أيتام في requests/.
    if (tempImages.length > 0) await deleteLeadImages(tempImages);
    if (error?.message.includes("lead_rate_limited")) {
      return { success: false, error: "وصلت للحد الأقصى (5 طلبات في اليوم). حاول لاحقاً." };
    }
    // تخصص/منطقة محذوفة بعد تحميل الصفحة — الـ FK يرفض بأجنبي مبهم
    if (error?.code === "23503") {
      return { success: false, error: "التخصص أو المنطقة غير صالحة — أعد تحميل الصفحة وحاول مجدداً." };
    }
    console.error("submitLead:", error?.message);
    return { success: false, error: "حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى." };
  }

  if (tempImages.length > 0) {
    const moved = await moveTempLeadImages(tempImages, created.id);
    if (moved.length > 0) {
      const { error: linkError } = await supabase
        .from("leads")
        .update({ image_urls: moved })
        .eq("id", created.id)
        .eq("customer_id", user.id);
      if (linkError) {
        console.error("submitLead link images:", linkError.message);
        await deleteLeadImages(moved);
      }
    }
  }

  revalidatePath("/profile/requests");
  return { success: true };
}

export async function claimLeadAction(leadId: string, craftsmanId: string): Promise<ClaimLeadResult> {
  if (!isUuid(leadId) || !isUuid(craftsmanId)) {
    return { success: false, error: "طلب غير صالح" };
  }

  const { supabase, user } = await getServerSession();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  // الملكية/التخصص/الاعتماد يتحقق منها claim_lead داخل قاعدة البيانات
  const { data, error } = await supabase.rpc("claim_lead", {
    p_lead_id: leadId,
    p_craftsman_id: craftsmanId,
  });

  if (error) {
    // أسباب نطاقية صريحة من claim_lead (بادئة LEAD_CLAIM_*) تُعرض كما هي
    const claimReason = /^LEAD_CLAIM_[A-Z_]+:\s*/.exec(error.message)?.[0];
    if (claimReason) {
      return { success: false, error: error.message.slice(claimReason.length) };
    }
    console.error("claimLeadAction:", error.message);
    return { success: false, error: "حدث خطأ غير متوقع، يرجى المحاولة لاحقاً" };
  }

  if (data === false) {
    revalidatePath("/dashboard/leads");
    return { success: false, error: "للأسف، اكتمل عدد الصنايعية لهذا الطلب." };
  }

  revalidatePath("/dashboard/leads");
  revalidatePath("/profile/requests");
  return { success: true };
}

/** فحص مشترك: الطلب موجود، ملك للعميل، مفتوح، غير مخفي، وبلا ردود فنية بعد. */
async function getOwnEditableLead(
  supabase: Awaited<ReturnType<typeof getServerSession>>["supabase"],
  userId: string,
  leadId: string,
  allowResponses: boolean = false
): Promise<{ error: string } | { lead: { id: string; status: string; image_urls: string[] } }> {
  const { data: lead } = await supabase
    .from("leads")
    .select("id, status, hidden, image_urls")
    .eq("id", leadId)
    .eq("customer_id", userId)
    .single();

  if (!lead) return { error: "الطلب غير موجود" } as const;

  if (lead.hidden) {
    return { error: "هذا الطلب مخفي إدارياً ولا يمكن تعديله" } as const;
  }

  if (lead.status !== "open") {
    return { error: "لا يمكن تعديل أو إلغاء الطلب بعد إغلاقه" } as const;
  }

  if (!allowResponses) {
    const { count } = await supabase
      .from("lead_responses")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", leadId);

    if ((count ?? 0) > 0) {
      return { error: "لا يمكن تعديل الطلب بعد موافقة فني عليه" } as const;
    }
  }

  return { lead } as const;
}

export async function updateLeadAction(
  leadId: string,
  description: string,
  phone: string,
  imageUrls?: string[],
): Promise<ClaimLeadResult> {
  if (!isUuid(leadId)) return { success: false, error: "طلب غير صالح" };

  const descError = validateDescription(description, true);
  if (descError) return { success: false, error: descError };

  const cleanPhone = cleanText(phone);
  if (cleanPhone) {
    const phoneError = validatePhone(phone);
    if (phoneError) return { success: false, error: phoneError };
  }

  // المصفوفة النهائية المرغوبة (محتفظ به + مؤقت جديد) — undefined = بلا تغيير.
  const wantImages = imageUrls !== undefined;
  if (wantImages && imageUrls.length > LEAD_IMAGES_MAX) {
    return { success: false, error: TOO_MANY_IMAGES_ERROR };
  }

  const { supabase, user } = await getServerSession();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const guard = await getOwnEditableLead(supabase, user.id, leadId);
  if ("error" in guard) return { success: false, error: guard.error };

  const currentImages = Array.isArray(guard.lead.image_urls) ? guard.lead.image_urls : [];
  let finalImages: string[] | undefined;
  if (wantImages) {
    const desired = imageUrls.filter((u) => typeof u === "string" && u.length > 0);
    const kept = desired.filter((u) => currentImages.includes(u));
    const temps = desired.filter((u) => !currentImages.includes(u));
    // أي رابط ليس من الحالي ولا مؤقتاً صالحاً = حقن مرفوض.
    if (!temps.every(isTempLeadUploadUrl)) {
      return { success: false, error: "رابط صورة غير صالح — أعد اختيار الصور" };
    }
    const moved = await moveTempLeadImages(temps, leadId);
    if (moved.length < temps.length) {
      await deleteLeadImages(moved);
      return { success: false, error: "تعذر رفع بعض الصور — حاول مرة أخرى" };
    }
    finalImages = [...kept, ...moved];
  }

  const updateData: { description: string; customer_phone?: string; image_urls?: string[] } = {
    description: cleanText(description),
  };

  if (cleanPhone) {
    updateData.customer_phone = normalizePhone(cleanPhone);
  }

  if (finalImages !== undefined) {
    updateData.image_urls = finalImages;
  }

  const { error } = await supabase
    .from("leads")
    .update(updateData)
    .eq("id", leadId)
    .eq("customer_id", user.id)
    .eq("status", "open");

  if (error) {
    // سباق محتمل: ردّ صنايعي وصل بين الفحص والتحديث فيرفضه حارس القاعدة —
    // نترجم رسالته بدل الخطأ العام. وكذلك تجميد الإخفاء الإداري.
    if (finalImages !== undefined) {
      await deleteLeadImages(finalImages.filter((u) => !currentImages.includes(u)));
    }
    if (error.message.includes("lead_hidden_frozen")) {
      return { success: false, error: "هذا الطلب مخفي إدارياً ولا يمكن تعديله" };
    }
    if (error.message.includes("Cannot edit lead after it has responses")) {
      return { success: false, error: "وصل رد من صنايعي أثناء التحرير — لم يعد بالإمكان تعديل الطلب" };
    }
    if (error.message.includes("Cannot edit lead unless it is open")) {
      return { success: false, error: "الطلب لم يعد مفتوحاً ولا يمكن تعديله" };
    }
    console.error("updateLeadAction:", error.message);
    return { success: false, error: "حدث خطأ أثناء تعديل الطلب، حاول مرة أخرى." };
  }

  // حذف الملفات الخارجة من المصفوفة فقط بعد نجاح التحديث.
  if (finalImages !== undefined) {
    const removed = currentImages.filter((u) => !finalImages.includes(u));
    await deleteLeadImages(removed);
  }

  revalidatePath("/profile/requests");
  return { success: true };
}

export async function cancelLeadAction(leadId: string): Promise<ClaimLeadResult> {
  if (!isUuid(leadId)) return { success: false, error: "طلب غير صالح" };

  const { supabase, user } = await getServerSession();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  // cancel_lead (RPC) يتحقق من الملكية ويقفل الطلب ويُشعِر الصنايعية الردّاء
  const { error } = await supabase.rpc("cancel_lead", { p_lead_id: leadId });

  if (error) {
    if (error.message.includes("lead_hidden_frozen")) {
      return { success: false, error: "هذا الطلب مخفي إدارياً ولا يمكن إلغاؤه" };
    }
    console.error("cancelLeadAction:", error.message);
    return { success: false, error: "لا يمكن إلغاء الطلب — قد يكون مُغلقاً بالفعل." };
  }

  revalidatePath("/profile/requests");
  revalidatePath("/dashboard/leads");
  return { success: true };
}

export async function completeLeadAction(leadId: string): Promise<ClaimLeadResult> {
  if (!isUuid(leadId)) return { success: false, error: "طلب غير صالح" };

  const { supabase, user } = await getServerSession();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const { error } = await supabase.rpc("complete_lead", {
    p_lead_id: leadId,
  });

  if (error) {
    if (error.message.includes("lead_hidden_frozen")) {
      return { success: false, error: "هذا الطلب مخفي إدارياً ولا يمكن إنجازه" };
    }
    console.error("completeLeadAction:", error.message);
    return { success: false, error: "حدث خطأ أثناء إنجاز الطلب، حاول مرة أخرى." };
  }

  revalidatePath("/profile/requests");
  revalidatePath("/dashboard/leads");
  return { success: true };
}

/** تجديد طلب منتهي: يعيده open لمدة 24 ساعة جديدة ويُشعِر الصنايعية. */
export async function renewLeadAction(leadId: string): Promise<ClaimLeadResult> {
  if (!isUuid(leadId)) return { success: false, error: "طلب غير صالح" };

  const { supabase, user } = await getServerSession();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const { error } = await supabase.rpc("renew_lead", { p_lead_id: leadId });

  if (error) {
    if (error.message.includes("lead_hidden_frozen")) {
      return { success: false, error: "هذا الطلب مخفي إدارياً ولا يمكن تجديده" };
    }
    console.error("renewLeadAction:", error.message);
    return { success: false, error: "لا يمكن تجديد الطلب — يجب أن يكون منتهياً." };
  }

  revalidatePath("/profile/requests");
  revalidatePath("/dashboard/leads");
  return { success: true };
}

/** سحب استلام الصانع: يفتح المقعد مجدداً ويُشعِر العميل. */
export async function withdrawLeadResponseAction(
  leadId: string,
): Promise<ClaimLeadResult> {
  if (!isUuid(leadId)) return { success: false, error: "طلب غير صالح" };

  const { supabase, user } = await getServerSession();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const { error } = await supabase.rpc("withdraw_lead_response", {
    p_lead_id: leadId,
  });

  if (error) {
    const reason = /^LEAD_WITHDRAW_CLOSED:\s*/.exec(error.message)?.[0];
    if (reason) {
      return { success: false, error: error.message.slice(reason.length) };
    }
    console.error("withdrawLeadResponseAction:", error.message);
    return { success: false, error: "حدث خطأ أثناء سحب الاستلام، حاول مرة أخرى." };
  }

  revalidatePath("/dashboard/leads");
  revalidatePath("/profile/requests");
  return { success: true };
}
