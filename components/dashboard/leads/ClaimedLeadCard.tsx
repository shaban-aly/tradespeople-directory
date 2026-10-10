import { IconMapPin, IconClock, IconAlert } from "@/components/shared/icons";
import type { LeadStatus } from "@/lib/db/leads";
import { formatRelativePast } from "@/lib/utils/time";
import { RelativeTime } from "@/components/leads/RelativeTime";
import { LeadImageGallery } from "@/components/leads/LeadImageGallery";
import { ClaimedLeadContactActions } from "./ClaimedLeadContactActions";

interface ClaimedLeadCardProps {
  lead: {
    id: string;
    description: string;
    status: LeadStatus;
    claimedAt: string;
    categoryName: string | null;
    areaName: string | null;
    customerPhone: string;
    imageUrls: string[];
  };
}

const CLAIM_STATUS: Partial<Record<LeadStatus, { label: string; className: string }>> = {
  open: {
    label: "استلمته — بانتظار اكتمال العروض",
    className: "bg-warning/15 text-warning border border-warning/25",
  },
  claimed: {
    label: "في انتظار العميل",
    className: "bg-action/15 text-action border border-action/25",
  },
  completed: {
    label: "تم الإنجاز",
    className: "bg-accent/15 text-accent border border-accent/25",
  },
  cancelled: {
    label: "أُلغي من العميل",
    className: "bg-danger/10 text-danger border border-danger/25",
  },
  expired: {
    label: "انتهت الصلاحية",
    className: "bg-muted/15 text-muted border border-border/60",
  },
};

export function ClaimedLeadCard({ lead }: ClaimedLeadCardProps) {
  const status = CLAIM_STATUS[lead.status];
  const closed = lead.status === "cancelled" || lead.status === "expired";

  return (
    <article
      className={`rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-card transition-all hover:border-accent/40 ${
        closed ? "opacity-75" : ""
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        {/* Left Side: Lead Details */}
        <div className="min-w-0 flex-1 space-y-3">
          {/* Header Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {lead.categoryName && (
              <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                {lead.categoryName}
              </span>
            )}

            {lead.areaName && (
              <span className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-semibold text-muted">
                <IconMapPin className="h-3.5 w-3.5 text-muted" />
                {lead.areaName}
              </span>
            )}

            {status && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${status.className}`}
              >
                {status.label}
              </span>
            )}

            <span className="flex items-center gap-1 text-xs text-muted font-medium">
              <IconClock className="h-3.5 w-3.5 text-muted" />
              <span>استلمت <RelativeTime value={lead.claimedAt} mode="past" initial={formatRelativePast(lead.claimedAt)} /></span>
            </span>
          </div>

          {/* Description */}
          <h3 className="font-heading text-base sm:text-lg font-bold text-foreground leading-snug break-words">
            {lead.description}
          </h3>

          {/* Photos */}
          {lead.imageUrls.length > 0 && (
            <div className="pt-1">
              <LeadImageGallery
                images={lead.imageUrls}
                alt={`صور طلب ${lead.categoryName ?? "الصيانة"}`}
              />
            </div>
          )}
        </div>

        {/* Right Side: Contact Actions or Closed State */}
        <div className="shrink-0 lg:w-72 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-s border-border lg:ps-5">
          {closed ? (
            <div className="rounded-xl border border-border bg-background/50 p-3.5 text-center">
              <p className="text-xs font-bold text-muted">
                تم إغلاق هذا الطلب — لا حاجة للتواصل حالياً
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground">
                بيانات التواصل مع العميل:
              </p>
              <ClaimedLeadContactActions phone={lead.customerPhone} leadId={lead.id} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
