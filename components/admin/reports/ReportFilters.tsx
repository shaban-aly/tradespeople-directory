import { FilterTabs } from "@/components/shared/ui/FilterTabs";
import { type ReportStatusFilter } from "@/lib/db/admin-selectors";

const STATUS_TABS: { value: ReportStatusFilter; label: string }[] = [
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
    <FilterTabs
      tabs={STATUS_TABS.map((tab) => ({
        ...tab,
        count: counts[tab.value],
      }))}
      active={statusFilter}
      onChange={onStatusChange}
    />
  );
}
