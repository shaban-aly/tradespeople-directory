"use client";

import { useMemo } from "react";
import type { SearchSuggestion } from "@/lib/search";
import { buildSuggestions } from "@/lib/search";
import { useSearchData } from "./useSearchData";

export type UseSearchResult = {
  suggestions: SearchSuggestion[];
  loading: boolean;
};

/** اقتراحات البحث تُحسب محلياً من بيانات مصغّرة — بلا استدعاء سيرفر لكل ضغطة. */
export function useSearch(query: string, enabled = true): UseSearchResult {
  const { data, failed } = useSearchData(enabled);
  const suggestions = useMemo<SearchSuggestion[]>(
    () => (data ? buildSuggestions(data, query) : []),
    [data, query],
  );
  return { suggestions, loading: enabled && !data && !failed };
}
