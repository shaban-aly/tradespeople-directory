import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import Link from "next/link";

/**
 * الأزرار الموحّدة للوحة تحكّم المشرف — المفردات الوحيدة لأي زر إجراء في اللوحة:
 * يبقى اللون/الحدود/الحجم في مكان واحد، ويمنع كتابة أنماط أزرار يدوياً inline.
 * (مستثنى منها عمداً: أزرار triggers مثل فتح القوائم والبحث، والتبويبات، والـ dropdowns، وملصقات رفع الصور.)
 */

export type AdminButtonVariant =
  | "primary" // تعبئة accent — حفظ/إرسال/تأكيد محايد
  | "action" // تعبئة action — موافقة/مراجعة/نشر
  | "danger" // تعبئة danger — حذف مؤكد
  | "outline" // حواف عادية — تفاصيل/إلغاء/تبديل حالة
  | "outlineDanger" // حواف + نص danger — رفض/إغلاق
  | "accentHover" // حواف + hover accent — تحديث/تعديل
  | "dangerHover" // حواف + hover danger — خروج/حذف
  | "accentLink" // نص accent على حواف — رابط "الكل"
  | "ghost"; // ghost خافت — إلغاء ثانوي

export type AdminButtonSize = "md" | "sm" | "icon";

const baseClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl font-bold transition-colors active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const variantClasses: Record<AdminButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent/90",
  action: "bg-action text-on-action hover:bg-action/90",
  danger: "bg-danger text-on-accent hover:bg-danger/90",
  outline: "border border-border text-muted hover:text-foreground",
  outlineDanger:
    "border border-danger/40 text-danger hover:border-danger hover:bg-danger/10",
  accentHover: "border border-border text-foreground hover:border-accent hover:text-accent",
  dangerHover: "border border-border text-muted hover:border-danger hover:text-danger",
  accentLink: "border border-border text-accent hover:bg-accent/10",
  ghost: "border border-border text-muted hover:bg-card",
};

const sizeClasses: Record<AdminButtonSize, string> = {
  md: "px-4 text-base",
  sm: "px-4 text-sm",
  icon: "h-12 w-12 p-0",
};

export function adminButtonClasses(
  variant: AdminButtonVariant,
  size: AdminButtonSize = "md",
): string {
  return `${baseClass} ${variantClasses[variant]} ${sizeClasses[size]}`;
}

type AdminButtonProps = {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  className?: string;
  children: ReactNode;
};

type AdminButtonNativeProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  keyof AdminButtonProps
>;

export function AdminButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: AdminButtonProps & AdminButtonNativeProps) {
  return (
    <button
      className={`${adminButtonClasses(variant, size)} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

type AdminButtonLinkProps = {
  href: string;
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  className?: string;
  children: ReactNode;
};

export function AdminButtonLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: AdminButtonLinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof AdminButtonLinkProps>) {
  return (
    <Link
      href={href}
      className={`${adminButtonClasses(variant, size)} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}