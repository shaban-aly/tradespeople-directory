import { IconCheck, IconClock, IconShieldCheck } from "@/components/shared/icons";

// شريط الميزات الثلاث («خدمة مجانية · تواصل مباشر · صنايعية موثوقين»):
// لغة تصميم مشتركة تُستخدم في هيرو الرئيسية وفوق بطاقة بيانات الصنايعي.
// tone="image" للألوان المخصصة فوق صور الخلفية، tone="surface" فوق الكروت العادية.

interface TrustStripProps {
  tone?: "surface" | "image";
  className?: string;
}

export function TrustStrip({ tone = "surface", className = "" }: TrustStripProps) {
  const onImage = tone === "image";

  const container = onImage
    ? "text-xs sm:text-sm text-foreground/90 whitespace-nowrap drop-shadow-xs font-semibold"
    : "text-sm sm:text-base text-foreground font-semibold";

  const dot = "text-xs text-muted/60";

  const iconSize = onImage ? "h-3.5 w-3.5 sm:h-4 sm:w-4" : "h-4 w-4 sm:h-5 sm:w-5";

  const freeIcon = "text-action";
  const directIcon = "text-accent";
  const trustedIcon = "text-action";

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-2 sm:gap-6 font-bold ${container} ${className}`}
    >
      <div className="flex items-center gap-1 sm:gap-1.5">
        <IconCheck className={`${iconSize} ${freeIcon} shrink-0`} />
        <span>خدمة مجانية</span>
      </div>
      <span className={`${dot}`} aria-hidden>
        ·
      </span>
      <div className="flex items-center gap-1 sm:gap-1.5">
        <IconClock className={`${iconSize} ${directIcon} shrink-0`} />
        <span>تواصل مباشر</span>
      </div>
      <span className={`${dot}`} aria-hidden>
        ·
      </span>
      <div className="flex items-center gap-1 sm:gap-1.5">
        <IconShieldCheck className={`${iconSize} ${trustedIcon} shrink-0`} />
        <span>صنايعية موثوقين</span>
      </div>
    </div>
  );
}