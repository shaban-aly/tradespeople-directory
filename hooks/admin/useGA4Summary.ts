"use client";

import { useEffect, useState } from "react";
import type { GA4SiteSummary } from "@/lib/analytics/ga4-api";

type UseGA4SummaryResult = {
  data: GA4SiteSummary | null;
  loading: boolean;
  error: string;
  refetch: () => void;
};

const EMPTY: GA4SiteSummary = {
  sessionsToday: 0,
  activeUsersToday: 0,
  pageViewsToday: 0,
  newUsersToday: 0,
  daily7d: [],
};

/**
 * Hook يجلب ملخص GA4 من /api/admin/ga4-summary (Server-side credentials).
 * يُستخدم في لوحة تحكم المشرف فقط.
 */
export function useGA4Summary(): UseGA4SummaryResult {
  const [data, setData] = useState<GA4SiteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetch("/api/admin/ga4-summary")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<GA4SiteSummary>;
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError("تعذّر جلب بيانات GA4");
          setData(EMPTY);
          setLoading(false);
          console.error("[useGA4Summary]", err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return {
    data,
    loading,
    error,
    refetch: () => setTick((t) => t + 1),
  };
}
