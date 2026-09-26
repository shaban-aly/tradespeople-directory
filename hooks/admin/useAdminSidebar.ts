"use client";

import { useCallback } from "react";
import { useLocalStorageStore } from "@/hooks/ui/useLocalStorageStore";

const STORAGE_KEY = "admin_sidebar_collapsed";

function parseCollapsed(raw: string): boolean | undefined {
  if (raw === "true") return true;
  if (raw === "false") return false;
  return undefined;
}

function serializeCollapsed(value: boolean): string {
  return String(value);
}

export function useAdminSidebar() {
  const { value: collapsed, updateValue, hydrated } =
    useLocalStorageStore<boolean>({
      key: STORAGE_KEY,
      fallback: false,
      parse: parseCollapsed,
      serialize: serializeCollapsed,
    });

  const toggleCollapsed = useCallback(() => {
    updateValue((previous) => !previous);
  }, [updateValue]);

  return {
    // قبل الترطيب نعرض الافتراضي حتى لا يختلف HTML عن السيرفر
    collapsed: hydrated ? collapsed : false,
    toggleCollapsed,
    isHydrated: hydrated,
  };
}
