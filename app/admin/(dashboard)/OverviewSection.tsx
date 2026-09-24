"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { AdminButtonLink } from "@/components/admin/ui/AdminButton";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { ActionCounters } from "@/components/admin/overview/ActionCounters";
import { AnalyticsStats } from "@/components/admin/overview/AnalyticsStats";
import { CategoryChart } from "@/components/admin/overview/CategoryChart";
import { MostContactedList } from "@/components/admin/overview/MostContactedList";
import { PendingReportsList } from "@/components/admin/overview/PendingReportsList";
import { PendingRequestsList } from "@/components/admin/overview/PendingRequestsList";
import { RecentCraftsmenList } from "@/components/admin/overview/RecentCraftsmenList";
import { SecondaryStats } from "@/components/admin/overview/SecondaryStats";
import {
  useAdminOverview,
  type AdminOverviewData,
} from "@/hooks/admin/useAdminOverview";
import type { OverviewMetrics } from "@/lib/db/admin-selectors";
import { useAnalytics } from "@/hooks/admin/useAnalytics";
import { useGA4Summary } from "@/hooks/admin/useGA4Summary";
import { useToast } from "@/hooks/ui/useToast";
import type { AnalyticsOverview } from "@/lib/db/analytics";
import { ActivityFeed, type Timeframe } from "@/components/admin/ActivityFeed";
import { OverviewTrafficBanner } from "@/components/admin/overview/OverviewTrafficBanner";
import type { ActivityFeedItem } from "@/lib/db/admin";

type OverviewTab = "summary" | "analytics" | "manage";

const OVERVIEW_TABS: { value: OverviewTab; label: string }[] = [
  { value: "summary", label: "الملخص" },
  { value: "analytics", label: "الإحصائيات" },
  { value: "manage", label: "الإدارة" },
];

function OverviewTabs({
  active,
  onChange,
}: {
  active: OverviewTab;
  onChange: (value: OverviewTab) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border" role="tablist">
      {OVERVIEW_TABS.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={`min-h-12 shrink-0 border-b-2 px-4 py-2 text-base font-bold transition-colors ${
              isActive
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

const linkActionClass = "w-full sm:w-auto";

export function OverviewSection({
  initialData,
  initialAnalytics,
  activityFeed,
  timeframe = "today",
}: {
  initialData: AdminOverviewData | OverviewMetrics;
  initialAnalytics: AnalyticsOverview;
  activityFeed?: ActivityFeedItem[];
  timeframe?: Timeframe;
}) {
  const { toast } = useToast();
  const {
    metrics,
    loading,
    error,
    busyKey,
    approveRequest,
    rejectRequest,
    reviewReport,
    dismissReport,
    refresh,
  } = useAdminOverview(initialData);

  const {
    overview: analytics,
    loading: analyticsLoading,
    error: analyticsError,
  } = useAnalytics(initialAnalytics);

  const {
    data: ga4Data,
    loading: ga4Loading,
  } = useGA4Summary();

  const [tab, setTab] = useState<OverviewTab>("summary");

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

      <ActionCounters metrics={metrics} />

      <OverviewTabs active={tab} onChange={setTab} />

      {tab === "summary" && (
        <div className="grid gap-4 sm:gap-6">
          <OverviewTrafficBanner
            ga4={ga4Data}
            ga4Loading={ga4Loading}
            viewsToday={analytics?.viewsToday ?? 0}
            callsToday={analytics?.callsToday ?? 0}
            whatsappToday={analytics?.whatsappToday ?? 0}
          />
          <ActivityFeed items={activityFeed} timeframe={timeframe} />

          <section className="grid gap-4 lg:grid-cols-2">
            <PendingRequestsList
              requests={metrics.pendingRequests}
              busyKey={busyKey}
              onApprove={(request) => void approveRequest(request)}
              onReject={(requestId) => void rejectRequest(requestId)}
              action={
                <AdminButtonLink
                  href="/admin/requests"
                  variant="accentLink"
                  className={linkActionClass}
                >
                  الكل
                </AdminButtonLink>
              }
            />
            <PendingReportsList
              reports={metrics.pendingReports}
              busyKey={busyKey}
              onReview={(report) => void reviewReport(report)}
              onDismiss={(reportId) => void dismissReport(reportId)}
              action={
                <AdminButtonLink
                  href="/admin/reports"
                  variant="accentLink"
                  className={linkActionClass}
                >
                  الكل
                </AdminButtonLink>
              }
            />
          </section>

          <SecondaryStats metrics={metrics} />
        </div>
      )}

      {tab === "analytics" && (
        <AnalyticsStats
          analytics={analytics}
          loading={analyticsLoading}
          error={analyticsError}
          totals={{
            calls: metrics.totalCalls,
            whatsapp: metrics.totalWhatsapp,
            views: metrics.totalViews,
          }}
          ga4={ga4Data}
          ga4Loading={ga4Loading}
        />
      )}

      {tab === "manage" && (
        <div className="grid gap-4 sm:gap-6">
          <CategoryChart
            items={metrics.categoryChart}
            maxCount={metrics.maxCount}
          />
          <MostContactedList items={metrics.mostContacted} />
          <RecentCraftsmenList craftsmen={metrics.recentCraftsmen} />
        </div>
      )}
    </div>
  );
}
