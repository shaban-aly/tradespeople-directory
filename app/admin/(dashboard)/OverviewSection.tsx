"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ApproveRequestModal } from "@/components/admin/requests/ApproveRequestModal";
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
import type { ActivityFeedItem, JoinRequestRow, ReportRow } from "@/lib/db/admin";

import { OverviewTabs, type OverviewTab } from "@/components/admin/overview/OverviewTabs";

const linkActionClass = "w-full sm:w-auto";

export function OverviewSection({
  initialData,
  initialAnalytics,
  activityFeed,
  timeframe = "today",
  initialTab = "summary",
}: {
  initialData: AdminOverviewData | OverviewMetrics;
  initialAnalytics: AnalyticsOverview;
  activityFeed?: ActivityFeedItem[];
  timeframe?: Timeframe;
  initialTab?: OverviewTab;
}) {
  const pathname = usePathname();
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

  const [tab, setTab] = useState<OverviewTab>(initialTab);
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>(timeframe);

  // Targets for dialog safety
  const [approveRequestTarget, setApproveRequestTarget] = useState<JoinRequestRow | null>(null);
  const [rejectRequestTarget, setRejectRequestTarget] = useState<JoinRequestRow | null>(null);
  const [dismissReportTarget, setDismissReportTarget] = useState<ReportRow | null>(null);

  // Sync state ONLY if server props change (e.g. from server actions / revalidations)
  const [lastInitialTab, setLastInitialTab] = useState(initialTab);
  if (initialTab !== lastInitialTab) {
    setLastInitialTab(initialTab);
    setTab(initialTab);
  }

  const [lastTimeframe, setLastTimeframe] = useState(timeframe);
  if (timeframe !== lastTimeframe) {
    setLastTimeframe(timeframe);
    setActiveTimeframe(timeframe);
  }

  // Support browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const sp = new URLSearchParams(window.location.search);
      const urlTab = sp.get("tab");
      const urlTimeframe = sp.get("timeframe");
      if (urlTab === "analytics" || urlTab === "manage" || urlTab === "summary") {
        setTab(urlTab);
      } else {
        setTab("summary");
      }
      if (urlTimeframe === "today" || urlTimeframe === "week" || urlTimeframe === "month") {
        setActiveTimeframe(urlTimeframe);
      } else {
        setActiveTimeframe("today");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  const updateUrl = useCallback(
    (nextTab: OverviewTab, nextTimeframe: Timeframe) => {
      if (typeof window === "undefined") return;
      const sp = new URLSearchParams(window.location.search);
      if (nextTab === "summary") {
        sp.delete("tab");
      } else {
        sp.set("tab", nextTab);
      }
      if (nextTimeframe === "today") {
        sp.delete("timeframe");
      } else {
        sp.set("timeframe", nextTimeframe);
      }
      const qs = sp.toString();
      const targetUrl = `${pathname}${qs ? `?${qs}` : ""}`;
      window.history.replaceState(null, "", targetUrl);
    },
    [pathname],
  );

  const handleTabChange = (nextTab: OverviewTab) => {
    setTab(nextTab);
    updateUrl(nextTab, activeTimeframe);
  };

  const handleTimeframeChange = (nextTimeframe: Timeframe) => {
    setActiveTimeframe(nextTimeframe);
    updateUrl(tab, nextTimeframe);
  };

  const handleConfirmApproveRequest = async () => {
    if (!approveRequestTarget) return;
    const ok = await approveRequest(approveRequestTarget);
    if (ok) {
      toast("success", `تمت الموافقة ونشر "${approveRequestTarget.name}" في الدليل بنجاح`);
      setApproveRequestTarget(null);
    }
  };

  const handleConfirmRejectRequest = async () => {
    if (!rejectRequestTarget) return;
    const ok = await rejectRequest(rejectRequestTarget.id);
    if (ok) {
      toast("success", `تم رفض طلب "${rejectRequestTarget.name}" بنجاح`);
      setRejectRequestTarget(null);
    }
  };

  const handleConfirmDismissReport = async () => {
    if (!dismissReportTarget) return;
    const ok = await dismissReport(dismissReportTarget.id);
    if (ok) {
      toast("success", "تم إغلاق البلاغ بنجاح");
      setDismissReportTarget(null);
    }
  };

  const handleReviewReport = async (report: ReportRow) => {
    const ok = await reviewReport(report);
    if (ok) {
      toast("success", "تمت مراجعة البلاغ وتحديث حالته");
    }
  };

  if (loading || !metrics) return <DashboardLoading />;

  return (
    <div className="grid gap-3 sm:gap-6">
      <PageHeader
        title="نظرة عامة"
        description="لوحة القيادة المركزية ومتابعة التفاعلات الحية وحالة الدليل اليومية."
        actions={<RefreshButton onRefresh={() => void refresh()} />}
      />

      <ActionCounters metrics={metrics} />

      <OverviewTabs active={tab} onChange={handleTabChange} />

      {tab === "summary" && (
        <div
          id="panel-summary"
          role="tabpanel"
          aria-labelledby="tab-summary"
          className="grid gap-3 sm:gap-6"
        >
          <OverviewTrafficBanner
            ga4={ga4Data}
            ga4Loading={ga4Loading}
            viewsToday={analytics?.viewsToday ?? 0}
            callsToday={analytics?.callsToday ?? 0}
            whatsappToday={analytics?.whatsappToday ?? 0}
          />

          {/* كتل المهام الإجرائية المستعجلة — تسبق سجل التفاعلات لتقليل مسافة التمرير */}
          <section className="grid gap-3 sm:gap-4 lg:grid-cols-2">
            <PendingRequestsList
              requests={metrics.pendingRequests}
              busyKey={busyKey}
              onApprove={(request) => setApproveRequestTarget(request)}
              onReject={(request) => setRejectRequestTarget(request)}
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
              onReview={(report) => void handleReviewReport(report)}
              onDismiss={(report) => setDismissReportTarget(report)}
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

          <ActivityFeed
            items={activityFeed}
            timeframe={activeTimeframe}
            onTimeframeChange={handleTimeframeChange}
          />

          <SecondaryStats metrics={metrics} />
        </div>
      )}

      {tab === "analytics" && (
        <div
          id="panel-analytics"
          role="tabpanel"
          aria-labelledby="tab-analytics"
        >
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
        </div>
      )}

      {tab === "manage" && (
        <div
          id="panel-manage"
          role="tabpanel"
          aria-labelledby="tab-manage"
          className="grid gap-4 sm:gap-6"
        >
          <CategoryChart
            items={metrics.categoryChart}
            maxCount={metrics.maxCount}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <MostContactedList items={metrics.mostContacted} />
            <RecentCraftsmenList craftsmen={metrics.recentCraftsmen} />
          </div>
        </div>
      )}

      {/* حوارات التأكيد والحماية — لمنع الإجراءات العرضية غير القابلة للتراجع */}
      <ApproveRequestModal
        request={approveRequestTarget}
        open={approveRequestTarget !== null}
        busy={busyKey === `approve-${approveRequestTarget?.id}`}
        onConfirm={() => void handleConfirmApproveRequest()}
        onClose={() => setApproveRequestTarget(null)}
      />

      <ConfirmDialog
        open={rejectRequestTarget !== null}
        onClose={() => setRejectRequestTarget(null)}
        onConfirm={() => void handleConfirmRejectRequest()}
        title="رفض طلب التسجيل"
        message={`هل أنت متأكد من رفض طلب تسجيل "${rejectRequestTarget?.name}"؟ لا يمكن التراجع عن هذا القرار.`}
        confirmLabel="رفض الطلب"
        danger
        busy={busyKey === `reject-${rejectRequestTarget?.id}`}
      />

      <ConfirmDialog
        open={dismissReportTarget !== null}
        onClose={() => setDismissReportTarget(null)}
        onConfirm={() => void handleConfirmDismissReport()}
        title="إغلاق وتجاهل البلاغ"
        message={`هل أنت متأكد من إغلاق هذا البلاغ المقدم ضد "${dismissReportTarget?.craftsman_name}" وتجاهله؟`}
        confirmLabel="إغلاق البلاغ"
        danger
        busy={busyKey === `report-dismiss-${dismissReportTarget?.id}`}
      />
    </div>
  );
}
