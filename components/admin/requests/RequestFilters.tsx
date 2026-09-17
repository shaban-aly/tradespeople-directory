import { FilterTabs } from "@/components/shared/ui/FilterTabs";
import { type RequestStatusFilter } from "@/lib/db/admin-selectors";

const STATUS_TABS: { value: RequestStatusFilter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "pending", label: "معلق" },
  { value: "rejected", label: "مرفوض" },
];

export function RequestFilters({
  statusFilter,
  counts,
  onStatusChange,
}: {
  statusFilter: RequestStatusFilter;
  counts: { all: number; pending: number; rejected: number };
  onStatusChange: (filter: RequestStatusFilter) => void;
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
