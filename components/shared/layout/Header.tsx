import Link from "next/link";
import Image from "next/image";
import { siteNavLinks } from "@/lib/data/site";
import { MobileNav } from "@/components/shared/layout/MobileNav";
import { ThemeToggle } from "@/components/shared/ui/ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/favicon.svg"
            alt="دليل الصنايعية"
            width={192}
            height={192}
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
          {siteNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-base font-bold text-muted transition-colors hover:bg-card hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/join"
            className="hidden min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-base font-bold text-on-accent transition-all hover:-translate-y-0.5 hover:bg-accent/90 lg:inline-flex"
          >
            أضف صنايعي
          </Link>
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
