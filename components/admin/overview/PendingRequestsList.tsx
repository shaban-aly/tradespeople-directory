import { AdminSection } from "@/components/admin/AdminSection";
import { EmptyState } from "@/components/admin/EmptyState";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { IconInbox } from "@/components/shared/icons";
import type { JoinRequestRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";

export function PendingRequestsList({
  requests,
  busyKey,
  onApprove,
  onReject,
  action,
}: {
  requests: JoinRequestRow[];
  busyKey: string;
  onApprove: (request: JoinRequestRow) => void;
  onReject: (requestId: string) => void;
  action?: React.ReactNode;
}) {
  return (
    <AdminSection
      title="الطلبات المعلقة"
      description="بانتظار مراجعتك"
      icon={<IconInbox className="h-6 w-6" />}
      action={action}
    >
      {requests.length === 0 ? (
        <EmptyState title="لا توجد طلبات معلقة" />
      ) : (
        <div className="grid gap-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3 sm:p-4"
            >
              <div className="grid min-w-0 gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-sm font-bold text-accent">
                    طلب تسجيل
                  </span>
                  <span className="text-sm text-muted">
                    {toArabicDigits(request.created_at.slice(0, 10))}
                  </span>
                </div>
                <p className="truncate text-base font-bold text-foreground">
                  {request.name}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <AdminButton
                  type="button"
                  variant="action"
                  disabled={busyKey === `approve-${request.id}`}
                  onClick={() => onApprove(request)}
                >
                  {busyKey === `approve-${request.id}` ? "جاري..." : "موافقة"}
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="outlineDanger"
                  disabled={busyKey === `reject-${request.id}`}
                  onClick={() => onReject(request.id)}
                >
                  {busyKey === `reject-${request.id}` ? "جاري..." : "رفض"}
                </AdminButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminSection>
  );
}
