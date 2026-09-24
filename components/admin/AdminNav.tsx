"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideProps } from "lucide-react";
import {
  IconAlert,
  IconInbox,
  IconLayoutDashboard,
  IconMail,
  IconPin,
  IconTags,
  IconUser,
  IconUsers,
} from "@/components/shared/icons";
import { Badge } from "@/components/shared/ui/Badge";
import type { AdminNavCounts } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";

export type { AdminNavCounts } from "@/lib/db/admin";

type NavItem = {
  href: string;
  label: string;
  icon: (props: LucideProps) => React.JSX.Element;
  countKey?: keyof AdminNavCounts;
};

type NavGroup = {
  id: string;
  /** عناوين المجموعات — الأولى بلا عنوان (نظرة عامة منفردة). */
  label?: string;
  items: NavItem[];
};

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    id: "main",
    items: [{ href: "/admin", label: "نظرة عامة", icon: IconLayoutDashboard }],
  },
  {
    id: "follow-up",
    label: "المتابعة",
    items: [
      { href: "/admin/requests", label: "الطلبات", icon: IconInbox, countKey: "pendingRequests" },
      { href: "/admin/reports", label: "البلاغات", icon: IconAlert, countKey: "pendingReports" },
      { href: "/admin/messages", label: "الرسائل", icon: IconMail, countKey: "unreadMessages" },
    ],
  },
  {
    id: "manage",
    label: "إدارة الدليل",
    items: [
      { href: "/admin/craftsmen", label: "الصنايعية", icon: IconUsers },
      { href: "/admin/users", label: "المستخدمين", icon: IconUser },
      { href: "/admin/categories", label: "التصنيفات", icon: IconTags },
      { href: "/admin/areas", label: "المناطق", icon: IconPin },
    ],
  },
];

/** قائمة مسطّحة للتوافق (عنوان الصفحة الحالي في AdminShell). */
export const ADMIN_NAV_ITEMS: NavItem[] = ADMIN_NAV_GROUPS.flatMap(
  (group) => group.items,
);

/** هل المسار الحالي يطابق رابط عنصر تنقّل؟ (مصدر واحد مشترك بين الـ sidebar والشريط العلوي) */
export function isAdminNavActive(href: string, pathname: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href));
}

/** عنوان الصفحة الحالية من عناصر التنقل — يستخدمه الشريط العلوي في AdminShell. */
export function getAdminNavTitle(pathname: string) {
  return (
    ADMIN_NAV_ITEMS.find((item) => isAdminNavActive(item.href, pathname))?.label ??
    "لوحة التحكم"
  );
}

function NavItemLink({
  item,
  pathname,
  counts,
}: {
  item: NavItem;
  pathname: string;
  counts?: AdminNavCounts;
}) {
  const isActive = isAdminNavActive(item.href, pathname);
  const Icon = item.icon;
  const count = item.countKey && counts ? counts[item.countKey] : 0;
  const showBadge = count > 0;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-bold transition-colors ${
        isActive
          ? "bg-accent/10 text-accent"
          : "text-muted hover:bg-background hover:text-foreground"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
{showBadge && (
        <Badge variant="accent">
          {toArabicDigits(count)}
        </Badge>
      )}
    </Link>
  );
}

export function AdminNav({ counts }: { counts?: AdminNavCounts }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-5" aria-label="التنقل الرئيسي للوحة التحكم">
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.id} className="grid gap-1">
          {group.label && (
            <p className="px-3 text-sm font-bold text-muted">{group.label}</p>
          )}
          {group.items.map((item) => (
            <NavItemLink
              key={item.href}
              item={item}
              pathname={pathname}
              counts={counts}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}
