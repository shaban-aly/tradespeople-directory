"use server";

import { revalidatePath } from "next/cache";
import { createServerAdminClient, getServerSession } from "@/lib/db/server";
import { isUuid } from "@/lib/utils/validation";
import {
  ADMIN_LEADS_PAGE_SIZE,
  BULK_LEADS_LIMIT,
  attachHideAudit,
  attachResponseCounts,
  fetchLeadResponses,
  normalizeAdminLeadsPage,
  type AdminLeadResponseRow,
  type AdminLeadsPage,
} from "@/lib/db/admin";
import type { LeadFilter } from "@/lib/db/admin-selectors";
import { deleteLeadImages } from "@/app/actions/leads";
import { IMAGE_BUCKET } from "@/lib/storage/images";

/** عمر الملف المؤقت قبل اعتباره يتيماً — يحمي رفع `join` الجاري حالياً. */
const ORPHAN_TEMP_MAX_AGE_MS = 24 * 60 * 60 * 1000;
/** سقف عناصر المسح الواحد — دفعات بدل تحميل البكت كاملاً. */
const ORPHAN_SWEEP_LIMIT = 500;

type SessionSupabase = Awaited<ReturnType<typeof getServerSession>>["supabase"];

/** فحص صريح: الجلسة مسجلة والدور admin — يعيد عميل الجلسة. */
async function requireAdmin(): Promise<SessionSupabase> {
  const { supabase, user } = await getServerSession();
  if (!user) throw new Error("يجب تسجيل الدخول");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") {
    throw new Error("غير مصرح — لوحة المشرفين فقط");
  }
  return supabase;
}

export async function fetchLeadResponsesAction(
  leadId: string,
): Promise<AdminLeadResponseRow[]> {
  await requireAdmin();
  return fetchLeadResponses(createServerAdminClient(), leadId);
}

export type AdminLeadsPageParams = {
  filter: LeadFilter;
  page: number;
  pageSize?: number;
};

/**
 * صفحة عروض العملاء من السيرفر (ترقيم + فلترة SQL عبر get_admin_leads_page).
 * الـ RPC يتحقق من is_admin() داخلياً بجلسة المشرف — لا حاجة لـ service_role هنا.
 */
export async function fetchAdminLeadsPageAction({
  filter,
  page,
  pageSize = ADMIN_LEADS_PAGE_SIZE,
}: AdminLeadsPageParams): Promise<AdminLeadsPage> {
  const sessionClient = await requireAdmin();
  const safePage = Math.max(1, Math.floor(page) || 1);
  const { data, error } = await sessionClient.rpc("get_admin_leads_page", {
    p_search: filter.search.trim() || null,
    p_category_slug: filter.category === "all" ? null : filter.category,
    p_status: filter.status === "all" ? null : filter.status,
    p_hidden:
      filter.visibility === "all" ? null : filter.visibility === "hidden",
    p_sort: filter.sort,
    p_limit: pageSize,
    p_offset: (safePage - 1) * pageSize,
  });
  if (error) {
    console.error("fetchAdminLeadsPageAction error:", error);
    throw new Error("مقدرناش نحمّل عروض العملاء");
  }
  const withCounts = await attachResponseCounts(
    sessionClient,
    normalizeAdminLeadsPage(data),
  );
  return attachHideAudit(createServerAdminClient(), withCounts);
}

export async function adminDeleteLeadAction(leadId: string): Promise<void> {
  const sessionClient = await requireAdmin();

  // صور الطلب تُجلب أولاً (تُحذف ملفاتها بعد نجاح حذف السجل — لا أيتام).
  const admin = createServerAdminClient();
  const { data: doomed } = await admin
    .from("leads")
    .select("image_urls")
    .eq("id", leadId)
    .maybeSingle();

  // admin_delete_lead يتحقق داخلياً من is_admin() ويرسل إشعار العميل
  const { error } = await sessionClient.rpc("admin_delete_lead", {
    p_lead_id: leadId,
    p_reason: "حذف إداري من لوحة التحكم",
  });

  if (error) {
    console.error("adminDeleteLeadAction error:", error);
    throw new Error("حدث خطأ أثناء حذف الطلب، حاول مرة أخرى.");
  }

  const urls = Array.isArray(doomed?.image_urls)
    ? doomed.image_urls.filter((u): u is string => typeof u === "string")
    : [];
  if (urls.length > 0) {
    await deleteLeadImages(urls);
  }

  revalidatePath("/admin/leads");
}

