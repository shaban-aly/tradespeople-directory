"use client";

import { useCallback, useState } from "react";
import type { AnalyticsOverview } from "@/lib/db/analytics";

type AnalyticsState = {
  overview: AnalyticsOverview | null;
  loading: boolean;
  error: string;
};

export function useAnalytics(initialOverview?: AnalyticsOverview) {
  const [state, setState] = useState<AnalyticsState>({
    overview: initialOverview ?? null,
    loading: initialOverview === undefined,
    error: "",
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const response = await fetch("/api/analytics", { cache: "no-store" });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setState((prev) => ({
          ...prev,
          loading: false,
          error: body.error ?? "مقدرناش نجيب إحصائيات الزيارات",
        }));
        return;
      }
      const body = (await response.json()) as { overview: AnalyticsOverview };
      setState({ overview: body.overview, loading: false, error: "" });
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "مقدرناش نتواصل مع خادم الإحصائيات",
      }));
    }
  }, []);

  return { ...state, refresh: load };
}