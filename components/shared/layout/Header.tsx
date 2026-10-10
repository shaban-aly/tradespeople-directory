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
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="relative">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/favicon-96x96.png"
              alt="دليل الصنايعية"
              width={96}
              height={96}
              fetchPriority="high"
              decoding="async"
              className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
            />
            <span className="font-heading text-xl font-extrabold text-foreground sm:text-2xl">
              دليل الصنايعية
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="التنقل الرئيسي"
          >
            <SiteNavLinks variant="desktop" />
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex">
              <HeaderSearchButton />
            </div>
            <ThemeToggle />
            <NotificationsBell />
            <UserMenu />

            <div className="hidden lg:inline-flex">
              <ButtonLink
                href="/request/new"
                variant="primary"
                size="sm"
                className="shrink-0 min-h-11 h-11 px-4 text-sm font-bold shadow-xs hover:shadow-accent/20 active:scale-95"
              >
                <IconPlus className="h-4 w-4" />
                <span>اطلب صنايعي</span>
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

