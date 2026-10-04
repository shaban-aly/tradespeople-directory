"use client";

import { useSearchModal } from "@/hooks/search/useSearchModal";
import {
  IconChevronDown,
  IconMapPin,
  IconSearch,
} from "@/components/shared/icons";

export function HeroSearchButton() {
  const { openSearch } = useSearchModal();

  return (
    <button
      type="button"
      onClick={() => openSearch()}
      aria-label="ابحث عن صنايعي أو تخصص في السويس"
      className="group flex min-h-11 sm:min-h-14 w-full items-center justify-between gap-1 sm:gap-2 rounded-full border border-white/50 dark:border-white/10 bg-white/50 dark:bg-card overflow-hidden p-1 sm:p-1.5 shadow-lg backdrop-blur-md transition-all hover:bg-white/70 dark:hover:bg-card/90 hover:ring-4 hover:ring-sky-500/20 active:scale-[0.99]"
    >
      {/* نص وحقل البحث */}
      <div className="flex flex-1 items-center gap-2 ps-3 text-start min-w-0">
        <IconSearch className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 dark:text-muted group-hover:text-blue-600 transition-colors shrink-0" />
        <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-muted truncate">
          ابحث عن صنايعي أو تخصص...
        </span>
      </div>

      {/* فاصل واختيار المدينة */}
      <div className="flex items-center gap-1 border-s border-white/40 dark:border-border ps-2 pe-2 sm:ps-3 sm:pe-3 text-xs font-bold text-slate-700 dark:text-foreground shrink-0">
        <IconMapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-500 dark:text-muted shrink-0" />
        <span>السويس</span>
        <IconChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-500 dark:text-muted shrink-0" />
      </div>

      {/* زر البحث الدائري الأزرق البارز */}
      <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition-all group-hover:bg-blue-700 group-active:scale-95">
        <IconSearch className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.3]" />
      </div>
    </button>
  );
}
