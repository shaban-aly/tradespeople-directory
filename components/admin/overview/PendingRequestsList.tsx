import { AdminSection } from "@/components/admin/AdminSection";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import {
  IconCheck,
  IconInbox,
  IconPhone,
  IconPin,
  IconTags,
  IconUsers,
} from "@/components/shared/icons";
import { SafeImage as Image } from "@/components/shared/ui/SafeImage";
import type { JoinRequestRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";
import { IMAGE_ASPECT, withImageAspect } from "@/lib/utils/image-transform";

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
  onReject: (request: JoinRequestRow) => void;
  action?: React.ReactNode;
}) {
  return (
    <AdminSection
      title="طلبات الانضمام المعلّقة"
      description="طلبات فنيين جدد بانتظار الاعتماد والنشر"
      icon={<IconInbox className="h-5 w-5" />}
      action={action}
    >
      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border border-dashed border-border/80 bg-background/40 py-4 px-3 sm:py-8 sm:px-4 text-center">
          <div className="flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-action/10 text-action">
            <IconCheck className="h-4 w-4 sm:h-6 sm:w-6" />
          </div>
          <h3 className="mt-2 text-xs sm:text-sm font-bold text-foreground">
            لا توجد طلبات انضمام معلقة حالياً
          </h3>
          <p className="mt-0.5 max-w-sm text-xs text-muted">
            تمت مراجعة كافة الطلبات؛ ستظهر هنا أي طلبات تسجيل جديدة فور إرسالها.
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:gap-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="group flex flex-col gap-2 sm:gap-3.5 rounded-xl sm:rounded-2xl border border-border bg-card p-2.5 sm:p-4 shadow-xs transition-all duration-200 hover:border-accent/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
                {/* الصورة المصغرة أو أيقونة افتراضية */}
                {request.image_url ? (
                  <div className="relative h-10 w-10 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-lg sm:rounded-xl border border-border bg-background">
                    <Image
                      src={withImageAspect(request.image_url, IMAGE_ASPECT.SQUARE)}
                      alt={request.name ?? "صورة الطلب"}
                      fill
                      sizes="48px"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-accent/10 text-accent">
                    <IconUsers className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                      طلب تسجيل
                    </span>
                    <span className="text-xs text-muted">
                      {toArabicDigits(request.created_at.slice(0, 10))}
                    </span>
                  </div>

                  <p className="mt-1 truncate font-heading text-base font-bold text-foreground">
                    {request.name || "طلب بلا اسم"}
                  </p>

                  {/* بيانات التخصص، المنطقة، ورقم الهاتف لمساعدة المشرف على القرار */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted sm:text-sm">
                    {request.category?.name && (
                      <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        <IconTags className="h-3.5 w-3.5 text-accent" />
                        {request.category.name}
                      </span>
                    )}

                    {request.area?.name && (
                      <span className="inline-flex items-center gap-1">
                        <IconPin className="h-3.5 w-3.5 text-muted" />
                        {request.area.name}
                      </span>
                    )}

                    {request.phone && (
                      <span
                        dir="ltr"
                        className="inline-flex items-center gap-1 font-mono text-xs text-muted"
                      >
                        <IconPhone className="h-3.5 w-3.5 text-muted" />
                        {request.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 border-t border-border/40 pt-2 sm:border-0 sm:pt-0">
                <AdminButton
                  type="button"
                  variant="action"
                  size="sm"
                  aria-label={`موافقة واعتماد طلب ${request.name ?? ""}`}
                  disabled={busyKey === `approve-${request.id}`}
                  onClick={() => onApprove(request)}
                >
                  {busyKey === `approve-${request.id}` ? "جاري..." : "موافقة ونشر"}
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="outlineDanger"
                  size="sm"
                  aria-label={`رفض طلب ${request.name ?? ""}`}
                  disabled={busyKey === `reject-${request.id}`}
                  onClick={() => onReject(request)}
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
