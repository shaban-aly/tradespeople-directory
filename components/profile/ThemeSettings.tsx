"use client";

import { useTheme } from "@/hooks/ui/useTheme";
import { IconSun, IconMoon } from "@/components/shared/icons";

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          {theme === "dark" ? (
            <IconMoon className="h-5 w-5 text-indigo-400" />
          ) : (
            <IconSun className="h-5 w-5 text-amber-500" />
          )}
        </div>
        <div>
          <p className="text-base font-bold text-foreground">مظهر التطبيق</p>
          <p className="text-xs text-muted">
            {theme === "dark" ? "الوضع الليلي نشط" : "الوضع الفاتح نشط"}
          </p>
        </div>
      </div>

      {/* تحكم مقسم ومضغوط Segmented Control */}
      <div className="flex items-center rounded-xl border border-border bg-card/50 p-1">
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            theme === "light"
              ? "bg-card text-foreground shadow-sm border border-foreground/15"
              : "text-muted hover:text-foreground"
          }`}
          aria-label="تفعيل الوضع الفاتح"
        >
          <IconSun className="h-3.5 w-3.5 text-amber-500" />
          <span>فاتح</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            theme === "dark"
              ? "bg-card text-foreground shadow-sm border border-foreground/15"
              : "text-muted hover:text-foreground"
          }`}
          aria-label="تفعيل الوضع الليلي"
        >
          <IconMoon className="h-3.5 w-3.5 text-indigo-400" />
          <span>ليلي</span>
        </button>
      </div>
    </div>
  );
}
