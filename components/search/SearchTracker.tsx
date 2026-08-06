"use client";

import { useEffect, useRef } from "react";
import { recordBehaviorEvent } from "@/lib/recommendations";

/** تسجيل استعلامات البحث محلياً لتغذية «مقترحات لك» — مرة واحدة لكل استعلام. */
export function SearchTracker({ query }: { query: string }) {
  const lastQuery = useRef<string | null>(null);

  useEffect(() => {
    const normalized = query.trim();
    if (!normalized || lastQuery.current === normalized) return;
    lastQuery.current = normalized;
    recordBehaviorEvent({ type: "search", query: normalized, ts: Date.now() });
  }, [query]);

  return null;
}
