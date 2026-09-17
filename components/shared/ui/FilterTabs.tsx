import { toArabicDigits } from "@/lib/utils/format";

export type FilterTab<T extends string> = {
  value: T;
  label: string;
  count: number;
};

/**
 * شريط فلاتر موحّد لكل أقسام لوحة التحكم (طلبات/بلاغات/رسائل/...):
 * أزرار pills مع عدّاد عددي، النشط bg-action — بلا ألوان inline.
 */
export function FilterTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: FilterTab<T>[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={`flex min-h-12 items-center gap-2 rounded-xl px-4 text-base font-bold transition-colors ${
              isActive
                ? "bg-action text-on-action"
                : "border border-border text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-sm leading-none ${
                isActive ? "bg-on-action/20" : "bg-accent/10 text-accent"
              }`}
            >
              {toArabicDigits(tab.count)}
            </span>
          </button>
        );
      })}
    </div>
  );
}