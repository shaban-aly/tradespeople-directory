"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideProps } from "lucide-react";
import {
  IconInbox,
  IconLayoutDashboard,
  IconMail,
  IconPin,
  IconTags,
  IconUsers,
} from "@/components/shared/icons";

type NavItem = {
  href: string;
  label: string;
  icon: (props: LucideProps) => React.JSX.Element;
};

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "نظرة عامة", icon: IconLayoutDashboard },
  { href: "/admin/requests", label: "الطلبات", icon: IconInbox },
  { href: "/admin/messages", label: "الرسائل", icon: IconMail },
  { href: "/admin/craftsmen", label: "الصنايعية", icon: IconUsers },
  { href: "/admin/categories", label: "التصنيفات", icon: IconTags },
  { href: "/admin/areas", label: "المناطق", icon: IconPin },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1">
      {ADMIN_NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-bold transition-colors ${
              isActive
                ? "bg-accent/10 text-accent"
                : "text-muted hover:bg-background hover:text-foreground"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
