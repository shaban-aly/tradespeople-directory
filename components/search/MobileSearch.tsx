"use client";

import { useSearchModal } from "@/hooks/search/useSearchModal";
import { IconSearch } from "@/components/shared/icons";

export function MobileSearch() {
  const { openSearch } = useSearchModal();

  return (
    <button
      type="button"
      onClick={() => openSearch()}
      aria-label="فتح البحث السريع"
      className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 text-base font-bold text-muted shadow-card transition-colors hover:border-accent active:scale-[0.99]"
    >
      <IconSearch className="h-5 w-5 shrink-0" />
      <span className="truncate">ابحث عن صنايعي أو تخصص بالسويس...</span>
    </button>
  );
}
