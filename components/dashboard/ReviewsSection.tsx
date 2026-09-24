"use client";

import { useMemo, useState } from "react";
import { toArabicDigits } from "@/lib/utils/format";
import {
  IconCheck,
  IconCopy,
  IconMessageSquare,
  IconStar,
} from "@/components/shared/icons";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { Button } from "@/components/shared/ui/Button";
import { useToast } from "@/hooks/ui/useToast";

interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

interface ReviewsSectionProps {
  rating?: {
    average: number;
    totalReviews: number;
  };
  reviews?: Review[];
  slug?: string;
}

export function ReviewsSection({
  rating = { average: 0, totalReviews: 0 },
  reviews = [],
  slug,
}: ReviewsSectionProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | "all">("all");

  const hasReviews = reviews.length > 0;
  const hasRating = rating.totalReviews > 0;

  // توزيع النجوم
  const breakdown = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews) {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[rounded] = (counts[rounded] || 0) + 1;
    }
    return [5, 4, 3, 2, 1].map((stars) => {
      const count = counts[stars] || 0;
      const pct = rating.totalReviews > 0 ? (count / rating.totalReviews) * 100 : 0;
      return { stars, count, pct };
    });
  }, [reviews, rating.totalReviews]);

  const filteredReviews = useMemo(() => {
    if (selectedStarFilter === "all") return reviews;
    return reviews.filter(
      (r) => Math.min(5, Math.max(1, Math.round(r.rating))) === selectedStarFilter,
    );
  }, [reviews, selectedStarFilter]);

  const handleCopyReviewLink = async () => {
    if (typeof window === "undefined" || !slug) return;
    const url = `${window.location.origin}/craftsman/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("success", "تم نسخ رابط صفحتك لإرساله للعملاء!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast("error", "تعذر نسخ الرابط");
    }
  };

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-card">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base sm:text-lg font-bold text-foreground">
              آراء وتقييمات العملاء
            </h3>
            {hasReviews && (
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                {toArabicDigits(reviews.length)} رأي
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            التقييمات الحقيقية المكتوبة من العملاء في السويس بعد إنجاز العمل
          </p>
        </div>

        {/* ملخص عام مبسط في الهيدر */}
        {hasRating && (
          <div className="flex items-center gap-2 rounded-xl bg-background/60 px-3.5 py-1.5 border border-border/70 w-fit self-start sm:self-auto">
            <div className="flex text-amber-500">
              <IconStar className="h-4 w-4 fill-current" />
            </div>
            <span className="text-sm font-extrabold text-foreground">
              {toArabicDigits(rating.average.toFixed(1))}
            </span>
            <span className="text-xs text-muted">
              ({toArabicDigits(rating.totalReviews)} تقييم)
            </span>
          </div>
        )}
      </div>

      {hasReviews ? (
        <div className="mt-5 space-y-6">
          {/* لوحة توزيع النجوم المتقدمة (Star Rating Breakdown) */}
          <div className="grid gap-6 rounded-2xl border border-border/60 bg-background/50 p-4 sm:p-5 md:grid-cols-3 md:items-center">
            {/* Score Big Display */}
            <div className="flex flex-col items-center justify-center text-center border-b border-border/60 pb-4 md:border-b-0 md:border-e md:pb-0">
              <span className="font-heading text-4xl sm:text-5xl font-black text-foreground">
                {toArabicDigits(rating.average.toFixed(1))}
              </span>
              <div className="mt-2 flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <IconStar
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(rating.average)
                        ? "fill-current text-amber-500"
                        : "text-border"
                    }`}
                  />
                ))}
              </div>
              <span className="mt-1 text-xs font-medium text-muted">
                بناءً على {toArabicDigits(rating.totalReviews)} تقييم مسجل
              </span>
            </div>

            {/* Bars Column */}
            <div className="space-y-2 md:col-span-2">
              {breakdown.map((row) => (
                <button
                  key={row.stars}
                  type="button"
                  onClick={() =>
                    setSelectedStarFilter((prev) =>
                      prev === row.stars ? "all" : row.stars,
                    )
                  }
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-card ${
                    selectedStarFilter === row.stars
                      ? "bg-card font-bold"
                      : "text-muted"
                  }`}
                >
                  <span className="flex w-12 shrink-0 items-center justify-end gap-1 font-semibold text-foreground">
                    <span>{toArabicDigits(row.stars)}</span>
                    <IconStar className="h-3 w-3 fill-current text-amber-500" />
                  </span>

                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/60">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>

                  <span className="w-10 text-left font-mono text-[11px] text-muted">
                    {toArabicDigits(row.count)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedStarFilter("all")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                selectedStarFilter === "all"
                  ? "bg-accent text-accent-foreground shadow-xs"
                  : "bg-muted/10 text-muted hover:bg-muted/20 hover:text-foreground"
              }`}
            >
              الكل ({toArabicDigits(reviews.length)})
            </button>
            {[5, 4, 3, 2, 1].map((s) => {
              const count = breakdown.find((b) => b.stars === s)?.count ?? 0;
              if (count === 0) return null;
              const isActive = selectedStarFilter === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedStarFilter(s)}
                  className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-accent text-accent-foreground shadow-xs"
                      : "bg-muted/10 text-muted hover:bg-muted/20 hover:text-foreground"
                  }`}
                >
                  <span>{toArabicDigits(s)} نجوم</span>
                  <span className="text-[10px]">({toArabicDigits(count)})</span>
                </button>
              );
            })}
          </div>

          {/* Review Cards Grid */}
          {filteredReviews.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted">
              لا توجد تقييمات مطابقة لهذا الفلتر.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="flex flex-col justify-between rounded-2xl border border-border/70 bg-background/50 p-4 transition-all hover:border-accent/30 hover:bg-background/80"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-sm font-extrabold text-accent">
                          {rev.author.charAt(0) || "ع"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">
                            {rev.author}
                          </p>
                          <p className="text-[11px] text-muted">
                            {new Date(rev.date).toLocaleDateString("ar-EG", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <IconStar
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < rev.rating
                                ? "fill-current text-amber-500"
                                : "text-border"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {rev.comment ? (
                      <p className="mt-3 text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
                        «{rev.comment}»
                      </p>
                    ) : (
                      <p className="mt-3 text-xs italic text-muted">
                        تقييم بالنجوم بدون تعليق مكتوب
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* في حال لم تكن هناك تقييمات بعد — كارت ذكي تفاعلي */
        <div className="mt-5 rounded-2xl border border-border/70 bg-background/50 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <IconMessageSquare className="h-6 w-6" />
          </div>
          <h4 className="font-heading text-base font-bold text-foreground">
            لا توجد تقييمات مسجلة بعد
          </h4>
          <p className="mx-auto mt-1 max-w-md text-xs sm:text-sm text-muted leading-relaxed">
            التقييمات الإيجابية من عملائك في السويس هي أكبر عامل لجذب زبائن جدد. شارك رابط صفحتك مع زبائنك الحاليين بعد إنجاز العمل واطلب منهم تقييمك!
          </p>

          {slug && (
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyReviewLink}
                className="min-h-11 text-xs sm:text-sm font-semibold gap-2"
              >
                {copied ? (
                  <>
                    <IconCheck className="h-4 w-4 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      تم نسخ الرابط!
                    </span>
                  </>
                ) : (
                  <>
                    <IconCopy className="h-4 w-4" />
                    <span>نسخ رابط صفحتي لطلب تقييم</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
