import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import {
  MAX_DAILY_LEADS,
  countLeadsCreatedSince,
  getCustomerLeads,
} from "@/lib/db/leads";
import { getCategoriesList, getAreasList } from "@/lib/db/queries";
import { LeadRequestForm } from "@/components/leads/LeadRequestForm";
import { LeadTrustBanner } from "@/components/leads/LeadTrustBanner";
import { PageTitleRow } from "@/components/shared/ui/PageTitleRow";
import { ButtonLink } from "@/components/shared/ui/Button";
import { toArabicDigits } from "@/lib/utils/format";

export const metadata = { title: "طلب فني معتمد | دليل الصنايعية" };

/**
 * صفحة إنشاء طلب — الرابط الوحيد والمشارَك (`/request/new`).
 * نفس السلوك في كل مكان: غير المسجل يُحوَّل للدخول مع عودة، والفني/
 * المشرف يرى تنبيهاً (الطلبات لحسابات العملاء فقط) بدل زر مخفي بصمت.
 */
export default async function NewLeadRequestPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; area?: string }>;
}) {
  const { supabase, user } = await getServerSession();

  if (!user) redirect("/login?reason=request-lead&next=/request/new");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile && (profile.role === "craftsman" || profile.role === "admin")) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <h1 className="font-heading text-xl font-bold">طلبات الخدمة لحسابات العملاء فقط</h1>
          <p className="mt-2 text-sm text-muted">
            حسابك الحالي {profile.role === "craftsman" ? "فني" : "مشرف"} — لطلب خدمة سجّل دخولك بحساب عميل.
          </p>
          <div className="mx-auto mt-6 flex flex-col sm:flex-row gap-2.5 max-w-xs">
            <ButtonLink href="/dashboard/leads" variant="primary" className="w-full">
              عروض العملاء
            </ButtonLink>
            <ButtonLink href="/" variant="outline" className="w-full">
              الرئيسية
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  const [leads, categories, areas, queryParams] = await Promise.all([
    getCustomerLeads(supabase, user.id),
    getCategoriesList(),
    getAreasList(),
    searchParams ? searchParams : Promise.resolve({} as { category?: string; area?: string }),
  ]);

  const categoryParam = queryParams.category ? decodeURIComponent(queryParams.category) : undefined;
  const areaParam = queryParams.area ? decodeURIComponent(queryParams.area) : undefined;

  let initialCategoryId: string | undefined;
  if (categoryParam) {
    const matchedCategory = categories.find(
      (c) => c.slug === categoryParam || c.id === categoryParam || c.name === categoryParam,
    );
    if (matchedCategory) initialCategoryId = matchedCategory.id;
  }

  let initialAreaId: string | undefined;
  if (areaParam) {
    const matchedArea = areas.find(
      (a) => a.name === areaParam || a.id === areaParam,
    );
    if (matchedArea) initialAreaId = matchedArea.id;
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const remainingToday = Math.max(
    0,
    MAX_DAILY_LEADS - countLeadsCreatedSince(leads, startOfToday),
  );
  const quotaText = `متبقي لك ${toArabicDigits(remainingToday)} من ${toArabicDigits(MAX_DAILY_LEADS)} طلبات اليوم`;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 space-y-6">
      <div>
        <PageTitleRow
          title="اطلب صنايعي معتمد"
          description="صف مشكلتك وسنرسل طلبك فوراً للمتخصصين في منطقتك للتواصل معك والتسعير المباشر."
          backFallback="/my-requests"
          backLabel="رجوع لطلباتي"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-card">
        <LeadRequestForm
          categories={categories}
          areas={areas}
          quotaText={quotaText}
          initialValues={{
            categoryId: initialCategoryId,
            areaId: initialAreaId,
          }}
        />
      </div>

      <LeadTrustBanner />
    </div>
  );
}
