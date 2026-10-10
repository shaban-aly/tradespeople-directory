"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideProps } from "lucide-react";
import {
  IconAlert,
  IconBell,
  IconExternalLink,
  IconGlobe,
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

export type NavItem = {
  href: string;
  label: string;
  icon: (props: LucideProps) => React.JSX.Element;
  countKey?: keyof AdminNavCounts;
  /** رابط خارجي (يُفتح في تبويب جديد ولا يُعامل كصفحة نشطة) */
  external?: boolean;
};

export type NavGroup = {
  id: string;
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
      { href: "/admin/leads", label: "عروض العملاء", icon: IconBell, countKey: "openLeads" },
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
  {
    id: "tools",
    label: "أدوات",
    items: [
      { href: "/admin/broadcast", label: "إشعار جماعي", icon: IconAlert },
      { href: "/admin/diagnostics", label: "تشخيص الإشعارات", icon: IconBell },
    ],
  },
];

/** آخر عنصر في القائمة — خارج مجموعات الصفحات فلا يدخل في بحث العنوان النشط. */
export const ADMIN_NAV_VISIT_ITEM: NavItem = {
  href: "/",
  label: "الانتقال للموقع",
  icon: IconGlobe,
  external: true,
};

export const ADMIN_NAV_ITEMS: NavItem[] = ADMIN_NAV_GROUPS.flatMap(
  (group) => group.items,
);

export function isAdminNavActive(href: string, pathname: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href));
}

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
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  counts?: AdminNavCounts;
  collapsed?: boolean;
}) {
  const isActive = !item.external && isAdminNavActive(item.href, pathname);
  const Icon = item.icon;
  const count = item.countKey && counts ? counts[item.countKey] : 0;
  const showBadge = count > 0;

  return (
    <Link
      href={item.href}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined}
      title={collapsed ? item.label : undefined}
      aria-current={isActive ? "page" : undefined}
      className={`group relative flex min-h-9 items-center rounded-xl text-sm font-semibold transition-all duration-150 ${
        collapsed
          ? "justify-center p-2.5"
          : "gap-2.5 px-3 py-1.5"
      } ${
        isActive
          ? "bg-accent text-accent-foreground shadow-xs font-bold"
          : "text-muted hover:bg-card hover:text-foreground"
      }`}
    >
      <div className="relative shrink-0">
        <Icon className={`h-5 w-5 transition-transform duration-150 ${isActive ? "" : "group-hover:scale-105"}`} />
        {collapsed && showBadge && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-xs font-extrabold leading-none text-on-accent">
            {count > 99 ? "99+" : toArabicDigits(count)}
          </span>
        )}
      </div>

      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.external && (
            <IconExternalLink className="h-3.5 w-3.5 shrink-0 text-muted" />
          )}
          {showBadge && (
            <Badge variant={isActive ? "neutral" : "accent"}>
              {toArabicDigits(count)}
            </Badge>
          )}
        </>
      )}
    </Link>
  );
}

export function AdminNav({
  counts,
  collapsed = false,
}: {
  counts?: AdminNavCounts;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-0.5" aria-label="التنقل الرئيسي للوحة التحكم">
      {ADMIN_NAV_GROUPS.map((group, idx) => (
        <div
          key={group.id}
          role="group"
          aria-label={group.label}
          className="grid gap-0.5"
        >
          {idx > 0 && <hr className="my-1 border-border/60 mx-2" />}
          {group.items.map((item) => (
            <NavItemLink
              key={item.href}
              item={item}
              pathname={pathname}
              counts={counts}
              collapsed={collapsed}
            />
          ))}
        </div>
      ))}
      <hr className="my-1 border-border/60 mx-2" />
      <NavItemLink
        item={ADMIN_NAV_VISIT_ITEM}
        pathname={pathname}
        collapsed={collapsed}
      />
    </nav>
  );
}
