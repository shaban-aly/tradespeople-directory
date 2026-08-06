"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalyticsOverview } from "@/app/api/analytics/route";

type AnalyticsState = {
  overview: AnalyticsOverview | null;
  loading: boolean;
  error: string;
};

export function useAnalytics() {
  const [state, setState] = useState<AnalyticsState>({
    overview: null,
    loading: true,
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

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(loadTimer);
  }, [load]);

  return { ...state, refresh: load };
}
