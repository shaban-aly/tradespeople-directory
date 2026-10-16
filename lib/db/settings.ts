import { unstable_cache } from "next/cache";
import { createServerReadClient } from "./client";

export interface AdminPhoneNumber {
  id: string;
  phone: string;
  label?: string;
  active: boolean;
}

export interface ContactRoutingSettings {
  enabled: boolean;
  admin_numbers: AdminPhoneNumber[];
  whatsapp_admin_template: string;
  whatsapp_direct_template: string;
}

export const DEFAULT_WHATSAPP_ADMIN_TEMPLATE =
  'السلام عليكم، بتواصل بخصوص الفني "{craftsman_name}" ({category_name}) المعروض على دليل الصنايعية بالسويس ومحتاج مساعدة في شغل.';

export const DEFAULT_WHATSAPP_DIRECT_TEMPLATE =
  'السلام عليكم يا {craftsman_name}، شفت بياناتك على دليل الصنايعية بالسويس ومحتاج استفسر عن شغل {category_name}.';

export const DEFAULT_ADMIN_NUMBERS: AdminPhoneNumber[] = [
  {
    id: "admin-1",
    phone: "+201019979315",
    label: "خط الإدارة 1",
    active: true,
  },
  {
    id: "admin-2",
    phone: "+201069582453",
    label: "خط الإدارة 2",
    active: true,
  },
];

export const DEFAULT_CONTACT_ROUTING: ContactRoutingSettings = {
  enabled: false,
  admin_numbers: DEFAULT_ADMIN_NUMBERS,
  whatsapp_admin_template: DEFAULT_WHATSAPP_ADMIN_TEMPLATE,
  whatsapp_direct_template: DEFAULT_WHATSAPP_DIRECT_TEMPLATE,
};

export const SETTINGS_CACHE_TAG = "site_settings";

/**
 * دالة تعويض المتغيرات الذكية داخل قالب رسالة الواتساب:
 * تدعم المتغيرات باللغتين:
 * {craftsman_name} أو {اسم_الفني}
 * {category_name} أو {التخصص}
 */
export function renderWhatsappTemplate(
  template: string | undefined | null,
  vars: { craftsmanName?: string; categoryName?: string },
): string {
  const base = template && template.trim() ? template : DEFAULT_WHATSAPP_ADMIN_TEMPLATE;
  const cName = (vars.craftsmanName || "").trim();
  const catName = (vars.categoryName || "").trim();

  return base
    .replace(/\{craftsman_name\}|\{اسم_الفني\}/g, cName)
    .replace(/\{category_name\}|\{التخصص\}/g, catName);
}

/**
 * جلب إعدادات تحويل الاتصالات والرسائل المركزية من الجدول المتحكم الرئيسي:
 * 1) site_settings: المتحكم الأساسي ومؤشر التوجيه والقوالب بأعمدة صريحة
 * 2) admin_contact_numbers: أرقام هواتف الإدارة التابعة له مع أسمائها وحالة نشاطها وترتيبها
 */
async function getContactRoutingSettingsImpl(): Promise<ContactRoutingSettings> {
  try {
    const client = createServerReadClient();

    const [settingsRes, numbersRes] = await Promise.all([
      client
        .from("site_settings")
        .select("is_routing_enabled, whatsapp_admin_template, whatsapp_direct_template")
        .eq("id", 1)
        .maybeSingle(),
      client
        .from("admin_contact_numbers")
        .select("id, phone, label, is_active, display_order")
        .order("display_order", { ascending: true }),
    ]);

    const settingsData = settingsRes.data;
    const numbersData = numbersRes.data;

    let numbers: AdminPhoneNumber[] = [];
    if (numbersData && numbersData.length > 0) {
      numbers = numbersData.map((row) => ({
        id: row.id,
        phone: row.phone,
        label: row.label || "خط الإدارة",
        active: row.is_active,
      }));
    } else {
      numbers = DEFAULT_ADMIN_NUMBERS;
    }

    return {
      enabled: settingsData ? Boolean(settingsData.is_routing_enabled) : false,
      admin_numbers: numbers,
      whatsapp_admin_template:
        settingsData?.whatsapp_admin_template?.trim() ||
        DEFAULT_WHATSAPP_ADMIN_TEMPLATE,
      whatsapp_direct_template:
        settingsData?.whatsapp_direct_template?.trim() ||
        DEFAULT_WHATSAPP_DIRECT_TEMPLATE,
    };
  } catch {
    return DEFAULT_CONTACT_ROUTING;
  }
}

export const getContactRoutingSettings = unstable_cache(
  getContactRoutingSettingsImpl,
  ["contact-routing-settings"],
  {
    tags: [SETTINGS_CACHE_TAG],
    revalidate: 300,
  },
);

/**
 * خوارزمية التوزيع العادل والمستقر (Deterministic Load Balancing) على أي عدد N من أرقام الإدارة المفعلة.
 *
 * المزايا:
 * 1. تقسيم متطابق بنسب متساوية (100% / N) على كل الخطوط النشطة.
 * 2. الصانع الواحد يذهب اتصاله ورسالته دائماً لنفس الرقم لضمان عدم تشتيت العميل.
 */
export function resolveAdminContactForCraftsman(
  craftsmanKey: string | undefined | null,
  settings: ContactRoutingSettings,
): { phone: string; whatsapp: string; slot: number; label: string } {
  const activeNumbers = (settings.admin_numbers || []).filter(
    (n) => n.active && n.phone && n.phone.trim().length > 0,
  );

  const fallback = activeNumbers[0] || DEFAULT_ADMIN_NUMBERS[0];

  if (!craftsmanKey || activeNumbers.length <= 1) {
    return {
      phone: fallback.phone,
      whatsapp: fallback.phone,
      slot: 1,
      label: fallback.label || "خط الإدارة 1",
    };
  }

  let hash = 0;
  for (let i = 0; i < craftsmanKey.length; i++) {
    hash = (hash + craftsmanKey.charCodeAt(i) * (i + 1)) % 10007;
  }

  const index = Math.abs(hash) % activeNumbers.length;
  const chosen = activeNumbers[index];

  return {
    phone: chosen.phone,
    whatsapp: chosen.phone,
    slot: index + 1,
    label: chosen.label || `خط الإدارة ${index + 1}`,
  };
}
