"use client";

import { useEffect, useState } from "react";
import type { SearchData } from "@/lib/search";

const MAX_AGE_MS = 5 * 60 * 1000;

let cachedData: SearchData | null = null;
let cachedAt = 0;
let inflight: Promise<SearchData> | null = null;

function fetchSearchData(): Promise<SearchData> {
  if (inflight) return inflight;
  inflight = fetch("/api/search-data", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("search data request failed");
      return response.json() as Promise<SearchData>;
    })
    .then((data) => {
      cachedData = data;
      cachedAt = Date.now();
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * بيانات البحث المصغّرة (تخصصات/مناطق/صنايعية) — تُجلب مرة واحدة للجلسة
 * من endpoint بالكاش، ثم تُحسب الاقتراحات محلياً دون استدعاء سيرفر لكل ضغطة.
 * الكومبوننتان (ديسكتوب وموبايل) يشتركان في نفس الكاش داخل الوحدة.
 */
export function useSearchData(enabled = true) {
  const [data, setData] = useState<SearchData | null>(cachedData);
  const [failed, setFailed] = useState(false);

  // مزامنة الحالة مع كاش الوحدة لو اتحدث من كومبوننت آخر (نمط state-derivation)
  if (data !== cachedData && cachedData) {
    setData(cachedData);
  }

  useEffect(() => {
    if (!enabled) return;
    if (cachedData && Date.now() - cachedAt < MAX_AGE_MS) {
      return;
    }
    let cancelled = false;
    fetchSearchData()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { data, failed };
}
