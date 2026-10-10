import type { KeyboardEvent } from "react";
import {
  IconChart,
  IconSparkles,
  IconTags,
} from "@/components/shared/icons";

export type OverviewTab = "summary" | "analytics" | "manage";

export const OVERVIEW_TABS: {
  value: OverviewTab;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "summary",
    label: "الملخص الشامل",
    icon: <IconSparkles className="h-4 w-4" />,
  },
  {
    value: "analytics",
    label: "التحليلات والمؤشرات",
    icon: <IconChart className="h-4 w-4" />,
  },
  {
    value: "manage",
    label: "توزيع وتصنيفات الدليل",
    icon: <IconTags className="h-4 w-4" />,
  },
];

export function OverviewTabs({
  active,
  onChange,
}: {
  active: OverviewTab;
  onChange: (value: OverviewTab) => void;
}) {
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex = currentIndex;
    // In RTL layout: ArrowLeft advances forward, ArrowRight moves backward
    if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex + 1) % OVERVIEW_TABS.length;
    } else if (e.key === "ArrowRight") {
      nextIndex = (currentIndex - 1 + OVERVIEW_TABS.length) % OVERVIEW_TABS.length;
    } else {
      return;
    }
    e.preventDefault();
    const nextTab = OVERVIEW_TABS[nextIndex]?.value;
    if (nextTab) {
      onChange(nextTab);
      const nextBtn = document.getElementById(`tab-${nextTab}`);
      nextBtn?.focus();
    }
  };

  return (
    <div className="flex w-full overflow-x-auto pb-0.5 sm:pb-0" role="tablist" aria-label="تبويبات نظرة عامة">
      <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1 rounded-xl sm:rounded-2xl border border-border bg-card p-1 sm:p-1.5 shadow-xs">
        {OVERVIEW_TABS.map((tab, idx) => {
          const isActive = tab.value === active;
          return (
            <button
              key={tab.value}
              id={`tab-${tab.value}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.value}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.value)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`flex min-h-9 sm:min-h-11 flex-1 sm:flex-initial items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isActive
                  ? "bg-accent text-on-accent shadow-xs scale-[1.01]"
                  : "text-muted hover:bg-background/60 hover:text-foreground"
              }`}
            >
              <span className={`shrink-0 ${isActive ? "text-on-accent" : "text-muted"}`}>
                {tab.icon}
              </span>
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
