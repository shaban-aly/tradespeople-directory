import { craftColor, craftInitials } from "@/lib/utils/craftAvatar";

// Avatar مولّد من اسم الصنايعي (حروف أولى + لون ثابت) — يُستخدم
// عندما لا توجد صورة للصنايعي، ليكون هناك تمييز بصري بدل أيقونة عامة.
// اللون مأخوذ من ألوان التصنيفات المثبتة في globals.css (cat-1..12).
export function CraftsmanAvatar({
  name,
  className = "",
  textClassName = "",
}: {
  name: string;
  className?: string;
  textClassName?: string;
}) {
  const color = craftColor(name);
  return (
    <div
      className={`flex items-center justify-center select-none ${className}`}
      style={{ backgroundColor: color }}
      role="img"
      aria-label={name}
    >
      <span
        className={`font-heading font-bold text-white ${textClassName}`}
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}
        dir="auto"
      >
        {craftInitials(name)}
      </span>
    </div>
  );
}
