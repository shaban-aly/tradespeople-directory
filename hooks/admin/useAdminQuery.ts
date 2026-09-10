"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAdminQuery<T>(
  fetcher: () => Promise<T>,
  initialData?: T,
) {
  const hasInitialData = initialData !== undefined;
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });
  const [data, setData] = useState<T | null>(initialData ?? null);
  const [loading, setLoading] = useState(!hasInitialData);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetcherRef.current());
    } catch {
      setError("مقدرناش نحمّل بيانات لوحة التحكم");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // البيانات تأتي من السيرفر عند تمرير initialData — لا حاجة لجلب من المتصفح
    if (hasInitialData) return;
    const loadTimer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(loadTimer);
  }, [refresh, hasInitialData]);

  return { data, loading, error, refresh };
}