import { MapPin } from "lucide-react";
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
  open: { label: "استلمته — بانتظار اكتمال العروض", className: "bg-amber-500/10 text-amber-600" },
  claimed: { label: "في انتظار العميل", className: "bg-emerald-500/10 text-emerald-500" },
  completed: { label: "تم الإنجاز", className: "bg-blue-500/10 text-blue-500" },
  cancelled: { label: "أُلغي من العميل", className: "bg-danger/10 text-danger" },
  expired: { label: "انتهت الصلاحية", className: "bg-muted/10 text-muted" },
};

export function ClaimedLeadCard({ lead }: ClaimedLeadCardProps) {
  const status = CLAIM_STATUS[lead.status];
  const closed = lead.status === "cancelled" || lead.status === "expired";

  return (
    <div
      className={`border-border border bg-background p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4${
        closed ? " opacity-70" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold break-words">{lead.description}</h3>
          {status && (
            <span
              className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded font-bold ${status.className}`}
            >
              {status.label}
            </span>
          )}
        </div>
        <div className="flex gap-4 text-sm text-muted mt-1 flex-wrap">
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" /> {lead.areaName}
          </span>
          <span>{lead.categoryName}</span>
          <span>استلمت <RelativeTime value={lead.claimedAt} mode="past" initial={formatRelativePast(lead.claimedAt)} /></span>
        </div>
        {lead.imageUrls.length > 0 && (
          <div className="mt-2">
            <LeadImageGallery images={lead.imageUrls} alt={`صور طلب ${lead.categoryName ?? "الصيانة"}`} />
          </div>
        )}
      </div>
      {closed ? (
        <p className="text-sm text-muted">تم إغلاق هذا الطلب — لا حاجة للتواصل.</p>
      ) : (
        <ClaimedLeadContactActions phone={lead.customerPhone} leadId={lead.id} />
      )}
    </div>
  );
}
