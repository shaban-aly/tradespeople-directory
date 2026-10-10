import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import { getCustomerLeads } from "@/lib/db/leads";
import { Zap, Plus } from "lucide-react";
import { CustomerLeadsTabs } from "@/components/leads/CustomerLeadsTabs";
import { ButtonLink } from "@/components/shared/ui/Button";
import { PageTitleRow } from "@/components/shared/ui/PageTitleRow";
import { LeadsRealtimeBridge } from "@/components/leads/LeadsRealtimeBridge";
import { EmptyState } from "@/components/shared/ui/EmptyState";

export const metadata = {
  title: "طلباتي | دليل الصنايعية",
  description: "متابعة طلبات الصيانة والتواصل المباشر مع أول 3 فنيين يستجيبون لطلبك في السويس.",
  robots: { index: false, follow: false },
};

export default async function CustomerRequestsPage() {
  const { supabase, user } = await getServerSession();

  if (!user) redirect("/login?reason=requests&next=/my-requests");

  const [leads] = await Promise.all([
    getCustomerLeads(supabase, user.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-10">
      <LeadsRealtimeBridge />

      {/* سطر العنوان مع زر الإجراء الرئيسي ومسار الرجوع */}
      <div className="mb-6 sm:mb-8">
        <PageTitleRow
          title="طلباتي"
          description="متابعة عروض الفنيين والتواصل المباشر مع أول 3 صنايعية يوافقون على طلبك"
          backFallback="/"
          backLabel="رجوع للرئيسية"
          action={
            <ButtonLink
              href="/request/new"
              variant="primary"
              size="sm"
              className="shadow-sm hover:shadow-md"
            >
              <span className="flex items-center gap-1.5">
                <Plus className="h-4 w-4" />
                <span>طلب جديد</span>
              </span>
            </ButtonLink>
          }
        />
      </div>

      <div className="space-y-6">
        {leads.length === 0 ? (
          <EmptyState
            icon={<Zap className="h-6 w-6 text-accent" />}
            title="لم تقم بإضافة أي طلبات بعد"
            description="سجّل طلبك الآن ودع الصنايعية يتنافسون — أول 3 فنيين يوافقون تظهر أرقامهم وبياناتهم لك فوراً للتواصل المباشر."
            action={
              <ButtonLink href="/request/new" variant="primary">
                سجل طلبك وانتظر مكالمة من الصنايعي
              </ButtonLink>
            }
          />
        ) : (
          <CustomerLeadsTabs
            leads={leads}
            emptyActiveAction={
              <ButtonLink href="/request/new" variant="primary" size="sm">
                طلب جديد
              </ButtonLink>
            }
          />
        )}
      </div>
    </div>
  );
}
