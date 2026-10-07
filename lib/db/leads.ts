import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * قراءات نظام الطلبات المفتوحة (leads).
 *
 * بيانات مرتبطة بالمستخدم الحالي (عبر RLS + جلسة الكوكيز)، لذلك لا تُغلّف
 * بـ unstable_cache — الكاش المشترك هنا يسرّب بيانات بين المستخدمين.
 * كل دالة ترمي خطأً عند فشل Supabase بدل إرجاع قائمة فارغة.
 */

type Client = SupabaseClient<Database>;

export type LeadStatus = "open" | "claimed" | "cancelled" | "expired" | "completed";

export type LeadResponseCraftsman = {
  id: string;
  slug: string | null;
  name: string;
  phone: string;
  whatsapp: string | null;
  verified: boolean;
  imageUrl: string | null;
  averageRating: number | null;
};

export type CustomerLead = {
  id: string;
  description: string;
  status: LeadStatus;
  /** أخفاه المشرف؟ — يُعرض للعميل كـ "موقوف من الإدارة" بدل "مفتوح". */
  hidden: boolean;
  createdAt: string;
  expiresAt: string;
  categoryName: string | null;
  areaName: string | null;
  responses: { id: string; createdAt: string; craftsman: LeadResponseCraftsman }[];
  /** صور المشكلة (اختياري — حد 3) بترتيب الرفع. */
  imageUrls: string[];
};

export type OpenLead = {
  id: string;
  description: string;
  createdAt: string;
  expiresAt: string;
  categoryId: string;
  categoryName: string | null;
  areaName: string | null;
  /** عدد الصنايعية الذين ردّوا حتى الآن (من get_open_leads_for_me) */
  responseCount: number;
  /** ملف الصانع (المملوك للمستخدم) المطابق لتخصص الطلب */
  craftsmanId: string;
  /** صور المشكلة (اختياري — حد 3) بترتيب الرفع. */
  imageUrls: string[];
};

export type ClaimedLead = {
  id: string;
  description: string;
  customerPhone: string;
  status: LeadStatus;
  claimedAt: string;
  categoryName: string | null;
  areaName: string | null;
  /** صور المشكلة (اختياري — حد 3) بترتيب الرفع. */
  imageUrls: string[];
  /**
   * ملف الصانع المستلم (من ردود المالك نفسه) — لفلترة اللوحة بالملف النشط.
   * null عند تعذّر الربط (يُعامل كنشط حتى لا تُحجب أرقام العملاء).
   */
  craftsmanId: string | null;
};

export type CraftsmanLeadsBoard =
  | { kind: "no-profile"; reason: "none" | "unpublished" }
  | { kind: "ok"; open: OpenLead[]; claimed: ClaimedLead[] };

export const MAX_LEAD_RESPONSES = 3;

/**
 * سقف طلبات العميل اليومي — يجب أن يطابق حارس القاعدة
 * (`enforce_lead_rate_limit` → رسالة `lead_rate_limited`). يُستخدم للعرض
 * فقط (تلميح الحصة)؛ الفرض الفعلي في القاعدة.
 */
export const MAX_DAILY_LEADS = 5;

/**
 * تقسيم اللوحة حسب الملف النشط: المفتوحة له فقط، والمستلمة تُفصل (ملفه
 * + غير المربوطة — تُعامل كملفه حتى لا تُحجب أرقام العملاء — مقابل
 * ملفاته الأخرى في مجموعة مطوية).
 */
export function filterBoardByCraftsman(
  board: Extract<CraftsmanLeadsBoard, { kind: "ok" }>,
  craftsmanId: string,
): {
  open: OpenLead[];
  activeClaimed: ClaimedLead[];
  otherClaimed: ClaimedLead[];
} {
  return {
    open: board.open.filter((lead) => lead.craftsmanId === craftsmanId),
    activeClaimed: board.claimed.filter(
      (lead) => lead.craftsmanId === null || lead.craftsmanId === craftsmanId,
    ),
    otherClaimed: board.claimed.filter(
      (lead) => lead.craftsmanId !== null && lead.craftsmanId !== craftsmanId,
    ),
  };
}

/**
 * عدّ المفتوحة لكل ملف (للتنبيه عن عروض الملفات الأخرى أثناء عرض ملف واحد).
 * المدخل هو `board.open` نفسها — بلا استعلامات؛ الملفات غير المنشورة
 * غائبة أصلاً لأن RPC لا يعيد لها شيئاً.
 */
