"use client";

import { useCallback } from "react";
import { useLocalStorageStore } from "@/hooks/ui/useLocalStorageStore";

const STORAGE_KEY = "suez_recent_searches";
const MAX_SEARCHES = 8;
const FALLBACK: string[] = [];

function parseSearches(raw: string): string[] | undefined {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;
    return parsed
      .filter((item): item is string => typeof item === "string")
      .slice(0, MAX_SEARCHES);
  } catch {
    return undefined;
  }
}

function serializeSearches(value: string[]): string {
  return JSON.stringify(value);
}

export function useRecentSearches() {
  const {
    value: searches,
    updateValue,
    removeValue,
    hydrated: isReady,
  } = useLocalStorageStore<string[]>({
    key: STORAGE_KEY,
    fallback: FALLBACK,
    parse: parseSearches,
    serialize: serializeSearches,
  });

  // إضافة استعلام بحث إلى السجل
  const addSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed || trimmed.length < 2) return;

      updateValue((previous) =>
        [
          trimmed,
          // إزالة التكرار إن وجد
          ...previous.filter(
            (item) => item.toLowerCase() !== trimmed.toLowerCase(),
          ),
          // البحث الجديد في المقدمة بحد أقصى 8
        ].slice(0, MAX_SEARCHES),
      );
    },
    [updateValue],
  );

  // حذف عملية بحث محددة
  const removeSearch = useCallback(
    (queryToRemove: string) => {
      updateValue((previous) =>
        previous.filter(
          (item) => item.toLowerCase() !== queryToRemove.toLowerCase(),
        ),
      );
    },
    [updateValue],
  );

  // مسح السجل بالكامل
  const clearSearches = useCallback(() => {
    removeValue();
  }, [removeValue]);

  return {
    searches,
    isReady,
    addSearch,
    removeSearch,
    clearSearches,
  };
}
