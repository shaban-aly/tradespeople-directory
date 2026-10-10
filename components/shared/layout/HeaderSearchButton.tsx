"use client";

import { useEffect } from "react";
import { useSearchModal } from "@/hooks/search/useSearchModal";
import { IconSearch } from "@/components/shared/icons";

export function HeaderSearchButton({ className = "" }: { className?: string }) {
  const { openSearch } = useSearchModal();

  // تفعيل اختصار لوحة المفاتيح Ctrl+K أو Cmd+K لفتح البحث السريع على الديسكتوب
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        openSearch();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openSearch]);

  return (
    <button
      type="button"
      onClick={() => openSearch()}
      aria-label="فتح البحث السريع"
      title="بحث سريع (صنايعي، تخصص، منطقة) — اختصار: Ctrl+K"
      className={`hidden lg:flex h-10 w-36 xl:w-48 2xl:w-56 shrink-0 items-center justify-between rounded-full border border-border/80 bg-card/70 backdrop-blur-xs px-3 text-foreground transition-all hover:border-accent/60 hover:bg-card hover:text-accent active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent group shadow-2xs ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <IconSearch className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-accent" />
        <span className="truncate text-xs font-medium text-muted transition-colors group-hover:text-foreground">
          ابحث عن صنايعي...
        </span>
      </div>
      <kbd className="hidden xl:inline-flex items-center rounded-md border border-border/70 bg-muted/15 px-1.5 py-0.5 text-xs font-mono font-medium text-muted">
        Ctrl K
      </kbd>
    </button>
  );
}