export function countOpenByCraftsman(open: OpenLead[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const lead of open) {
    counts.set(lead.craftsmanId, (counts.get(lead.craftsmanId) ?? 0) + 1);
  }
  return counts;
}

/** عدد الطلبات المنشأة منذ لحظة معينة (يُستخدم لحساب حصة اليوم في الواجهة). */
export function countLeadsCreatedSince(
  leads: Pick<CustomerLead, "createdAt">[],
  since: Date,
): number {
  const sinceMs = since.getTime();
  return leads.filter((l) => new Date(l.createdAt).getTime() >= sinceMs).length;
}

/** حالات الطلبات النشطة (تظهر في تبويب "النشطة" بصفحة طلباتي). */
const ACTIVE_CUSTOMER_STATUSES: CustomerLead["status"][] = ["open", "claimed"];

/** تقسيم طلبات العميل إلى نشطة/سابقة لتبويبات صفحة طلباتي. */
export function partitionCustomerLeads(leads: CustomerLead[]): {
  active: CustomerLead[];
  past: CustomerLead[];
} {
  const active: CustomerLead[] = [];
  const past: CustomerLead[] = [];
  for (const lead of leads) {
    (ACTIVE_CUSTOMER_STATUSES.includes(lead.status) ? active : past).push(lead);
  }
  return { active, past };
}

function asStatus(value: string): LeadStatus {
  return (value === "claimed" || value === "cancelled" || value === "expired" || value === "completed")
    ? (value as LeadStatus)
    : "open";
}

/** طلبات العميل الحالي مع ردود الصنايعية وتقييماتهم.
 *
 * الردود تُجلب عبر `get_customer_lead_responses` (SECURITY DEFINER لطلبات
 * المالك وحده) — فتظهر بيانات كل من ردّ حتى لو أُلغي نشر ملفه بعد الرد،
 * بلا اعتماد على JOIN يعميه RLS. الإفصاح مضبوط: للمالك وعن الردّاء فقط.
 */
export async function getCustomerLeads(
  supabase: Client,
  userId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<CustomerLead[]> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 50);
  const offset = Math.max(opts.offset ?? 0, 0);
  const { data, error } = await supabase
    .from("leads")
    .select(
      `id, description, status, hidden, created_at, expires_at, image_urls,
       category:categories(name),
       area:areas(name)`,
    )
    .eq("customer_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`getCustomerLeads: ${error.message}`);
  const rows = data ?? [];
  const pageIds = new Set(rows.map((l) => l.id));

  const { data: responseRows, error: responsesError } = await supabase.rpc(
    "get_customer_lead_responses",
  );
  if (responsesError) {
    throw new Error(`getCustomerLeads responses: ${responsesError.message}`);
  }
  const responsesByLead = new Map<
    string,
    {
      id: string;
      createdAt: string;
      // الوسيط بلا تقييم عمداً — يُرفق لاحقاً من craftsman_rating_summaries
      craftsman: Omit<LeadResponseCraftsman, "averageRating">;
    }[]
  >();
  const craftsmanIds = new Set<string>();
  for (const r of responseRows ?? []) {
    if (!pageIds.has(r.lead_id)) continue;
    const list = responsesByLead.get(r.lead_id) ?? [];
    list.push({
      id: r.response_id,
      createdAt: r.responded_at,
      craftsman: {
        id: r.craftsman_id,
        slug: r.slug,
        name: r.name,
        phone: r.phone,
        whatsapp: r.whatsapp,
        verified: r.verified,
        imageUrl: r.image_url,
      },
    });
    craftsmanIds.add(r.craftsman_id);
    responsesByLead.set(r.lead_id, list);
  }

  const ratings = new Map<string, number | null>();
  if (craftsmanIds.size > 0) {
    const { data: summaries, error: ratingError } = await supabase
      .from("craftsman_rating_summaries")
      .select("craftsman_id, average_rating")
      .in("craftsman_id", [...craftsmanIds]);
    if (ratingError) throw new Error(`getCustomerLeads ratings: ${ratingError.message}`);
    for (const s of summaries ?? []) {
      if (s.craftsman_id) ratings.set(s.craftsman_id, s.average_rating);
    }
  }

  return rows.map((l) => ({
    id: l.id,
    description: l.description,
    status: asStatus(l.status),
    hidden: l.hidden ?? false,
    createdAt: l.created_at,
    expiresAt: l.expires_at,
    categoryName: l.category?.name ?? null,
    areaName: l.area?.name ?? null,
    imageUrls: Array.isArray(l.image_urls) ? l.image_urls : [],
    responses: (responsesByLead.get(l.id) ?? []).map((r) => ({
      ...r,
      craftsman: {
        ...r.craftsman,
        averageRating: ratings.get(r.craftsman.id) ?? null,
      },
    })),
  }));
}

