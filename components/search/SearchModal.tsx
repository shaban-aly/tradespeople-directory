"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchModal } from "@/hooks/search/useSearchModal";
import { useSearch } from "@/hooks/search/useSearch";
import { useRecentSearches } from "@/hooks/search/useRecentSearches";
import { SearchResultsList } from "@/components/search/SearchResultsList";
import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";
import { Button } from "@/components/shared/ui/Button";
import {
  IconClock,
  IconRefresh,
  IconSearch,
  IconX,
} from "@/components/shared/icons";
import { categoryColor } from "@/lib/utils/categoryColor";
import { categoryHref, searchHref } from "@/lib/utils/url";

const QUICK_CATEGORIES = [
  { slug: "plumbing", name: "سباكة" },
  { slug: "electrical", name: "كهرباء" },
  { slug: "hvac", name: "تكييف" },
  { slug: "carpentry", name: "نجارة" },
  { slug: "painting", name: "نقاشة" },
  { slug: "aluminum", name: "ألوميتال" },
];

export function SearchModal() {
  const router = useRouter();
  const { isOpen, initialQuery, closeSearch } = useSearchModal();
  const { searches, addSearch, removeSearch, clearSearches } = useRecentSearches();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { suggestions, loading } = useSearch(isOpen ? query : "", isOpen);

  // تصفير نص البحث عند فتح النافذة (ضبط الحالة أثناء الريندر بدل useEffect)
  const [prevOpen, setPrevOpen] = useState({ isOpen, initialQuery });
  if (
    isOpen &&
    (prevOpen.isOpen !== isOpen || prevOpen.initialQuery !== initialQuery)
  ) {
    setPrevOpen({ isOpen, initialQuery });
    setQuery(initialQuery || "");
  }

  // التركيز التلقائي وقفل التمرير
  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // إغلاق بـ Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeSearch();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeSearch]);

  if (!isOpen) return null;

  function submit(targetQuery?: string) {
    const q = (targetQuery ?? query).trim();
    if (!q) return;
    addSearch(q);
    closeSearch();
    router.push(searchHref({ q }));
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="نافذة البحث السريع"
      className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md"
    >
      {/* رأس النافذة مع حقل البحث */}
      <div className="flex items-center gap-2 border-b border-border bg-card/80 px-4 py-3">
        <button
          type="button"
          onClick={closeSearch}
          aria-label="إغلاق البحث"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-muted/10 hover:text-foreground active:scale-95"
        >
          <IconX className="h-5 w-5" />
        </button>

        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <IconSearch className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن صنايعي، تخصص، أو منطقة بالسويس..."
            aria-label="نص البحث"
            className="min-h-12 w-full rounded-full border border-border bg-background py-2 pe-10 ps-11 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none shadow-xs"
          />

          {query.trim().length > 0 && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="مسح النص"
              className="absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-muted/15 hover:text-foreground"
            >
              <IconX className="h-4 w-4" />
            </button>
          )}
        </form>
      </div>

      {/* محتوى النتائج والاقتراحات */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted">
            <IconRefresh className="h-5 w-5 animate-spin" />
            <span className="text-base font-bold">جارٍ البحث...</span>
          </div>
        ) : query.trim().length >= 2 ? (
          suggestions.length > 0 ? (
            <div className="space-y-4">
              <SearchResultsList
                suggestions={suggestions}
                query={query}
                onSelect={() => {
                  addSearch(query.trim());
                  closeSearch();
                }}
              />
              <Button
                type="button"
                onClick={() => submit()}
                className="w-full"
                variant="primary"
              >
                عرض كل نتائج البحث لـ «{query.trim()}»
              </Button>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-base font-bold text-foreground">
                لم نجد نتائج مطابقة لـ «{query.trim()}»
              </p>
              <p className="mt-1 text-sm text-muted">
                جرّب البحث بكلمات أخرى أو اختر من التخصصات الشائعة بالأسفل.
              </p>
            </div>
          )
        ) : (
          /* حالة الفراغ: سجل البحث الأخير + التخصصات الشائعة */
          <div className="py-2 space-y-6">
            {/* سجل عمليات البحث الأخيرة */}
            {searches.length > 0 && (
              <div>
                <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-border/60">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted">
                    <IconClock className="h-3.5 w-3.5" />
                    <span>عمليات البحث الأخيرة</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearSearches}
                    className="text-xs font-medium text-muted hover:text-destructive transition-colors"
                  >
                    مسح السجل
                  </button>
                </div>

                <div className="flex flex-col divide-y divide-border/40">
                  {searches.map((item) => (
                    <div
                      key={item}
                      className="group flex items-center justify-between py-2 px-1 rounded-xl transition-colors hover:bg-card"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setQuery(item);
                          submit(item);
                        }}
                        className="flex flex-1 items-center gap-2.5 text-start font-medium text-foreground hover:text-accent transition-colors"
                      >
                        <IconClock className="h-4 w-4 text-muted shrink-0 group-hover:text-accent" />
                        <span className="truncate">{item}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSearch(item);
                        }}
                        aria-label={`حذف «${item}» من السجل`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-muted/15 hover:text-foreground"
                      >
                        <IconX className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* التخصصات الأكثر طلباً */}
            <div>
              <p className="mb-3 text-xs font-bold text-muted uppercase tracking-wider">
                التخصصات الأكثر طلباً في السويس
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_CATEGORIES.map((cat) => {
                  const color = categoryColor(cat.slug);
                  return (
                    <Link
                      key={cat.slug}
                      href={categoryHref(cat.slug)}
                      onClick={() => {
                        addSearch(cat.name);
                        closeSearch();
                      }}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-bold text-foreground transition-all hover:border-accent hover:bg-accent/5 active:scale-95 shadow-xs"
                    >
                      <span style={{ color }}>
                        <CategoryIcon name={cat.slug} className="h-4 w-4" />
                      </span>
                      <span>{cat.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/60 p-4 text-xs text-muted leading-relaxed">
              💡 <strong className="text-foreground">نصيحة:</strong> يمكنك البحث باسم الصنايعي، أو مهنته (سباك، نجار)، أو منطقته (الأربعين، بور توفيق، فيصل...).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
