"use client";

import { useTheme } from "@/hooks/ui/useTheme";
import { IconSun, IconMoon } from "@/components/shared/icons";
import { ToggleSwitch } from "@/components/shared/ui/ToggleSwitch";

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          {isDark ? (
            <IconMoon className="h-5 w-5 text-accent" />
          ) : (
            <IconSun className="h-5 w-5 text-warning" />
          )}
        </div>
        <div>
          <p className="text-base font-bold text-foreground">مظهر التطبيق</p>
          <p className="text-xs text-muted">
            {isDark ? "الوضع الليلي نشط" : "الوضع الفاتح نشط"}
          </p>
        </div>
      </div>

      {/* مفتاح تبديل بنفس تصميم مفاتيح الإشعارات */}
      <ToggleSwitch
        checked={isDark}
        onChange={(next) => setTheme(next ? "dark" : "light")}
        label={isDark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الغامق"}
      />
    </div>
  );
}
