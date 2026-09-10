import { isValidElement, type ReactNode } from "react";
import { ButtonLink, type ButtonVariant } from "@/components/shared/ui/Button";
import { IconArrow } from "@/components/shared/icons";

export type SectionHeaderAction = {
  label: string;
  href: string;
  count?: number | string;
  variant?: ButtonVariant;
};

export type SectionHeaderProps = {
  eyebrow: string;
  title: string | ReactNode;
  description?: string;
  icon?: ReactNode;
  action?: SectionHeaderAction | ReactNode;
  align?: "center" | "start";
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  icon,
  action,
  align,
  className = "",
}: SectionHeaderProps) {
  const isSplit = Boolean(action) && align !== "center";

  return (
    <div
      className={`mb-8 sm:mb-10 ${
        isSplit
          ? "flex flex-col gap-4 text-start sm:flex-row sm:items-end sm:justify-between"
          : "text-center flex flex-col items-center"
      } ${className}`}
    >
      <div className={isSplit ? "max-w-2xl min-w-0" : "mx-auto max-w-2xl"}>
        {/* Eyebrow Badge مع الأيقونة التعريفية */}
        <div
          className={`mb-2.5 sm:mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3.5 py-1 text-xs sm:text-sm font-bold text-accent shadow-2xs backdrop-blur-sm ${
            !isSplit ? "mx-auto" : ""
          }`}
        >
          {icon ? (
            <span className="shrink-0 flex items-center justify-center text-accent">
              {icon}
            </span>
          ) : (
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
          )}
          <span>{eyebrow}</span>
        </div>

        {/* العنوان الرئيسي */}
        <h2 className="font-heading text-2xl font-extrabold sm:text-3xl lg:text-4xl text-foreground tracking-tight leading-snug">
          {title}
        </h2>

        {/* الوصف */}
        {description && (
          <p
            className={`mt-2 text-sm sm:text-base text-muted leading-relaxed ${
              !isSplit ? "mx-auto" : ""
            }`}
          >
            {description}
          </p>
        )}
      </div>

      {/* زر الإجراء (عرض المزيد / كل التخصصات) */}
      {action && (
        <div className="shrink-0 pt-1 sm:pt-0">
          {isValidElement(action) ? (
            action
          ) : (
            <ButtonLink
              href={(action as SectionHeaderAction).href}
              variant={(action as SectionHeaderAction).variant || "ghost"}
              size="sm"
              className="group font-bold text-xs sm:text-sm shadow-2xs"
            >
              <span>{(action as SectionHeaderAction).label}</span>
              {(action as SectionHeaderAction).count !== undefined && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent font-extrabold">
                  {(action as SectionHeaderAction).count}
                </span>
              )}
              <IconArrow className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1 text-muted group-hover:text-accent" />
            </ButtonLink>
          )}
        </div>
      )}
    </div>
  );
}
