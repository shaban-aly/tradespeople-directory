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
    <div className={`bg-card border-border border p-5 rounded-xl space-y-4 shadow-sm relative overflow-hidden${highlight ? " ring-2 ring-action shadow-lg" : ""}`}>
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-action/10 text-action px-2 py-1 rounded text-xs font-semibold">
              {lead.categoryName}
            </span>
            <NewLeadBadge
              value={lead.createdAt}
              initial={isNewWithinMinutes(lead.createdAt)}
            />
            <span
              className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                lead.responseCount >= MAX_LEAD_RESPONSES
                  ? "bg-muted/10 text-muted"
                  : "bg-emerald-500/10 text-emerald-600"
              }`}
            >
              <Users className="w-3 h-3" />
              {lead.responseCount}/{MAX_LEAD_RESPONSES} صنايعي
            </span>
          </div>
          <h3 className="font-bold text-lg mt-2 break-words line-clamp-3">{lead.description}</h3>
        </div>
        <div className="text-muted text-xs flex flex-col items-end gap-1 shrink-0">
          <span className="flex items-center gap-1 bg-background px-2 py-1 rounded">
            <Clock className="w-3 h-3" />
            <RelativeTime
              value={lead.createdAt}
              mode="past"
              initial={formatRelativePast(lead.createdAt)}
            />
          </span>
          <span className="flex items-center gap-1 bg-background px-2 py-1 rounded">
            <Hourglass className="w-3 h-3" />
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
