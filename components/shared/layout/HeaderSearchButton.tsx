"use client";

import { useSearchModal } from "@/hooks/search/useSearchModal";
import { IconSearch } from "@/components/shared/icons";

export function HeaderSearchButton({ className = "" }: { className?: string }) {
  const { openSearch } = useSearchModal();

  return (
    <button
      type="button"
      onClick={() => openSearch()}
      aria-label="فتح البحث السريع"
      title="بحث سريع (صنايعي، تخصص، منطقة)"
      className={`hidden lg:flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent active:scale-95 ${className}`}
    >
      <IconSearch className="h-5 w-5" />
    </button>
  );
}
