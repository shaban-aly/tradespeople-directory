"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { useFavorites } from "@/hooks/craftsman/useFavorites";
import { CraftsmanGrid } from "@/components/shared/ui/CraftsmanGrid";
import { ButtonLink } from "@/components/shared/ui/Button";
import { FavoritesGridSkeleton } from "@/components/favorites/FavoritesSkeleton";
import { IconBookmark, IconRotateCcw } from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";

export function FavoritesPanel({
  craftsmen,
  categories,
}: {
  craftsmen: Craftsman[];
  categories: Category[];
}) {
  const { favorites, count, isLoaded, restoreFavorite } = useFavorites();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // إدارة حالة التراجع (Undo) عند إلغاء الحفظ
  const [undoItem, setUndoItem] = useState<{ slug: string; name: string } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousFavoritesRef = useRef<string[]>(favorites);

  useEffect(() => {
    // مقارنة القائمة السابقة بالحالية لاكتشاف المحذوف
    const prev = previousFavoritesRef.current;
    if (prev.length > favorites.length) {
      const removedSlug = prev.find((slug) => !favorites.includes(slug));
      if (removedSlug) {
        const removedCraftsman = craftsmen.find((c) => c.slug === removedSlug);
        if (removedCraftsman) {
          setUndoItem({ slug: removedSlug, name: removedCraftsman.name });
          if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
          undoTimeoutRef.current = setTimeout(() => {
            setUndoItem(null);
          }, 5000);
        }
      }
    }
    previousFavoritesRef.current = favorites;
  }, [favorites, craftsmen]);

  // تنظيف الـ timeout عند فك المكون
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  const handleUndo = () => {
    if (!undoItem) return;
    restoreFavorite(undoItem.slug);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoItem(null);
  };

  const saved = useMemo(
    () => craftsmen.filter((craftsman) => favorites.includes(craftsman.slug)),
    [craftsmen, favorites],
  );

  // استخراج التصنيفات الموجودة فعلياً بين المحفوظات
  const savedCategorySlugs = useMemo(() => {
    return Array.from(new Set(saved.map((c) => c.category)));
  }, [saved]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.slug, c]));
  }, [categories]);

  // تصفية المحفوظات حسب التخصص إن تم اختياره
  const displayed = useMemo(() => {
    if (!selectedCategory) return saved;
    return saved.filter((c) => c.category === selectedCategory);
  }, [saved, selectedCategory]);

  // حالة التحميل أثناء الـ hydration لمنع وميض الفراغ
  if (!isLoaded) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-36 animate-pulse rounded-md bg-border/70" />
        <FavoritesGridSkeleton count={4} />
      </div>
    );
  }

  // الحالة الفارغة
  if (saved.length === 0) {
    return (
      <>
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 text-center shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <IconBookmark className="h-8 w-8" />
          </div>

          <h2 className="mt-5 font-heading text-xl sm:text-2xl font-bold text-foreground">
            لسه مفيش صنايعية محفوظين
          </h2>

          <p className="mx-auto mt-2.5 max-w-md text-base text-muted leading-relaxed">
            احفظ أي فني أو صنايعي في السويس بضغطة زر النجمة، وهتلاقيه محفوظ هنا
            للتواصل المباشر معاه في أي وقت حتى بدون بحث.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-bold text-muted ml-1">تصفّح سريع:</span>
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-bold text-foreground hover:border-accent hover:text-accent transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <div className="mt-7">
            <ButtonLink href="/categories">
              تصفّح كل التصنيفات
            </ButtonLink>
          </div>
        </div>

        {/* شريط التراجع في حال حذف آخر عنصر */}
        {undoItem && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md sm:bottom-8 animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3.5 shadow-2xl backdrop-blur-md">
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <span className="text-muted shrink-0">تمت إزالة</span>
                <span className="truncate font-bold text-foreground">
                  «{undoItem.name}»
                </span>
                <span className="text-muted shrink-0">من المحفوظات</span>
              </div>
              <button
                type="button"
                onClick={handleUndo}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-bold text-on-accent shadow-xs transition-transform hover:bg-accent/90 active:scale-95"
              >
                <IconRotateCcw className="h-3.5 w-3.5" />
                <span>تراجع</span>
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <CraftsmanGrid
        craftsmen={displayed}
        categories={categories}
        toolbar={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
              <p className="text-base font-bold text-foreground">
                {toArabicDigits(saved.length)}{" "}
                {saved.length === 1 ? "صنايعي محفوظ" : "صنايعية محفوظين"}
              </p>
            </div>

            {/* فلاتر التخصص إن كان هناك أكثر من تخصص واحد */}
            {savedCategorySlugs.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    selectedCategory === null
                      ? "bg-accent text-on-accent shadow-2xs"
                      : "border border-border bg-card text-muted hover:text-foreground"
                  }`}
                >
                  الكل ({toArabicDigits(saved.length)})
                </button>
                {savedCategorySlugs.map((slug) => {
                  const cat = categoryMap.get(slug);
                  if (!cat) return null;
                  const catCount = saved.filter((c) => c.category === slug).length;
                  const isActive = selectedCategory === slug;
                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => setSelectedCategory(isActive ? null : slug)}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                        isActive
                          ? "bg-accent text-on-accent shadow-2xs"
                          : "border border-border bg-card text-muted hover:text-foreground"
                      }`}
                    >
                      {cat.name} ({toArabicDigits(catCount)})
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        }
      />

      {/* شريط التراجع العائم السريع (Undo Toast) */}
      {undoItem && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md sm:bottom-8 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="text-muted shrink-0">تمت إزالة</span>
              <span className="truncate font-bold text-foreground">
                «{undoItem.name}»
              </span>
              <span className="text-muted shrink-0">من المحفوظات</span>
            </div>
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-bold text-on-accent shadow-xs transition-transform hover:bg-accent/90 active:scale-95"
            >
              <IconRotateCcw className="h-3.5 w-3.5" />
              <span>تراجع</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