export async function adminHideLeadAction(
  leadId: string,
  hidden: boolean = true,
  reason?: string,
): Promise<void> {
  const sessionClient = await requireAdmin();

  // p_reason يُمرَّر فقط عند وجوده — ليعمل الإخفاء بلا سبب حتى قبل تطبيق
  // migration 000019 حياً (التوقيع القديم بلا وسائط إضافية).
  const trimmed = reason?.trim() ? reason.trim().slice(0, 500) : "";
  const { error } = await sessionClient.rpc("admin_hide_lead", {
    p_lead_id: leadId,
    p_hidden: hidden,
    ...(trimmed ? { p_reason: trimmed } : {}),
  });

  if (error) {
    console.error("adminHideLeadAction error:", error);
    throw new Error("حدث خطأ أثناء تحديث رؤية الطلب، حاول مرة أخرى.");
  }

  revalidatePath("/admin/leads");
}

/** حذف/إخفاء/إظهار جماعي — RPC لكل عنصر على حدة (تتوقف عند أول فشل). */
export async function adminBulkLeadsAction(
  leadIds: string[],
  operation: "delete" | "hide" | "unhide",
): Promise<void> {
  if (leadIds.length === 0) return;
  if (leadIds.length > BULK_LEADS_LIMIT) {
    throw new Error(`الحد الأقصى للعملية الجماعية ${BULK_LEADS_LIMIT} طلب`);
  }
  if (!leadIds.every(isUuid)) {
    throw new Error("قائمة الطلبات تحتوي معرفات غير صالحة");
  }
  const sessionClient = await requireAdmin();

  for (const [index, leadId] of leadIds.entries()) {
    const { error } =
      operation === "delete"
        ? await sessionClient.rpc("admin_delete_lead", {
            p_lead_id: leadId,
            p_reason: "حذف إداري جماعي من لوحة التحكم",
          })
        : await sessionClient.rpc("admin_hide_lead", {
            p_lead_id: leadId,
            p_hidden: operation === "hide",
          });
    if (error) {
      console.error(`adminBulkLeadsAction (${operation}) ${leadId}:`, error);
      throw new Error(`فشلت العملية الجماعية عند العنصر رقم ${index + 1}`);
    }
  }

  revalidatePath("/admin/leads");
}

/** حذف جماعي للطلبات المنتهية (سقف BULK_LEADS_LIMIT للدفعة) — عبر
 *  admin_delete_lead لكل عنصر للحفاظ على إشعار العميل. لتنظيف التراكم. */
export async function adminDeleteExpiredLeadsAction(): Promise<void> {
  const sessionClient = await requireAdmin();
  const admin = createServerAdminClient();

  const { data: rows, error: listError } = await admin
    .from("leads")
    .select("id")
    .eq("status", "expired")
    .limit(BULK_LEADS_LIMIT);

  if (listError) {
    console.error("adminDeleteExpiredLeadsAction list error:", listError);
    throw new Error("حدث خطأ أثناء جلب الطلبات المنتهية، حاول مرة أخرى.");
  }

  for (const [index, row] of (rows ?? []).entries()) {
    // إعادة قراءة الحالة والصور لحظة الحذف: طلب تجدّد open بعد السرد
    // لا يُحذف (كان يُحذف وهو حي)، وصوره تُنظَّف معه.
    const { data: fresh } = await admin
      .from("leads")
      .select("status, image_urls")
      .eq("id", row.id)
      .maybeSingle();
    if (!fresh || fresh.status !== "expired") continue;
    const { error } = await sessionClient.rpc("admin_delete_lead", {
      p_lead_id: row.id,
      p_reason: "حذف جماعي للطلبات المنتهية من لوحة التحكم",
    });
    if (error) {
      console.error("adminDeleteExpiredLeadsAction delete error:", error);
      throw new Error(`فشلت العملية الجماعية عند العنصر رقم ${index + 1}`);
    }
    const urls = Array.isArray(fresh.image_urls)
      ? fresh.image_urls.filter((u): u is string => typeof u === "string")
      : [];
    if (urls.length > 0) await deleteLeadImages(urls);
  }

  revalidatePath("/admin/leads");
}

