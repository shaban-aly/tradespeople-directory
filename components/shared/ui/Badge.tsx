type BadgeVariant = "danger" | "action" | "accent" | "neutral";
type BadgeSize = "sm" | "md";

const variantClass: Record<BadgeVariant, string> = {
  danger: "bg-danger text-on-danger",
  action: "bg-action text-on-action",
  accent: "bg-accent text-on-accent",
  neutral: "bg-muted/15 text-muted",
};

const sizeClass: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-sm",
  md: "px-2.5 py-1 text-base",
};

/**
 * شارة عدّاد/حالة موحّدة للوحة التحكم — تُستخدم لكل الأرقام والشارات
 * (عدّادات sidebar، عدّادات الفلاتر، شارة "جديد"). كل الأرقام تُمرَّر بـ toArabicDigits.
 */
export function Badge({
  variant = "neutral",
  size = "sm",
  children,
}: {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold leading-none ${variantClass[variant]} ${sizeClass[size]}`}
    >
      {children}
    </span>
  );
}