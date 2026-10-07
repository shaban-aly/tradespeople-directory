import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import { getCustomerLeads } from "@/lib/db/leads";
import { Zap } from "lucide-react";
import { CustomerLeadsTabs } from "@/components/leads/CustomerLeadsTabs";
import { ButtonLink } from "@/components/shared/ui/Button";
import { PageTitleRow } from "@/components/shared/ui/PageTitleRow";
import { LeadsRealtimeBridge } from "@/components/leads/LeadsRealtimeBridge";
import { EmptyState } from "@/components/shared/ui/EmptyState";

export const metadata = { title: "طلباتي | دليل الصنايعية" };

export default async function CustomerRequestsPage() {
  const { supabase, user } = await getServerSession();

  if (!user) redirect("/login");

  const [leads] = await Promise.all([
    getCustomerLeads(supabase, user.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <LeadsRealtimeBridge />
      <div className="mb-6">
        <PageTitleRow
          title="طلباتي"
          backFallback="/profile"
          backLabel="رجوع لحسابي"
          action={
            <ButtonLink
              href="/request/new"
              variant="primary"
              size="sm"
              className="shadow-md shadow-accent/20 hover:shadow-lg"
            >
              طلب جديد
            </ButtonLink>
          }
        />
      </div>

      <div className="space-y-6">
        {leads.length === 0 ? (
          <EmptyState
            icon={<Zap className="h-6 w-6" />}
            title="لم تقم بإضافة أي طلبات بعد"
            description="سجّل طلبك الآن ودع الصنايعية يتنافسون — أول 3 يوافقون تظهر بياناتهم لك مباشرة."
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
