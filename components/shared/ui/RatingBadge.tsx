import { IconStar } from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";

// شارة ملخص التقييمات (المتوسط + العداد) — لا تظهر عند غياب التقييمات
export function RatingBadge({
  average,
  count,
}: {
  average: number;
  count: number;
}) {
  if (count <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-background border border-border px-3 py-1 text-sm font-bold text-foreground">
      <IconStar className="h-4 w-4 fill-amber-500 text-amber-500" />
      <span>{toArabicDigits(average.toFixed(1))}</span>
      <span className="text-xs font-semibold text-muted">
        ({toArabicDigits(count)})
      </span>
    </span>
  );
}