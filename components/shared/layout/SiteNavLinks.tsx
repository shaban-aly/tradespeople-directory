"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { siteNavLinks } from "@/lib/data/site";

function isActive(href: string, pathname: string, hash: string): boolean {
  if (href === "/#contact") return pathname === "/" && hash === "#contact";
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
  const [hash, setHash] = useState("");

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  const className =
    variant === "mobile"
      ? "rounded-xl px-3 py-2.5 text-base font-bold transition-colors whitespace-nowrap"
      : "rounded-xl px-2 xl:px-2.5 2xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm 2xl:text-base font-bold transition-all whitespace-nowrap shrink-0";

  return (
    <>
      {siteNavLinks.map((link) => {
        const active = isActive(link.href, pathname, hash);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`${className} ${
              active
                ? "bg-accent/10 text-accent font-bold shadow-2xs"
                : "text-muted hover:bg-muted/10 hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
