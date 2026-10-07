import Link from "next/link";
import type { ReactNode } from "react";
import { IconChevronLeft } from "@/components/shared/icons";

export type RowAccent = "accent" | "action" | "amber";

const ACCENT_TILE: Record<RowAccent, string> = {
  accent: "bg-accent/10 text-accent",
  action: "bg-action/15 text-action",
  amber: "bg-amber-500/15 text-amber-500",
};

const ACCENT_HOVER: Record<RowAccent, string> = {
  accent: "group-hover:text-accent",
  action: "group-hover:text-action",
  amber: "group-hover:text-amber-500",
};

const BADGE_DEFAULT: Record<RowAccent, string> = {
  accent: "bg-accent/10 text-accent",
  action: "bg-action/10 text-action",
  amber: "bg-amber-500/10 text-amber-500",
};

/**
 * صف رابط موحّد داخل مجموعات صفحة الحساب
 * (عرض خالص — بدون "use client").
 */
export function ProfileLinkRow({
  href,
  icon,
  title,
  description,
  badge,
  accent = "accent",
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  badge?: { label: string; className?: string };
  accent?: RowAccent;
}) {
  const hoverClass = ACCENT_HOVER[accent];

  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-accent/5 group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ACCENT_TILE[accent]}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p
            className={`text-base font-bold text-foreground transition-colors ${hoverClass}`}
          >
            {title}
          </p>
          <p className="text-xs text-muted truncate">{description}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {badge && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              badge.className ?? BADGE_DEFAULT[accent]
            }`}
          >
            {badge.label}
          </span>
        )}
        <IconChevronLeft
          className={`h-5 w-5 text-muted transition-transform group-hover:-translate-x-1 ${hoverClass}`}
        />
      </div>
    </Link>
  );
}