/** لوحة فرص العمل للصانع: الطلبات المفتوحة في تخصصاته + ما استلمه (مع رقم العميل). */
export async function getCraftsmanLeadsBoard(
  supabase: Client,
  userId: string,
): Promise<CraftsmanLeadsBoard> {
  const { data: profiles, error: profilesError } = await supabase
    .from("craftsmen")
    .select("id, category_id, is_published")
    .eq("owner_user_id", userId)
    .eq("status", "approved");

  if (profilesError) throw new Error(`getCraftsmanLeadsBoard profiles: ${profilesError.message}`);
  if (!profiles || profiles.length === 0) return { kind: "no-profile", reason: "none" };
  const anyPublished = profiles.some((p) => p.is_published);
  if (!anyPublished) return { kind: "no-profile", reason: "unpublished" };

  const craftsmanByCategory = new Map<string, string>();
  for (const p of profiles) {
    if (!craftsmanByCategory.has(p.category_id)) craftsmanByCategory.set(p.category_id, p.id);
  }

  const [openResult, claimedResult] = await Promise.all([
    supabase.rpc("get_open_leads_for_me", { p_limit: 50, p_offset: 0 }),
    supabase.rpc("get_my_claimed_leads", { p_limit: 200, p_offset: 0 }),
  ]);

  if (openResult.error) throw new Error(`getCraftsmanLeadsBoard open: ${openResult.error.message}`);
  if (claimedResult.error) {
    throw new Error(`getCraftsmanLeadsBoard claimed: ${claimedResult.error.message}`);
  }

  // ربط كل طلب مستلم بالملف المستلم (ردود المالك فقط عبر RLS) — لفلترة
  // اللوحة بالملف النشط. إثراء عرضي: الفشل يُبقي null ولا يكسر اللوحة.
  const claimerByLead = new Map<string, string>();
  try {
    const { data: ownResponses, error: ownError } = await supabase
      .from("lead_responses")
      .select("lead_id, craftsman_id");
    if (!ownError) {
      for (const row of (ownResponses ?? []) as { lead_id: string; craftsman_id: string }[]) {
        if (row.lead_id && row.craftsman_id && !claimerByLead.has(row.lead_id)) {
          claimerByLead.set(row.lead_id, row.craftsman_id);
        }
      }
    }
  } catch {
    // يُتجاهل — craftsmanId يبقى null ويُعامل كنشط.
  }

  const claimed: ClaimedLead[] = (claimedResult.data ?? [])
    .map((r) => ({
      id: r.lead_id,
      description: r.description,
      customerPhone: r.customer_phone,
      status: asStatus(r.status),
      claimedAt: r.claimed_at,
      categoryName: r.category_name,
      areaName: r.area_name,
      imageUrls: Array.isArray(r.image_urls) ? r.image_urls : [],
      craftsmanId: claimerByLead.get(r.lead_id) ?? null,
    }))
    .sort((a, b) => b.claimedAt.localeCompare(a.claimedAt));

  const claimedIds = new Set(claimed.map((c) => c.id));

  const open: OpenLead[] = [];
  for (const l of openResult.data ?? []) {
    if (claimedIds.has(l.id)) continue;
    const craftsmanId = craftsmanByCategory.get(l.category_id);
    if (!craftsmanId) continue;
    open.push({
      id: l.id,
      description: l.description,
      createdAt: l.created_at,
      expiresAt: l.expires_at,
      categoryId: l.category_id,
      categoryName: l.category_name ?? null,
      areaName: l.area_name ?? null,
      responseCount: l.response_count ?? 0,
      craftsmanId,
      imageUrls: Array.isArray(l.image_urls) ? l.image_urls : [],
    });
  }

  return { kind: "ok", open, claimed };
}
