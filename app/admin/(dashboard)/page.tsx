"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { AnalyticsStats } from "@/components/admin/overview/AnalyticsStats";
import { CategoryChart } from "@/components/admin/overview/CategoryChart";
import { MostContactedList } from "@/components/admin/overview/MostContactedList";
import { OverviewKPIs } from "@/components/admin/overview/OverviewKPIs";
import { PendingRequestsList } from "@/components/admin/overview/PendingRequestsList";
import { RecentCraftsmenList } from "@/components/admin/overview/RecentCraftsmenList";
import { useAdminOverview } from "@/hooks/admin/useAdminOverview";
import { useAnalytics } from "@/hooks/admin/useAnalytics";
import { useToast } from "@/hooks/ui/useToast";

export default function OverviewPage() {
  const { toast } = useToast();
  const {
    metrics,
    loading,
    error,
    busyKey,
    approveRequest,
    rejectRequest,
    refresh,
  } = useAdminOverview();

  const {
    overview: analytics,
    loading: analyticsLoading,
    error: analyticsError,
  } = useAnalytics();

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  if (loading || !metrics) return <DashboardLoading />;

  return (
    <div className="grid gap-4 sm:gap-6">
      <PageHeader
        title="نظرة عامة"
        description="ملخص سريع لحالة الدليل اليوم."
        actions={<RefreshButton onRefresh={() => void refresh()} />}
      />

      <OverviewKPIs metrics={metrics} />

      <AnalyticsStats
        analytics={analytics}
        loading={analyticsLoading}
        error={analyticsError}
        totals={{
          calls: metrics.totalCalls,
          whatsapp: metrics.totalWhatsapp,
          views: metrics.totalViews,
        }}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <PendingRequestsList
          requests={metrics.pendingRequests}
          busyKey={busyKey}
          onApprove={(request) => void approveRequest(request)}
          onReject={(requestId) => void rejectRequest(requestId)}
          action={
            <Link
              href="/admin/requests"
              className="flex min-h-12 w-full items-center justify-center rounded-xl border border-border px-4 text-base font-bold text-accent transition-colors hover:bg-accent/10 sm:w-auto"
            >
              الكل
            </Link>
          }
        />
        <CategoryChart
          items={metrics.categoryChart}
          maxCount={metrics.maxCount}
        />
      </section>

      <MostContactedList items={metrics.mostContacted} />

      <RecentCraftsmenList craftsmen={metrics.recentCraftsmen} />
    </div>
  );
}
