"use client";

import { useCallback, useEffect, useState } from "react";
import type { GaOverview } from "@/lib/analytics/ga";

type GaStatsState = {
  overview: GaOverview | null;
  loading: boolean;
  error: string;
  needsSetup: boolean;
};

export function useGaStats() {
  const [state, setState] = useState<GaStatsState>({
    overview: null,
    loading: true,
    error: "",
    needsSetup: false,
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const response = await fetch("/api/ga-stats", { cache: "no-store" });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
          needsSetup?: boolean;
        };
        setState((prev) => ({
          ...prev,
          loading: false,
          error: body.error ?? "مقدرناش نجيب إحصائيات جوجل",
          needsSetup: body.needsSetup === true,
        }));
        return;
      }
      const body = (await response.json()) as { overview: GaOverview };
      setState({ overview: body.overview, loading: false, error: "", needsSetup: false });
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "مقدرناش نتواصل مع خادم الإحصائيات",
        needsSetup: false,
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
