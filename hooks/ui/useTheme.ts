"use client";

import { useEffect, useState } from "react";
import { useHydratedValue } from "@/hooks/ui/useHydratedValue";

const STORAGE_KEY = "tradespeople-theme";

export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getStoredOrSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {}
  return getSystemTheme();
}

export function useTheme() {
  const storedTheme = useHydratedValue<"light" | "dark">("light", () => {
    return getStoredOrSystemTheme();
  });
  const [toggled, setToggled] = useState<"light" | "dark" | null>(null);
  const theme = toggled ?? storedTheme;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  // استماع لتغير ثيم النظام تلقائياً إذا لم يكن المستخدم قد اختار ثيماً يدوياً
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemChange = (e: MediaQueryListEvent) => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored && toggled === null) {
        const next = e.matches ? "dark" : "light";
        setToggled(next);
      }
    };

    if (media.addEventListener) {
      media.addEventListener("change", handleSystemChange);
      return () => media.removeEventListener("change", handleSystemChange);
    }
  }, [toggled]);

  return {
    theme,
    setTheme: (next: "light" | "dark") => setToggled(next),
    toggleTheme: () =>
      setToggled((prev) => {
        if (prev) return prev === "dark" ? "light" : "dark";
        return storedTheme === "dark" ? "light" : "dark";
      }),
  };
}
