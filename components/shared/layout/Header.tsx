import Link from "next/link";
import Image from "next/image";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ButtonLink } from "@/components/shared/ui/Button";
import { SiteNavLinks } from "@/components/shared/layout/SiteNavLinks";
import { ThemeToggle } from "@/components/shared/ui/ThemeToggle";
import { UserMenu } from "@/components/shared/layout/UserMenu";
import { NotificationsBell } from "@/components/shared/layout/NotificationsBell";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <div className="relative">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/favicon-96x96.png"
              alt="دليل الصنايعية"
              width={96}
              height={96}
              sizes="40px"
              className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
            />
            <span className="font-heading text-xl font-extrabold text-foreground sm:text-2xl">
              دليل الصنايعية
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="التنقل الرئيسي"
            data-tour="header-nav"
          >
            <SiteNavLinks variant="desktop" />
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationsBell />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

