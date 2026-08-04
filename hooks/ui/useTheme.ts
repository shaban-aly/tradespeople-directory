"use client";

import { useEffect, useState } from "react";
import { useHydratedValue } from "@/hooks/ui/useHydratedValue";

const STORAGE_KEY = "tradespeople-theme";

export function useTheme() {
  const storedTheme = useHydratedValue<"light" | "dark">("light", () => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : "light";
  });
  const [toggled, setToggled] = useState<"light" | "dark" | null>(null);
  const theme = toggled ?? storedTheme;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return {
    theme,
    toggleTheme: () =>
      setToggled((prev) => {
        if (prev) return prev === "dark" ? "light" : "dark";
        return storedTheme === "dark" ? "light" : "dark";
      }),
  };
}
