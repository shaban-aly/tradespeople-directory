"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminNavCounts,
  type AdminNavCounts,
} from "@/lib/db/admin";

/**
 * عدّادات شريط التنقل الجانبي (طلبات/بلاغات/رسائل).
 * تُجلب بعد التحميل (client-side) حتى يبقى السيرفر خفيفاً، وتُعاد قراءتها
 * عند الحاجة عبر `refresh()` — يستدعيها AdminShell عند تغيّر المسار وعند
 * حدث `admin-nav-refresh` (بعد أي عملية متابعة ناجحة من useAdminAction).
 */
export function useAdminNavCounts(initialCounts?: AdminNavCounts) {
  const [counts, setCounts] = useState<AdminNavCounts | null>(initialCounts ?? null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setCounts(await fetchAdminNavCounts());
      setError("");
    } catch {
      setError("مقدرناش نحمّل عدّادات القائمة");
    }
  }, []);

  useEffect(() => {
    if (initialCounts && counts) return;
    let cancelled = false;
    void fetchAdminNavCounts()
      .then((next) => {
        if (cancelled) return;
        setCounts(next);
        setError("");
      })
      .catch(() => {
        if (!cancelled) setError("مقدرناش نحمّل عدّادات القائمة");
      });
    return () => {
      cancelled = true;
    };
  }, [initialCounts]);

  return { counts, error, refresh };
}

/** حدث يُطلق بعد عملية متابعة ناجحة لتحديث عدّادات الـ sidebar. */
export function notifyNavCountsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("admin-nav-refresh"));
}