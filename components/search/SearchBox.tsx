"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearch } from "@/hooks/search/useSearch";
import { SearchResultsList } from "@/components/search/SearchResultsList";
import { IconRefresh, IconSearch, IconX } from "@/components/shared/icons";
import { searchHref } from "@/lib/utils/url";

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const { suggestions, loading } = useSearch(open ? query : "", open);

  const trimmed = query.trim();
  const showDropdown = open && trimmed.length >= 2;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function submit() {
    const active =
      activeIndex >= 0 && activeIndex < suggestions.length
        ? suggestions[activeIndex]
        : undefined;
    if (active) {
      router.push(active.href);
    } else if (trimmed) {
      router.push(searchHref({ q: trimmed }));
    }
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((prev) =>
        suggestions.length === 0
          ? -1
          : (prev + 1) % suggestions.length,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) =>
        suggestions.length === 0
          ? -1
          : (prev - 1 + suggestions.length) % suggestions.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      submit();
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative">
        <IconSearch className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="ابحث عن صنايعي أو تخصص..."
          aria-label="البحث"
          className="min-h-14 w-full rounded-2xl border border-border bg-card py-3 pe-12 ps-12 text-base text-foreground shadow-card placeholder:text-muted focus:border-accent focus:outline-none"
        />
        {loading ? (
          <IconRefresh className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-muted" />
        ) : (
          query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="مسح البحث"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
            >
              <IconX className="h-5 w-5" />
            </button>
          )
        )}
      </div>

      {showDropdown && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-background p-1.5 shadow-lg">
          {suggestions.length > 0 ? (
            <SearchResultsList
              suggestions={suggestions}
              query={query}
              activeIndex={activeIndex}
              onSelect={() => setOpen(false)}
            />
          ) : (
            !loading && (
              <p className="px-3 py-6 text-center text-base text-muted">
                لا توجد نتائج مطابقة
              </p>
            )
          )}
          <Link
            href={searchHref({ q: trimmed })}
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-xl border-t border-border px-3 py-2.5 text-center text-base font-bold text-accent transition-colors hover:bg-card"
          >
            عرض كل النتائج لـ «{trimmed}»
          </Link>
        </div>
      )}
    </div>
  );
}
