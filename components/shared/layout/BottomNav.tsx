"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconGrid,
  IconSearch,
  IconStar,
  IconUser,
} from "@/components/shared/icons";
import { useFavorites } from "@/hooks/useFavorites";
import { useSession } from "@/hooks/auth/useSession";
import { useSearchModal } from "@/hooks/search/useSearchModal";
import { toArabicDigits } from "@/lib/utils/format";

export function BottomNav() {
  const pathname = usePathname();
  const { count: favoritesCount } = useFavorites();
  const { profile, isLoggedIn } = useSession();
  const { isOpen: isSearchOpen, openSearch } = useSearchModal();

  // عدم إظهار الشريط السفلي داخل لوحة تحكم المشرف أو شاشة تسجيل الدخول
  if (pathname?.startsWith("/admin") || pathname === "/login") {
    return null;
  }

  const items = [
    {
      id: "home",
      label: "الرئيسية",
      href: "/",
      icon: IconHome,
      isActive: pathname === "/",
    },
    {
      id: "categories",
      label: "التصنيفات",
      href: "/categories",
      icon: IconGrid,
      isActive: pathname === "/categories" || pathname?.startsWith("/category/"),
    },
    {
      id: "search",
      label: "البحث",
      icon: IconSearch,
      isActive: pathname === "/search" || isSearchOpen,
      onClick: () => openSearch(),
      isProminent: true,
    },
    {
      id: "favorites",
      label: "المفضلة",
      href: "/favorites",
      icon: IconStar,
      isActive: pathname === "/favorites",
      badge: favoritesCount > 0 ? favoritesCount : null,
    },
    {
      id: "profile",
      label: "حسابي",
      href: isLoggedIn ? "/profile" : "/login",
      icon: IconUser,
      isActive:
        pathname === "/profile" ||
        pathname?.startsWith("/dashboard") ||
        pathname?.startsWith("/activity"),
      isUser: isLoggedIn && Boolean(profile?.avatarUrl),
      avatarUrl: profile?.avatarUrl ?? undefined,
    },
  ];

  return (
    <nav
      aria-label="شريط التنقل السفلي"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-md supports-backdrop-filter:bg-card/85 sm:hidden pb-[max(env(safe-area-inset-bottom),8px)]"
    >
      <div className="relative flex items-center justify-around px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          // 1. زر البحث المركزي البارز بنوتش دائري مرتفع
          if (item.isProminent) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                aria-label={item.label}
                className="relative -mt-6 flex flex-1 flex-col items-center justify-center group focus:outline-none"
              >
                {/* النوتش الدائري الحاضن للزر */}
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-t border-x border-border bg-card p-1 shadow-md transition-transform group-active:scale-95">
                  <div
                    className={`flex h-full w-full items-center justify-center rounded-full transition-all duration-200 shadow-sm ${
                      active
                        ? "bg-accent text-on-accent ring-2 ring-accent/30 shadow-accent/40 scale-105"
                        : "bg-accent text-on-accent hover:brightness-105"
                    }`}
                  >
                    <Icon className="h-5 w-5 stroke-[2.3]" />
                  </div>
                </div>

                {/* نص التسمية مع تباعد متناسق */}
                <span
                  className={`mt-1 text-[11px] leading-tight transition-colors ${
                    active
                      ? "font-bold text-accent"
                      : "font-medium text-muted group-hover:text-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          // 2. العناصر الاعتيادية الأربعة
          const content = (
            <>
              {/* شرطة التفعيل بالأعلى ملتصقة بالحافة العلوية لشريط التنقل */}
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute -top-px left-1/2 -translate-x-1/2 h-0.75 w-8 rounded-b-full bg-accent shadow-xs animate-in fade-in duration-150"
                />
              )}

              {/* الأيقونة أو الأفاتار */}
              <div className="relative flex items-center justify-center">
                {item.isUser && item.avatarUrl ? (
                  <div
                    className={`h-6 w-6 overflow-hidden rounded-full border transition-all ${
                      active ? "border-accent ring-2 ring-accent/30" : "border-border"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.avatarUrl}
                      alt="حسابي"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <Icon
                    className={`h-5 w-5 transition-transform duration-150 ${
                      active ? "scale-110 fill-current" : ""
                    }`}
                  />
                )}

                {/* بادج العداد الرقمي (للمفضلة) */}
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent shadow-xs">
                    {toArabicDigits(item.badge)}
                  </span>
                )}
              </div>

              {/* نص العنصر */}
              <span className="text-[11px] leading-tight">
                {item.label}
              </span>
            </>
          );

          const className = `relative flex flex-1 flex-col items-center justify-center pt-2.5 pb-1.5 gap-1 transition-colors ${
            active
              ? "text-accent font-bold"
              : "text-muted hover:text-foreground"
          }`;

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={className}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
