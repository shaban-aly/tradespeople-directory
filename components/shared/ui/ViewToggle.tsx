"use client";

import { IconGrid, IconList } from "@/components/shared/icons";
import type { ViewMode } from "@/hooks/useViewPreference";

export function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="طريقة عرض الصنايعية"
      className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-card"
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={view === "grid"}
        aria-label="عرض شبكة"
        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
          view === "grid"
            ? "bg-accent text-on-accent"
            : "text-muted hover:text-foreground"
        }`}
      >
        <IconGrid className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={view === "list"}
        aria-label="عرض قائمة"
        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
          view === "list"
            ? "bg-accent text-on-accent"
            : "text-muted hover:text-foreground"
        }`}
      >
        <IconList className="h-5 w-5" />
      </button>
    </div>
  );
}
