"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "admin_sidebar_collapsed";

export function useAdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {
      // Ignore localStorage errors
    }
    setMounted(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  return {
    collapsed: mounted ? collapsed : false,
    toggleCollapsed,
    isHydrated: mounted,
  };
}
