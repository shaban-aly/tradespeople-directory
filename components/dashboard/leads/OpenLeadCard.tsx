import {
  IconClock,
  IconHourglass,
  IconMapPin,
  IconUsers,
  IconSparkles,
} from "@/components/shared/icons";
import { LeadsClaimButton } from "@/components/dashboard/LeadsClaimButton";
import { NewLeadBadge, RelativeTime } from "@/components/leads/RelativeTime";
import { LeadImageGallery } from "@/components/leads/LeadImageGallery";
import { MAX_LEAD_RESPONSES } from "@/lib/db/leads";
import { toArabicDigits } from "@/lib/utils/format";
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
  const isNew = isNewWithinMinutes(lead.createdAt);
  const remainingSlots = Math.max(0, MAX_LEAD_RESPONSES - lead.responseCount);

  // Response badge configuration
  const getSlotBadge = () => {
    if (lead.responseCount === 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-action/30 bg-action/15 px-2.5 py-0.5 text-xs font-bold text-action">
          <IconSparkles className="h-3 w-3" />
          <span>فرصة جديدة — كن أول المستجيبين!</span>
        </span>
      );
    }
    if (remainingSlots === 1) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/15 px-2.5 py-0.5 text-xs font-bold text-warning">
          <IconUsers className="h-3 w-3" />
          <span>متبقي مقعد أخير ({toArabicDigits(lead.responseCount)}/{toArabicDigits(MAX_LEAD_RESPONSES)})</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
        <IconUsers className="h-3 w-3" />
        <span>
          {toArabicDigits(lead.responseCount)}/{toArabicDigits(MAX_LEAD_RESPONSES)} فنيين ردّوا
        </span>
      </span>
    );
  };

  return (
    <article
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-card transition-all duration-200 hover:border-accent/40 hover:shadow-md ${
        highlight ? "ring-2 ring-accent shadow-md animate-pulse" : ""
      }`}
    >
      <div className="space-y-3.5">
        {/* Top Badges & Time Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {lead.categoryName && (
              <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                {lead.categoryName}
              </span>
            )}
            <NewLeadBadge value={lead.createdAt} initial={isNew} />
            {getSlotBadge()}
          </div>

          {/* Time & Remaining Badges */}
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1 rounded-lg bg-muted/15 px-2 py-0.5 font-medium">
              <IconClock className="h-3 w-3 text-muted" />
              <RelativeTime
                value={lead.createdAt}
                mode="past"
                initial={formatRelativePast(lead.createdAt)}
              />
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-muted/15 px-2 py-0.5 font-medium">
              <IconHourglass className="h-3 w-3 text-muted" />
              <RelativeTime
                value={lead.expiresAt}
                mode="remaining"
                initial={formatRemainingUntil(lead.expiresAt)}
              />
            </span>
          </div>
        </div>

        {/* Location chip */}
        {lead.areaName && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted">
            <IconMapPin className="h-3.5 w-3.5 text-accent" />
            <span className="text-foreground">{lead.areaName}</span>
            <span className="text-muted/60">• السويس</span>
          </div>
        )}

        {/* Lead Problem Description */}
        <h3 className="font-heading text-base sm:text-lg font-bold text-foreground leading-snug break-words">
          {lead.description}
        </h3>

        {/* Attached Photos */}
        {lead.imageUrls.length > 0 && (
          <div className="pt-1">
            <LeadImageGallery
              images={lead.imageUrls}
              alt={`صور مشكلة ${lead.categoryName ?? "الصيانة"}`}
            />
          </div>
        )}
      </div>

      {/* Claim Action Strip */}
      <div className="mt-4 pt-3.5 border-t border-border">
        <LeadsClaimButton leadId={lead.id} craftsmanId={lead.craftsmanId} />
      </div>
    </article>
  );
}
