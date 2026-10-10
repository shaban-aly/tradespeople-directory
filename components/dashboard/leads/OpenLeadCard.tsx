import { Clock, Hourglass, MapPin, Users } from "lucide-react";
import { LeadsClaimButton } from "@/components/dashboard/LeadsClaimButton";
import { NewLeadBadge, RelativeTime } from "@/components/leads/RelativeTime";
import { LeadImageGallery } from "@/components/leads/LeadImageGallery";
import { MAX_LEAD_RESPONSES } from "@/lib/db/leads";
import {
  formatRelativePast,
  formatRemainingUntil,
  isNewWithinMinutes,
} from "@/lib/utils/time";

interface OpenLeadCardProps {
  lead: {
    id: string;
    description: string;
    categoryName: string | null;
    areaName: string | null;
    createdAt: string;
    expiresAt: string;
    /** عدد الصنايعية الذين ردّوا حتى الآن */
    responseCount: number;
    craftsmanId: string;
    /** صور المشكلة (اختياري — حد 3). */
    imageUrls: string[];
  };
  /** تمييز الكارت الواصل حديثاً لحظياً (حلقة action). */
  highlight?: boolean;
}

export function OpenLeadCard({ lead, highlight = false }: OpenLeadCardProps) {
  return (
    <div
      className={`rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-4 shadow-xs relative overflow-hidden transition-all hover:border-accent/40${
        highlight ? " ring-2 ring-accent shadow-md" : ""
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-accent/10 text-accent border border-accent/20 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {lead.categoryName}
            </span>
            <NewLeadBadge
              value={lead.createdAt}
              initial={isNewWithinMinutes(lead.createdAt)}
            />
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border ${
                lead.responseCount >= MAX_LEAD_RESPONSES
                  ? "bg-muted/10 text-muted border-border/60"
                  : "bg-accent/10 text-accent border-accent/20"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              {lead.responseCount}/{MAX_LEAD_RESPONSES} صنايعي
            </span>
          </div>
          <h3 className="font-heading font-bold text-base sm:text-lg mt-2.5 break-words line-clamp-3 text-foreground leading-snug">
            {lead.description}
          </h3>
        </div>
        <div className="text-muted text-xs flex flex-col items-end gap-1.5 shrink-0">
          <span className="flex items-center gap-1 bg-muted/15 px-2 py-1 rounded-lg font-medium">
            <Clock className="w-3.5 h-3.5" />
            <RelativeTime
              value={lead.createdAt}
              mode="past"
              initial={formatRelativePast(lead.createdAt)}
            />
          </span>
          <span className="flex items-center gap-1 bg-muted/15 px-2 py-1 rounded-lg font-medium">
            <Hourglass className="w-3.5 h-3.5" />
            <RelativeTime
              value={lead.expiresAt}
              mode="remaining"
              initial={formatRemainingUntil(lead.expiresAt)}
            />
          </span>
        </div>
      </div>

      <div className="flex gap-4 text-sm text-foreground/80">
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4 text-muted" />
          {lead.areaName}
        </div>
      </div>

      {lead.imageUrls.length > 0 && (
        <LeadImageGallery images={lead.imageUrls} alt={`صور طلب ${lead.categoryName ?? "الصيانة"}`} />
      )}

      <LeadsClaimButton leadId={lead.id} craftsmanId={lead.craftsmanId} />
    </div>
  );
}
