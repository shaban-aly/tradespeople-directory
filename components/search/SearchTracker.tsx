"use client";

import { useEffect, useRef } from "react";
import { recordBehaviorEvent } from "@/lib/recommendations";
import { useRecentSearches } from "@/hooks/search/useRecentSearches";

/** تسجيل استعلامات البحث محلياً لتغذية «مقترحات لك» وسجل البحث الأخير. */
export function SearchTracker({ query }: { query: string }) {
  const lastQuery = useRef<string | null>(null);
  const { addSearch } = useRecentSearches();

  useEffect(() => {
    const normalized = query.trim();
    if (!normalized || lastQuery.current === normalized) return;
    lastQuery.current = normalized;
    recordBehaviorEvent({ type: "search", query: normalized, ts: Date.now() });
    addSearch(normalized);
  }, [query, addSearch]);

  return null;
}
