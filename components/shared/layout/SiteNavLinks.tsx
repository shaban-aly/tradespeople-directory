"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteNavLinks } from "@/lib/data/site";

function isActive(href: string, pathname: string): boolean {
  if (href === "/#contact") return pathname === "/";
  return pathname === href;
}

export function SiteNavLinks({
  variant = "desktop",
  onNavigate,
}: {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const className =
    variant === "mobile"
      ? "rounded-lg px-3 py-3 text-base font-bold transition-colors"
      : "rounded-lg px-3 py-2 text-base font-bold transition-colors";

  return (
    <>
      {siteNavLinks.map((link) => {
        const active = isActive(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`${className} ${
              active
                ? "bg-card text-accent"
                : "text-muted hover:bg-card hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
