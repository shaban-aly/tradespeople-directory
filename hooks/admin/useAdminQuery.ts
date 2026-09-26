"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type QueryState<T> = {
  /** توقيع قيمة لبيانات السيرفر — يكشف التغيّر الفعلي لا تغيّر الهوية. */
  serverSig: string;
  /** نتيجة آخر جلب من المتصفح (refresh بعد إجراءات المشرف). */
  fetched: T | null;
};

function serverSignature<T>(initialData: T | undefined): string {
  if (initialData === undefined) return "";
  try {
    return JSON.stringify(initialData) ?? "";
  } catch {
    // بيانات غير قابلة للتسلسل (دورة/.BigInt) — نستخدم تمثيلاً ثابتاً
    return String(initialData);
  }
}

/**
 * استعلام بيانات لوحة التحكم.
 *
 * `initialData` تأتي من Server Component، و`useAdminOverview` يعيد بناء
 * `buildOverviewMetrics()` في كل ريندر فيصير الهوية جديدة دائماً. لذلك
 * تُقارن القيمة (JSON) لا الهوية.
 *
 * الاشتقاق أثناء الريندر (بلا setState في effect) مقصود: مزامنة state مع
 * initialData عبر useEffect كانت تُنتج حلقة ريندر — أي تغيير حالة آخر في
 * الكومبوننت (مثل busyKey من useAdminAction) يجعل الهوية تتغير، فيعمل
 * الـ effect ويكتب كائناً جديداً، فيُعاد الريندر، وهكذا.
 *
 * الأفضلية للبيانات المحسوبة من السيرفر، لكن آخر جلب (`refresh`) يتجاوزها
 * حتى تظهر أرقام الإجراءات الجديدة، وكل ما تغيّرت بيانات السيرفر فعلياً
 * تُسقط نتيجة الجلب القديمة.
 */
export function useAdminQuery<T>(
  fetcher: () => Promise<T>,
  initialData?: T,
) {
  const hasInitialData = initialData !== undefined;
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const serverSig = serverSignature(initialData);
  const [state, setState] = useState<QueryState<T>>({
    serverSig,
    fetched: null,
  });

  // بيانات السيرفر تغيّرت فعلياً → نتيجة الجلب القديمة لم تعد تخصّها.
  if (state.serverSig !== serverSig) {
    setState({ serverSig, fetched: null });
  }

  const [loading, setLoading] = useState(!hasInitialData);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const value = await fetcherRef.current();
      setState((prev) => ({ ...prev, fetched: value }));
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

  const data = state.fetched !== null ? state.fetched : (initialData ?? null);

  return { data, loading, error, refresh };
}
