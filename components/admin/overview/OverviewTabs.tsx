export type OverviewTab = "summary" | "analytics" | "manage";

export const OVERVIEW_TABS: { value: OverviewTab; label: string }[] = [
  { value: "summary", label: "الملخص" },
  { value: "analytics", label: "الإحصائيات" },
  { value: "manage", label: "الإدارة" },
];

export function OverviewTabs({
  active,
  onChange,
}: {
  active: OverviewTab;
  onChange: (value: OverviewTab) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border" role="tablist">
      {OVERVIEW_TABS.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={`min-h-12 shrink-0 border-b-2 px-4 py-2 text-base font-bold transition-colors ${
              isActive
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
