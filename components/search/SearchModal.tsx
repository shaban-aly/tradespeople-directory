"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchModal } from "@/hooks/search/useSearchModal";
import { useSearch } from "@/hooks/search/useSearch";
import { useRecentSearches } from "@/hooks/search/useRecentSearches";
import { useFocusTrap } from "@/hooks/ui/useFocusTrap";
import { useBodyScrollLock } from "@/hooks/ui/useBodyScrollLock";
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { suggestions, loading } = useSearch(isOpen ? query : "", isOpen);

  useBodyScrollLock(isOpen);
  useFocusTrap(containerRef, isOpen, {
    initialFocusRef: inputRef,
    onClose: closeSearch,
  });

  // تصفير نص البحث عند فتح النافذة (ضبط الحالة أثناء الريندر بدل useEffect)
  const [prevOpen, setPrevOpen] = useState({ isOpen, initialQuery });
  if (
    isOpen &&
    (prevOpen.isOpen !== isOpen || prevOpen.initialQuery !== initialQuery)
  ) {
    setPrevOpen({ isOpen, initialQuery });
    setQuery(initialQuery || "");
    setActiveIndex(-1);
  }

  if (!isOpen) return null;

  function submit(targetQuery?: string) {
    const q = (targetQuery ?? query).trim();
    if (!q) return;
    addSearch(q);
    closeSearch();
    router.push(searchHref({ q }));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      const picked = suggestions[activeIndex];
      addSearch(picked.name);
      closeSearch();
      router.push(picked.href);
    }
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm md:flex md:items-start md:justify-center md:pt-20"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSearch();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="نافذة البحث السريع"
        tabIndex={-1}
        className="flex h-full w-full flex-col bg-background/98 focus:outline-none md:h-auto md:max-h-[85vh] md:w-full md:max-w-3xl md:rounded-2xl md:border md:border-border md:shadow-2xl overflow-hidden"
      >
        {/* رأس النافذة مع حقل البحث */}
        <div className="flex items-center gap-2 border-b border-border bg-card/80 px-4 py-3 md:rounded-t-2xl">
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
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="ابحث عن صنايعي، تخصص، أو منطقة بالسويس..."
              aria-label="نص البحث"
              className="min-h-12 w-full rounded-full border border-border bg-background py-2 pe-10 ps-12 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none shadow-xs"
            />

            {query.trim().length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveIndex(-1);
                }}
                aria-label="مسح النص"
                className="absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-muted/15 hover:text-foreground transition-colors"
              >
                <IconX className="h-4 w-4" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute left-3.5 top-1/2 hidden -translate-y-1/2 rounded border border-border/80 bg-muted/20 px-1.5 py-0.5 font-mono text-xs text-muted md:inline-block">
                ESC
              </kbd>
            )}
          </form>
        </div>

        {/* محتوى النتائج والاقتراحات */}
        <div className="flex-1 overflow-y-auto px-4 py-4 w-full">
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
                  activeIndex={activeIndex}
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
              <div className="py-6 text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <IconSearch className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-base font-bold text-foreground">
                    لم نجد نتائج سريعة لـ «{query.trim()}»
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-muted">
                    جرّب البحث بكلمة مختلفة، أو اختر تخصصاً من المقترحات أدناه.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => submit()}
                    className="w-full sm:w-auto min-h-10 text-sm"
                  >
                    البحث الشامل لـ «{query.trim()}»
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setQuery("");
                      setActiveIndex(-1);
                    }}
                    className="w-full sm:w-auto min-h-10 text-sm text-muted hover:text-foreground"
                  >
                    مسح كلمة البحث
                  </Button>
                </div>

                {/* التخصصات الأكثر طلباً */}
                <div className="pt-2 text-start">
                  <p className="mb-2.5 text-xs font-bold text-muted">
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
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-xs sm:text-sm font-semibold text-foreground transition-all hover:border-accent hover:bg-accent/5 active:scale-95 shadow-2xs"
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

                {/* اقتراح إضافة فني جديد كشريط خفيف مدمج */}
                <div className="pt-2 text-center text-xs text-muted">
                  <span>مش لاقي الصنايعي المطلوب؟ </span>
                  <Link
                    href="/join"
                    onClick={closeSearch}
                    className="font-bold text-accent hover:underline inline-flex items-center gap-0.5"
                  >
                    أضف صنايعي جديد للدليل ←
                  </Link>
                </div>
              </div>
            )
          ) : (
            /* حالة الفراغ: سجل البحث الأخير + التخصصات الشائعة */
            <div className="py-2 space-y-6 pb-6 md:pb-2">
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
                      className="text-xs font-medium text-muted hover:text-danger transition-colors"
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
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
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
                <p className="mb-2.5 text-xs font-bold text-muted">
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
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-xs sm:text-sm font-semibold text-foreground transition-all hover:border-accent hover:bg-accent/5 active:scale-95 shadow-2xs"
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

              <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 text-xs text-muted leading-relaxed">
                💡 <strong className="text-foreground">نصيحة:</strong> يمكنك البحث باسم الصنايعي، أو مهنته (سباك، نجار)، أو منطقته (الأربعين، بور توفيق، فيصل...).
              </div>
            </div>
          )}
        </div>

        {/* شريط اختصارات لوحة المفاتيح في الديسكتوب */}
        <div className="hidden md:flex items-center justify-between border-t border-border/70 bg-card/50 px-4 py-2.5 text-xs text-muted select-none">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="inline-flex h-5 items-center justify-center rounded border border-border/80 bg-background px-1.5 font-mono text-xs font-semibold text-foreground shadow-2xs">↑</kbd>
              <kbd className="inline-flex h-5 items-center justify-center rounded border border-border/80 bg-background px-1.5 font-mono text-xs font-semibold text-foreground shadow-2xs">↓</kbd>
              <span>للتنقل</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="inline-flex h-5 items-center justify-center rounded border border-border/80 bg-background px-1.5 font-mono text-xs font-semibold text-foreground shadow-2xs">↵</kbd>
              <span>للاختيار</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="inline-flex h-5 items-center justify-center rounded border border-border/80 bg-background px-1.5 font-mono text-xs font-semibold text-foreground shadow-2xs">ESC</kbd>
              <span>للإغلاق</span>
            </span>
          </div>
          <div className="text-xs text-muted font-medium">
            دليل صنايعية السويس
          </div>
        </div>
      </div>
    </div>
  );
}
