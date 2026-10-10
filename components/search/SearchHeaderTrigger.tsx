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
    <div className="mt-4 flex w-full max-w-xl items-center gap-2 min-w-0">
      <button
        type="button"
        onClick={() => openSearch(initialQuery)}
        aria-label="تعديل أو كتابة بحث جديد"
        className="group flex min-h-12 min-w-0 flex-1 items-center justify-between gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-2xs transition-all hover:border-accent hover:shadow-xs active:scale-[0.99] sm:gap-3 sm:px-4"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
          <IconSearch className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-accent" />
          <span
            className={`block min-w-0 truncate text-start text-xs sm:text-sm ${
              initialQuery ? "font-bold text-foreground" : "text-muted"
            }`}
          >
            {initialQuery ? initialQuery : "ابحث عن صنايعي، تخصص، أو منطقة بالسويس..."}
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-lg bg-muted/10 px-2 py-1 text-xs font-medium text-muted transition-colors group-hover:bg-accent/10 group-hover:text-accent sm:gap-1.5 sm:px-2.5">
          تعديل
        </span>
      </button>

      {initialQuery ? (
        <button
          type="button"
          onClick={() => router.push("/search")}
          aria-label="مسح كلمة البحث"
          title="مسح كلمة البحث"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-muted shadow-2xs transition-colors hover:border-danger/50 hover:bg-danger/5 hover:text-danger active:scale-95 sm:h-12 sm:w-12"
        >
          <IconX className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
