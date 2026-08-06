import {
  type RequestStatusFilter,
  type RequestTypeTab,
} from "@/lib/db/admin-selectors";
import { toArabicDigits } from "@/lib/utils/format";

const TYPE_TABS: { value: RequestTypeTab; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "register", label: "طلبات التسجيل" },
  { value: "report", label: "البلاغات" },
];

const STATUS_FILTERS: { value: RequestStatusFilter; label: string }[] = [
  { value: "all", label: "كل الحالات" },
  { value: "pending", label: "معلق" },
  { value: "approved", label: "مقبول" },
  { value: "rejected", label: "مرفوض" },
];

export function RequestFilters({
  typeTab,
  statusFilter,
  counts,
  onTypeChange,
  onStatusChange,
}: {
  typeTab: RequestTypeTab;
  statusFilter: RequestStatusFilter;
  counts: { all: number; register: number; report: number };
  onTypeChange: (tab: RequestTypeTab) => void;
  onStatusChange: (filter: RequestStatusFilter) => void;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {TYPE_TABS.map((tab) => {
          const count =
            tab.value === "all"
              ? counts.all
              : tab.value === "register"
                ? counts.register
                : counts.report;
          const isActive = typeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTypeChange(tab.value)}
              className={`flex min-h-12 items-center gap-2 rounded-xl px-4 text-base font-bold transition-colors ${
                isActive
                  ? "bg-accent text-on-accent"
                  : "border border-border text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-2 py-0.5 text-sm ${
                  isActive ? "bg-on-accent/20" : "bg-accent/10 text-accent"
                }`}
              >
                {toArabicDigits(count)}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => onStatusChange(filter.value)}
            className={`min-h-12 rounded-xl px-4 text-base font-bold transition-colors ${
              statusFilter === filter.value
                ? "bg-action text-on-action"
                : "border border-border text-muted hover:text-foreground"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
