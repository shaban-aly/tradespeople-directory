"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  IconBell,
  IconChart,
  IconSettings,
} from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";

export interface DashboardSubnavProps {
  /** عدد العروض المفتوحة لإظهار شارة تنبيه على تبويب العروض */
  openLeadsCount?: number;
  /** وضع مدمج داخل كارت الترويسة الموحدة دون إطار مكرر */
  embedded?: boolean;
  className?: string;
}

interface NavTab {
  href: string;
  desktopLabel: string;
  mobileLabel: string;
  icon: typeof IconChart;
  isLeads?: boolean;
}

const TABS: NavTab[] = [
  {
    href: "/dashboard",
    desktopLabel: "نظرة عامة والإحصائيات",
    mobileLabel: "الرئيسية",
    icon: IconChart,
  },
  {
    href: "/dashboard/leads",
    desktopLabel: "عروض العملاء والطلبات",
    mobileLabel: "الطلبات",
    icon: IconBell,
    isLeads: true,
  },
  {
    href: "/dashboard/profile",
    desktopLabel: "تعديل الملف المهني",
    mobileLabel: "الملف",
    icon: IconSettings,
  },
];

function SubnavInner({ openLeadsCount, embedded = false, className = "" }: DashboardSubnavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const craftsman = searchParams.get("craftsman");

  const containerClass = embedded
    ? `w-full rounded-2xl bg-muted/15 p-1 sm:p-1.5 ${className}`
    : `w-full rounded-2xl border border-border/80 bg-card p-1 sm:p-1.5 shadow-xs ${className}`;

  return (
    <nav
      aria-label="أقسام لوحة التحكم الرئيسية"
      className={containerClass}
    >
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          const href = craftsman
            ? `${tab.href}?craftsman=${encodeURIComponent(craftsman)}`
            : tab.href;

          return (
            <Link
              key={tab.href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex min-h-11 sm:min-h-12 items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all select-none ${
                active
                  ? "bg-accent text-on-accent shadow-xs"
                  : "text-muted hover:text-foreground hover:bg-muted/15"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                  active ? "text-on-accent" : "text-muted group-hover:text-foreground"
                }`}
              />
              <span className="truncate hidden sm:inline">{tab.desktopLabel}</span>
              <span className="whitespace-nowrap sm:hidden">{tab.mobileLabel}</span>

              {tab.isLeads && typeof openLeadsCount === "number" && openLeadsCount > 0 && (
                <span
                  className={`inline-flex shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-black transition-colors ${
                    active
                      ? "bg-on-accent/20 text-on-accent"
                      : "bg-accent/15 text-accent"
                  }`}
                  aria-label={`${toArabicDigits(openLeadsCount)} طلبات جديدة`}
                >
                  {toArabicDigits(openLeadsCount)}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function DashboardSubnav(props: DashboardSubnavProps) {
  return (
    <Suspense
      fallback={
        <nav
          aria-label="أقسام لوحة التحكم"
          className={`w-full h-14 rounded-2xl animate-pulse ${
            props.embedded ? "bg-muted/15" : "border border-border/80 bg-card/60"
          }`}
        />
      }
    >
      <SubnavInner {...props} />
    </Suspense>
  );
}
