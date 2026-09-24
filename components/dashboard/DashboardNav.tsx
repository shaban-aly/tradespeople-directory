"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChart, IconSettings } from "@/components/shared/icons";

export function DashboardNav() {
  const pathname = usePathname();

  const tabs = [
    {
      label: "الإحصائيات والأداء",
      href: "/dashboard",
      active: pathname === "/dashboard",
      icon: <IconChart className="h-5 w-5 shrink-0" />,
    },
    {
      label: "تعديل بيانات البروفايل",
      href: "/dashboard/profile",
      active: pathname === "/dashboard/profile",
      icon: <IconSettings className="h-5 w-5 shrink-0" />,
    },
  ];

  return (
    <nav
      className="flex gap-2 rounded-2xl border border-border/80 bg-card p-1.5 shadow-sm"
      aria-label="أقسام لوحة التحكم"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`
            flex-1 flex items-center justify-center gap-2.5 rounded-xl py-3 px-4
            text-sm sm:text-base font-bold transition-all min-h-12 active:scale-[0.99]
            ${
              tab.active
                ? "bg-accent text-on-accent shadow-md shadow-accent/20"
                : "text-muted hover:text-foreground hover:bg-background/80"
            }
          `}
          aria-current={tab.active ? "page" : undefined}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
