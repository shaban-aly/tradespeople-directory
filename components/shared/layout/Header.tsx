import Link from "next/link";
import { SiteNavLinks } from "@/components/shared/layout/SiteNavLinks";
import { ThemeToggle } from "@/components/shared/ui/ThemeToggle";
import { UserMenu } from "@/components/shared/layout/UserMenu";
import { NotificationsBell } from "@/components/shared/layout/NotificationsBell";
import { HeaderSearchButton } from "@/components/shared/layout/HeaderSearchButton";
import { ButtonLink } from "@/components/shared/ui/Button";
import { IconPlus } from "@/components/shared/icons";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/75 shadow-xs transition-colors">
      <div className="relative">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3">
          {/* الشعار والهوية البصرية */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2 sm:gap-2.5 transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
            aria-label="دليل الصنايعية — الصفحة الرئيسية"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/favicon-96x96.png"
              alt="دليل الصنايعية"
              width={96}
              height={96}
              fetchPriority="high"
              decoding="async"
              className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 shrink-0 object-contain transition-transform group-hover:scale-105"
            />
            <span className="font-heading text-lg sm:text-xl md:text-2xl font-black text-foreground tracking-tight">
              دليل الصنايعية
            </span>
          </Link>

          {/* روابط التنقل — تظهر على شاشات الديسكتوب فقط (الموبايل والتابليت يتنقلان عبر الشريط السفلي) */}
          <nav
            className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 shrink-0"
            aria-label="التنقل الرئيسي"
          >
            <SiteNavLinks variant="desktop" />
          </nav>

          {/* عناصر التحكم والإجراءات — تصميم موحد متطابق على الموبايل والتابليت */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* شريط البحث السريع الذكي (ديسكتوب) */}
            <HeaderSearchButton />

            {/* مفتاح الوضع الفاتح/الداكن */}
            <ThemeToggle />

            {/* جرس الإشعارات */}
            <NotificationsBell />

            {/* قائمة المستخدم / زر تسجيل الدخول */}
            <UserMenu />

            {/* زر اطلب صنايعي — متاح على الديسكتوب */}
            <div className="hidden lg:inline-flex shrink-0">
              <ButtonLink
                href="/request/new"
                variant="primary"
                size="sm"
                className="shrink-0 h-10 min-h-0 px-3 xl:px-4 text-xs xl:text-sm font-bold shadow-xs hover:shadow-accent/20 active:scale-95 whitespace-nowrap"
              >
                <IconPlus className="h-4 w-4 shrink-0" />
                <span>اطلب صنايعي</span>
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

