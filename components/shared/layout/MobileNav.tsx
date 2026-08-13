"use client";

import { useEffect, useRef, useState } from "react";
import { IconMenu, IconX } from "@/components/shared/icons";
import { ButtonLink } from "@/components/shared/ui/Button";
import { SiteNavLinks } from "@/components/shared/layout/SiteNavLinks";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
        aria-expanded={open}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:border-accent hover:text-accent active:scale-[0.95]"
      >
        {open ? <IconX className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-3">
            <SiteNavLinks
              variant="mobile"
              onNavigate={() => setOpen(false)}
            />
            <ButtonLink
              href="/join"
              variant="primary"
              className="mt-2 w-full"
              onClick={() => setOpen(false)}
            >
              أضف صنايعي
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
