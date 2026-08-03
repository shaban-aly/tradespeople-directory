"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/hooks/search/useSearch";
import { SearchResultsList } from "@/components/search/SearchResultsList";
import { IconRefresh, IconSearch, IconX } from "@/components/shared/icons";

export function MobileSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { suggestions, loading } = useSearch(open ? query : "", open);

  useEffect(() => {
    if (!open) return;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 50);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function submit() {
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 text-base font-bold text-muted shadow-card transition-colors hover:border-accent"
      >
        <IconSearch className="h-5 w-5 shrink-0" />
        <span className="truncate">ابحث عن صنايعي أو تخصص...</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="إغلاق البحث"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
            >
              <IconX className="h-5 w-5" />
            </button>
            <form
              className="relative flex-1"
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <IconSearch className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ابحث عن صنايعي، تخصص، أو منطقة..."
                aria-label="البحث"
                className="min-h-11 w-full rounded-full border border-border bg-card py-2 pe-4 ps-11 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </form>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted">
                <IconRefresh className="h-5 w-5 animate-spin" />
                <span>جارٍ البحث...</span>
              </div>
            ) : query.trim().length >= 2 ? (
              suggestions.length > 0 ? (
                <>
                  <SearchResultsList
                    suggestions={suggestions}
                    query={query}
                    onSelect={() => setOpen(false)}
                  />
                  <button
                    type="button"
                    onClick={submit}
                    className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-bold text-on-accent transition-colors hover:bg-accent/90"
                  >
                    عرض كل النتائج
                  </button>
                </>
              ) : (
                <p className="py-8 text-center text-base text-muted">
                  لا توجد نتائج مطابقة
                </p>
              )
            ) : (
              <p className="py-8 text-center text-base text-muted">
                اكتب اسم الصنايعي أو التخصص أو المنطقة
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
