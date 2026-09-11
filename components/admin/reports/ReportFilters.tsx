import { type ReportStatusFilter } from "@/lib/db/admin-selectors";
import { toArabicDigits } from "@/lib/utils/format";

const STATUS_FILTERS: { value: ReportStatusFilter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "pending", label: "معلق" },
  { value: "reviewed", label: "تمت المراجعة" },
  { value: "dismissed", label: "مغلق" },
];

export function ReportFilters({
  statusFilter,
  counts,
  onStatusChange,
}: {
  statusFilter: ReportStatusFilter;
  counts: { all: number; pending: number; reviewed: number; dismissed: number };
  onStatusChange: (filter: ReportStatusFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STATUS_FILTERS.map((filter) => {
        const isActive = statusFilter === filter.value;
        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onStatusChange(filter.value)}
            className={`flex min-h-12 items-center gap-2 rounded-xl px-4 text-base font-bold transition-colors ${
              isActive
                ? "bg-action text-on-action"
                : "border border-border text-muted hover:text-foreground"
            }`}
          >
            {filter.label}
            <span
              className={`rounded-full px-2 py-0.5 text-sm ${
                isActive ? "bg-on-action/20" : "bg-accent/10 text-accent"
              }`}
            >
              {toArabicDigits(counts[filter.value])}
            </span>
          </button>
        );
      })}
    </div>
  );
}