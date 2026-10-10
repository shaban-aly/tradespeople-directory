import { IconStar } from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";

// شارة ملخص التقييمات (المتوسط + العداد) — لا تظهر عند غياب التقييمات
export function RatingBadge({
  average,
  count,
  size = "md",
}: {
  average: number;
  count: number;
  size?: "sm" | "md";
}) {
  if (count <= 0) return null;

  const isSmall = size === "sm";

  return (
    <span
      className={
        isSmall
          ? "inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-bold text-foreground shadow-2xs"
          : "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-sm font-bold text-foreground shadow-2xs"
      }
    >
      <IconStar
        className={
          isSmall
            ? "h-3.5 w-3.5 fill-amber-500 text-amber-500"
            : "h-4 w-4 fill-amber-500 text-amber-500"
        }
      />
      <span>{toArabicDigits(average.toFixed(1))}</span>
      <span className="text-xs font-semibold text-muted">
        ({toArabicDigits(count)})
      </span>
    </span>
  );
}