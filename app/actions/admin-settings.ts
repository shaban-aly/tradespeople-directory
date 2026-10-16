"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getServerSession, createServerAdminClient } from "@/lib/db/server";
import {
  type ContactRoutingSettings,
  type AdminPhoneNumber,
  SETTINGS_CACHE_TAG,
  DEFAULT_WHATSAPP_ADMIN_TEMPLATE,
  DEFAULT_WHATSAPP_DIRECT_TEMPLATE,
  DEFAULT_ADMIN_NUMBERS,
} from "@/lib/db/settings";

export async function updateContactRoutingAction(payload: {
  enabled: boolean;
  admin_numbers: AdminPhoneNumber[];
  whatsapp_admin_template: string;
  whatsapp_direct_template: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, supabase } = await getServerSession();
    if (!user) {
      return { success: false, error: "يجب تسجيل الدخول كمسؤول أولاً" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { success: false, error: "ليس لديك صلاحية تعديل الإعدادات" };
    }

    // تنظيف والتحقق من أرقام الإدارة
    const cleanedNumbers: AdminPhoneNumber[] = (payload.admin_numbers || [])
      .map((item, idx) => ({
        id: item.id || `admin-${idx + 1}`,
        phone: (item.phone || "").trim(),
        label: (item.label || "").trim() || `خط الإدارة ${idx + 1}`,
        active: Boolean(item.active),
      }))
      .filter((item) => item.phone.length > 0);

    if (cleanedNumbers.length === 0) {
      return {
        success: false,
        error: "يجب إضافة رقم هاتف واحد على الأقل للإدارة",
      };
    }

    const activeCount = cleanedNumbers.filter((n) => n.active).length;
    if (payload.enabled && activeCount === 0) {
      return {
        success: false,
        error: "لا يمكن تفعيل التحويل بدون وجود رقم إدارة نشط واحد على الأقل",
      };
    }

    const cleanedPayload: ContactRoutingSettings = {
      enabled: Boolean(payload.enabled),
      admin_numbers: cleanedNumbers.length > 0 ? cleanedNumbers : DEFAULT_ADMIN_NUMBERS,
      whatsapp_admin_template:
        payload.whatsapp_admin_template?.trim() || DEFAULT_WHATSAPP_ADMIN_TEMPLATE,
      whatsapp_direct_template:
        payload.whatsapp_direct_template?.trim() || DEFAULT_WHATSAPP_DIRECT_TEMPLATE,
    };

    const adminClient = createServerAdminClient();

    // 1. تحديث جدول إعدادات الموقع المتحكم الرئيسي (site_settings)
    const { error: settingsError } = await adminClient
      .from("site_settings")
      .upsert(
        {
          id: 1,
          is_routing_enabled: Boolean(payload.enabled),
          whatsapp_admin_template:
            payload.whatsapp_admin_template?.trim() ||
            DEFAULT_WHATSAPP_ADMIN_TEMPLATE,
          whatsapp_direct_template:
            payload.whatsapp_direct_template?.trim() ||
            DEFAULT_WHATSAPP_DIRECT_TEMPLATE,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

    if (settingsError) {
      console.error("[settings] Upsert site_settings error:", settingsError);
      return { success: false, error: "فشل حفظ إعدادات الموقع في قاعدة البيانات" };
    }

    // 2. مزامنة جدول أرقام هواتف الإدارة التابع له (admin_contact_numbers)
    const rowsToInsert = cleanedNumbers.map((item, idx) => {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          item.id,
        );
      return {
        ...(isUuid ? { id: item.id } : {}),
        setting_id: 1,
        phone: item.phone,
        label: item.label || `خط الإدارة ${idx + 1}`,
        is_active: item.active,
        display_order: idx + 1,
        updated_at: new Date().toISOString(),
      };
    });

    // حذف الأرقام التي أزالها المشرف تماماً من القائمة
    const currentUuids = cleanedNumbers
      .map((n) => n.id)
      .filter((id) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
      );

    if (currentUuids.length > 0) {
      await adminClient
        .from("admin_contact_numbers")
        .delete()
        .not("id", "in", `(${currentUuids.join(",")})`);
    }

    const { error: upsertError } = await adminClient
      .from("admin_contact_numbers")
      .upsert(rowsToInsert);

    if (upsertError) {
      console.error("[settings] Upsert admin_contact_numbers error:", upsertError);
      return { success: false, error: "فشل حفظ أرقام الإدارة في قاعدة البيانات" };
    }

    // 3. إبطال كاش إعدادات التوجيه فقط دون إبطال كاش الصنايعية
    // كاش الفنيين والتقييمات يظل سليماً 100% دون أي حمل على قاعدة البيانات
    revalidateTag(SETTINGS_CACHE_TAG, {});
    revalidatePath("/admin/settings");

    return { success: true };
  } catch (err: unknown) {
    console.error("[settings] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء الحفظ",
    };
  }
}

export async function toggleAdminNumberAction(
  id: string,
  active: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, supabase } = await getServerSession();
    if (!user) {
      return { success: false, error: "يجب تسجيل الدخول كمسؤول أولاً" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { success: false, error: "ليس لديك صلاحية تعديل الإعدادات" };
    }

    const adminClient = createServerAdminClient();

    // فحص أمني: لو التوجيه مفعل، نمنع تعطيل آخر خط نشط متبقي
    if (!active) {
      const [settingsRes, numbersRes] = await Promise.all([
        adminClient
          .from("site_settings")
          .select("is_routing_enabled")
          .eq("id", 1)
          .maybeSingle(),
        adminClient
          .from("admin_contact_numbers")
          .select("id, is_active")
          .eq("is_active", true),
      ]);

      const isRoutingEnabled = settingsRes.data?.is_routing_enabled ?? false;
      const activeNumbers = numbersRes.data ?? [];
      const remainingActive = activeNumbers.filter((n) => n.id !== id);

      if (isRoutingEnabled && remainingActive.length === 0) {
        return {
          success: false,
          error: "لا يمكن تعطيل هذا الخط لأن التحويل مفعل ويجب وجود خط نشط واحد على الأقل",
        };
      }
    }

    const { error } = await adminClient
      .from("admin_contact_numbers")
      .update({
        is_active: active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("[settings] toggleAdminNumber error:", error);
      return { success: false, error: "فشل حفظ حالة الخط في قاعدة البيانات" };
    }

    // إبطال كاش الإعدادات فقط
    revalidateTag(SETTINGS_CACHE_TAG, {});
    revalidatePath("/admin/settings");

    return { success: true };
  } catch (err: unknown) {
    console.error("[settings] toggleAdminNumber unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}
