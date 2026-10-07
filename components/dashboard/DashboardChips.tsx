"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  IconBell,
  IconChart,
  IconChevronLeft,
  IconSettings,
} from "@/components/shared/icons";

interface DashboardChipsProps {
  variant?: "chips" | "sidebar";
}

const TABS = [
  {
    desktopLabel: "نظرة عامة والإحصائيات",
    mobileLabel: "نظرة عامة",
    href: "/dashboard",
    icon: IconChart,
    desc: "مؤشرات التفاعل ونسب المشاهدات",
  },
  {
    desktopLabel: "عروض العملاء والطلبات",
    mobileLabel: "العروض",
    href: "/dashboard/leads",
    icon: IconBell,
    desc: "طلبات العمل الجديدة المتاحة للرد",
  },
  {
    desktopLabel: "تعديل بيانات الملف المهني",
    mobileLabel: "بروفايلي",
    href: "/dashboard/profile",
    icon: IconSettings,
    desc: "المهنة والواتساب والصور والمنطقة",
  },
];

function ChipsInner({ variant = "chips" }: DashboardChipsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const craftsman = searchParams.get("craftsman");

  if (variant === "sidebar") {
    return (
      <>
        {/* على الموبايل: شريط تبويبات أفقي مدمج متناسق مع كروت التطبيق */}
        <nav
          className="grid grid-cols-3 p-1.5 rounded-2xl bg-card border border-border/80 text-center gap-1.5 shadow-xs lg:hidden"
          aria-label="أقسام لوحة التحكم"
        >
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
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? "bg-accent text-on-accent shadow-xs"
                    : "text-muted hover:text-foreground hover:bg-muted/15"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-on-accent" : "text-muted"}`} />
                <span className="truncate">{tab.mobileLabel}</span>
              </Link>
            );
          })}
        </nav>

        {/* على الديسكتوب: قائمة تنقل عمودية فخمة في السايد بار */}
        <nav
          className="hidden lg:block overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs divide-y divide-border/60"
          aria-label="أقسام لوحة التحكم"
        >
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
                className={`flex items-center justify-between px-4 py-3.5 text-right transition-colors group ${
                  active
                    ? "bg-accent/10 text-accent font-bold"
                    : "hover:bg-muted/20 text-foreground"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      active
                        ? "bg-accent text-on-accent"
                        : "bg-muted/20 text-muted group-hover:bg-accent/10 group-hover:text-accent"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold ${
                        active ? "text-accent" : "text-foreground"
                      }`}
                    >
                      {tab.desktopLabel}
                    </p>
                    <p className="text-xs text-muted truncate">{tab.desc}</p>
                  </div>
                </div>
                <IconChevronLeft
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    active
                      ? "text-accent -translate-x-1"
                      : "text-muted group-hover:-translate-x-1"
                  }`}
                />
              </Link>
            );
          })}
        </nav>
      </>
    );
  }

  return (
    <nav
      className="grid grid-cols-3 p-1.5 rounded-2xl bg-card border border-border/80 text-center gap-1.5 shadow-xs"
      aria-label="أقسام لوحة التحكم"
    >
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
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              active
                ? "bg-accent text-on-accent shadow-xs"
                : "text-muted hover:text-foreground hover:bg-muted/15"
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${active ? "text-on-accent" : "text-muted"}`} />
            <span className="truncate sm:hidden">{tab.mobileLabel}</span>
            <span className="truncate hidden sm:inline">{tab.desktopLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardChips({ variant = "chips" }: DashboardChipsProps) {
  return (
    <Suspense>
      <ChipsInner variant={variant} />
    </Suspense>
  );
}
