import { FilterTabs } from "@/components/shared/ui/FilterTabs";
import { type PushDiagnosticGroup } from "@/lib/db/admin-selectors";

/**
 * «أعطال تقنية» أولاً لأنها وحدها القابلة للإصلاح من طرفنا؛
 * الأذونات ودعم المتصفح سياق لا إجراء.
 */
const GROUP_TABS: { value: PushDiagnosticGroup; label: string }[] = [
  { value: "technical", label: "أعطال تقنية" },
  { value: "permission", label: "الأذونات" },
  { value: "capability", label: "دعم المتصفح" },
  { value: "all", label: "الكل" },
];

export function DiagnosticFilters({
  group,
  counts,
  onGroupChange,
}: {
  group: PushDiagnosticGroup;
  counts: Record<PushDiagnosticGroup, number>;
  onGroupChange: (value: PushDiagnosticGroup) => void;
}) {
  return (
    <FilterTabs
      tabs={GROUP_TABS.map((tab) => ({ ...tab, count: counts[tab.value] }))}
      active={group}
      onChange={onGroupChange}
    />
  );
}