/**
 * معرفات كل النتائج المطابقة للفلتر (للتحديد الجماعي عبر الصفحات) —
 * تُستخدم نفس RPC الصفحة من offset صفر بسقف BULK_LEADS_LIMIT.
 */
export async function fetchAllLeadIdsAction(filter: LeadFilter): Promise<string[]> {
  const sessionClient = await requireAdmin();
  const { data, error } = await sessionClient.rpc("get_admin_leads_page", {
    p_search: filter.search.trim() || null,
    p_category_slug: filter.category === "all" ? null : filter.category,
    p_status: filter.status === "all" ? null : filter.status,
    p_hidden:
      filter.visibility === "all" ? null : filter.visibility === "hidden",
    p_sort: filter.sort,
    p_limit: BULK_LEADS_LIMIT,
    p_offset: 0,
  });
  if (error) {
    console.error("fetchAllLeadIdsAction error:", error);
    throw new Error("مقدرناش نجمّع النتائج للتحديد");
  }
  return normalizeAdminLeadsPage(data).items.map((item) => item.id);
}

/**
 * تنظيف الملفات المؤقتة اليتيمة في `requests/` (رفعٌ لم يُربط بطلب —
 * محاولة فاشلة أو جلسة أُغلقت أثناء الرفع).
 * آمن: الأقدم من 24 ساعة فقط + استثناء كل ما تشير إليه صفوف `craftsmen`
 * (صور طلبات الانضمام قيد المراجعة تُحفظ).
 */
export async function cleanupOrphanLeadUploadsAction(): Promise<{ removed: number }> {
  await requireAdmin();
  const admin = createServerAdminClient();
  const cutoff = Date.now() - ORPHAN_TEMP_MAX_AGE_MS;

  const { data: referenced } = await admin
    .from("craftsmen")
    .select("image_url")
    .like("image_url", "%/craftsman-images/requests/%")
    .limit(ORPHAN_SWEEP_LIMIT);
  const referencedPaths = new Set(
    (referenced ?? [])
      .map((r) => {
        const marker = "/craftsman-images/";
        const idx = (r.image_url ?? "").indexOf(marker);
        return idx === -1 ? null : (r.image_url as string).slice(idx + marker.length);
      })
      .filter((p): p is string => !!p),
  );

  let removed = 0;
  let offset = 0;
  for (;;) {
    const { data: objects, error } = await admin.storage
      .from(IMAGE_BUCKET)
      .list("requests", { limit: 100, offset });
    if (error || !objects || objects.length === 0) break;
    const stale = objects.filter((o) => {
      if (!o.name || o.name === ".emptyFolderPlaceholder") return false;
      const created = o.created_at ? Date.parse(o.created_at) : NaN;
      if (Number.isNaN(created) || created > cutoff) return false;
      return !referencedPaths.has(`requests/${o.name}`);
    });
    if (stale.length > 0) {
      const { error: removeError } = await admin.storage
        .from(IMAGE_BUCKET)
        .remove(stale.map((o) => `requests/${o.name}`));
      if (removeError) {
        console.error("cleanupOrphanLeadUploadsAction:", removeError.message);
        break;
      }
      removed += stale.length;
    }
    if (objects.length < 100 || removed >= ORPHAN_SWEEP_LIMIT) break;
    offset += 100;
  }

  revalidatePath("/admin/leads");
  return { removed };
}
