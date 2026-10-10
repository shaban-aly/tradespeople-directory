"use client";

import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { DiagnosticCard } from "@/components/admin/diagnostics/DiagnosticCard";
import { DiagnosticFilters } from "@/components/admin/diagnostics/DiagnosticFilters";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { IconBell } from "@/components/shared/icons";
import { useAdminDiagnostics } from "@/hooks/admin/useAdminDiagnostics";
import { PUSH_DIAGNOSTICS_LIMIT, type PushDiagnosticRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";

export function DiagnosticsSection({
  initialDiagnostics,
}: {
  initialDiagnostics: PushDiagnosticRow[];
}) {
  const {
    diagnostics,
    filteredDiagnostics,
    counts,
    group,
    setGroup,
    loading,
    refresh,
  } = useAdminDiagnostics(initialDiagnostics);

  if (loading) return <DashboardLoading />;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="تشخيص الإشعارات"
        description={
          counts.technical === 0
            ? `لا توجد أعطال تقنية في آخر ${toArabicDigits(diagnostics.length)} سجل.`
            : `${toArabicDigits(counts.technical)} عطل تقني في آخر ${toArabicDigits(diagnostics.length)} سجل.`
        }
        actions={<RefreshButton onRefresh={() => void refresh()} />}
      />

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-card">
        <DiagnosticFilters
          group={group}
          counts={counts}
          onGroupChange={setGroup}
        />

        {filteredDiagnostics.length === 0 ? (
          <EmptyState
            icon={<IconBell className="h-8 w-8" />}
            title="لا توجد سجلات بهذا الفلتر"
            description="الفشل يُسجَّل من جهاز المستخدم لحظة حدوثه — غياب السجلات يعني عدم تكرار المشكلة."
            action={
              group !== "all" ? (
                <AdminButton
                  type="button"
                  variant="outline"
                  onClick={() => setGroup("all")}
                >
                  عرض كافة السجلات
                </AdminButton>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4">
            {filteredDiagnostics.map((row) => (
              <DiagnosticCard key={row.id} row={row} />
            ))}
          </div>
        )}

        <p className="text-sm text-muted">
          تُعرض أحدث {toArabicDigits(PUSH_DIAGNOSTICS_LIMIT)} سجل فقط، بحد أقصى {toArabicDigits(20)} تقريراً في الساعة لكل جهاز.
        </p>
      </section>
    </div>
  );
}
