"use client";

import { useEffect, useRef } from "react";
import { recordBehaviorEvent } from "@/lib/recommendations";
import { useRecentSearches } from "@/hooks/search/useRecentSearches";
import { track } from "@/lib/analytics/track";

/** تسجيل استعلامات البحث محلياً + إطلاق أحداث GA4. */
export function SearchTracker({
  query,
  resultsCount = 0,
}: {
  query: string;
  resultsCount?: number;
}) {
  const lastQuery = useRef<string | null>(null);
  const { addSearch } = useRecentSearches();

  useEffect(() => {
    const normalized = query.trim();
    if (!normalized || lastQuery.current === normalized) return;
    lastQuery.current = normalized;
    recordBehaviorEvent({ type: "search", query: normalized, ts: Date.now() });
    addSearch(normalized);

    track("search", { search_term: normalized, results_count: resultsCount });
    if (resultsCount === 0) {
      track("search_no_results", { search_term: normalized });
    }
  }, [query, addSearch, resultsCount]);

  return null;
}