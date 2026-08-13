"use client";

import { useEffect, useState } from "react";
import { IconArrowUp } from "@/components/shared/icons";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="العودة لأعلى الصفحة"
      className={`fixed bottom-28 left-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-card transition-all hover:border-accent hover:text-accent active:scale-[0.95] md:bottom-6 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <IconArrowUp className="h-5 w-5" />
    </button>
  );
}
