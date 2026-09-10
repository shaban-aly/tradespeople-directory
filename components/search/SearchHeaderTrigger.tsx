"use client";

import { useRouter } from "next/navigation";
import { useSearchModal } from "@/hooks/search/useSearchModal";
import { IconSearch, IconX } from "@/components/shared/icons";

export function SearchHeaderTrigger({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const { openSearch } = useSearchModal();
  const router = useRouter();

  return (
    <div className="mt-5 flex items-center gap-2 max-w-xl">
      <button
        type="button"
        onClick={() => openSearch(initialQuery)}
        aria-label="تعديل أو كتابة بحث جديد"
        className="flex min-h-12 flex-1 items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 text-sm font-bold text-foreground shadow-xs transition-all hover:border-accent active:scale-[0.99]"
      >
        <div className="flex items-center gap-2.5 truncate">
          <IconSearch className="h-4 w-4 text-muted shrink-0" />
          <span className={initialQuery ? "text-foreground" : "text-muted"}>
            {initialQuery ? initialQuery : "ابحث عن صنايعي، تخصص، أو منطقة..."}
          </span>
        </div>
        <span className="rounded-lg bg-muted/10 px-2 py-0.5 text-xs text-muted font-normal shrink-0">
          تعديل البحث
        </span>
      </button>

      {initialQuery ? (
        <button
          type="button"
          onClick={() => router.push("/search")}
          aria-label="مسح كلمة البحث"
          title="مسح كلمة البحث"
          className="flex min-h-12 min-w-12 items-center justify-center rounded-2xl border border-border bg-background text-muted transition-colors hover:border-destructive hover:text-destructive shadow-xs active:scale-95"
        >
          <IconX className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
