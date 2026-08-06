"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAdminQuery<T>(fetcher: () => Promise<T>) {
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
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
    const loadTimer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(loadTimer);
  }, [refresh]);

  return { data, loading, error, refresh };
}
