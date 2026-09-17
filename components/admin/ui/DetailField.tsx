import type { ReactNode } from "react";

/**
 * شبكة حقول التفاصيل في كروت السجلات والدراوير
 * (grid gap-2 text-base text-muted + أعمدة عبر className).
 */
export function DetailFieldList({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`grid gap-2 text-base text-muted ${className}`}>{children}</div>
  );
}

/**
 * صف حقل واحد: Label غامق + قيمة، مع دعم اتجاه LTR (هواتف/روابط).
 */
export function DetailField({
  label,
  dir,
  className = "",
  children,
}: {
  label: string;
  dir?: "ltr" | "rtl";
  className?: string;
  children: ReactNode;
}) {
  return (
    <p dir={dir} className={className}>
      <span className="font-bold text-foreground">{label}: </span>
      {children}
    </p>
  );
}