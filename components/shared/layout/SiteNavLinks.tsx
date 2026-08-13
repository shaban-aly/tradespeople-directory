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
      ? "rounded-lg px-3 py-3 text-base font-bold transition-colors"
      : "rounded-lg px-3 py-2 text-base font-bold transition-colors";

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
