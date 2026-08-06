import { AdminSection } from "@/components/admin/AdminSection";
import { EmptyState } from "@/components/admin/EmptyState";
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
                    {request.type === "register" ? "طلب تسجيل" : "بلاغ"}
                  </span>
                  <span className="text-sm text-muted">
                    {toArabicDigits(request.created_at.slice(0, 10))}
                  </span>
                </div>
                <p className="truncate text-base font-bold text-foreground">
                  {request.type === "register"
                    ? request.name
                    : request.craftsman_name}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busyKey === `approve-${request.id}`}
                  onClick={() => onApprove(request)}
                  className="min-h-12 rounded-xl bg-action px-4 text-base font-bold text-on-action disabled:opacity-50"
                >
                  {busyKey === `approve-${request.id}` ? "جاري..." : "موافقة"}
                </button>
                <button
                  type="button"
                  disabled={busyKey === `reject-${request.id}`}
                  onClick={() => onReject(request.id)}
                  className="min-h-12 rounded-xl border border-danger/40 px-4 text-base font-bold text-danger disabled:opacity-50"
                >
                  {busyKey === `reject-${request.id}` ? "جاري..." : "رفض"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminSection>
  );
}
