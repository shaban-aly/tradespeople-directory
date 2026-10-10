"use client";

import { useTheme } from "@/hooks/ui/useTheme";
import { IconMoon, IconSun } from "@/components/shared/icons";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الغامق"}
      title={theme === "dark" ? "الوضع الفاتح" : "الوضع الغامق"}
      className={`flex h-9.5 w-9.5 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border border-border/80 bg-card/70 backdrop-blur-xs text-foreground transition-all hover:border-accent hover:text-accent hover:bg-card active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shadow-2xs ${className}`}
    >
      {theme === "dark" ? (
        <IconSun className="h-4.5 w-4.5 sm:h-5 sm:w-5 transition-transform" />
      ) : (
        <IconMoon className="h-4.5 w-4.5 sm:h-5 sm:w-5 transition-transform" />
      )}
    </button>
  );
}
