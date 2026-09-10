"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/hooks/auth/useSession";
import {
  getCraftsmanDashboardData,
  type CraftsmanDashboardData,
} from "@/lib/db/craftsman-dashboard";

export function useCraftsmanDashboard() {
  const { user, loading: sessionLoading, isCraftsman } = useSession();
  const [data, setData] = useState<CraftsmanDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getCraftsmanDashboardData(user.id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل بيانات لوحة التحكم");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!user || !isCraftsman) {
      setLoading(false);
      return;
    }
    loadData();
  }, [sessionLoading, user, isCraftsman, loadData]);

  return {
    data,
    loading: sessionLoading || loading,
    error,
    refresh: loadData,
  };
}
