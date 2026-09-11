import { toArabicDigits } from "@/lib/utils/format";
import { IconMessageSquare, IconStar } from "@/components/shared/icons";
import { EmptyState } from "@/components/shared/ui/EmptyState";

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
}

export function ReviewsSection({
  rating = { average: 0, totalReviews: 0 },
  reviews = [],
}: ReviewsSectionProps) {
  const hasReviews = reviews.length > 0;
  const hasRating = rating.totalReviews > 0;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-lg font-bold text-foreground">
              آراء وتقييمات العملاء
            </h3>
            {hasReviews && (
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                {toArabicDigits(reviews.length)} رأي
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            التقييمات الحقيقية المكتوبة من العملاء الذين تواصلوا معك بعد إنجاز العمل
          </p>
        </div>

        {/* ملخص النجوم — يظهر فقط عند وجود تقييمات مسجلة */}
        <div className="flex items-center gap-2.5 rounded-xl bg-background px-4 py-2 border border-border w-fit">
          {hasRating ? (
            <div className="flex items-center gap-2.5">
              <div className="flex text-amber-500">
                <IconStar className="h-5 w-5 fill-current" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground leading-none">
                  {toArabicDigits(rating.average.toFixed(1))} / {toArabicDigits(5)}
                </p>
                <p className="text-[11px] text-muted leading-none mt-1">
                  {toArabicDigits(rating.totalReviews)} تقييم مسجل
                </p>
              </div>
            </div>
          ) : (
            <span className="text-sm font-bold text-accent">جديد</span>
          )}
        </div>
      </div>

      {hasReviews ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-background/50 p-4 transition-colors hover:border-accent/30"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                      {rev.author.charAt(0) || "ع"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground line-clamp-1">
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

                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <IconStar
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < rev.rating ? "fill-current" : "text-border"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {rev.comment && (
                  <p className="mt-3 text-sm text-foreground/90 leading-relaxed">
                    «{rev.comment}»
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* في حال لم تكن هناك تقييمات بعد */
        <div className="mt-5">
          <EmptyState
            icon={<IconMessageSquare className="h-6 w-6" />}
            title="لا توجد تقييمات مسجلة بعد"
            description="عندما يتواصل معك العملاء ويقومون بتقييم خدمتك من صفحتك الشخصية، ستظهر كل التعليقات والنجوم هنا فوراً لتعزيز سمعتك وثقة الزوار الجدد فيك!"
          />
        </div>
      )}
    </section>
  );
}
