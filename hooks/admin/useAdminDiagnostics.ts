"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchPushDiagnostics, type PushDiagnosticRow } from "@/lib/db/admin";
import {
  countPushDiagnostics,
  filterPushDiagnostics,
  type PushDiagnosticGroup,
} from "@/lib/db/admin-selectors";
import { useToast } from "@/hooks/ui/useToast";
import { useAdminQuery } from "./useAdminQuery";

/**
 * تشخيصات فشل إشعارات المتصفح.
 *
 * قراءة فقط — لا إجراءات admin على الجدول (لا تعديل ولا حذف من الواجهة)،
 * فلا حاجة لـ `useAdminAction` هنا؛ الفلتر الافتراضي `technical` لأنه
 * وحده ما يستدعي تدخّلاً هندسياً.
 */
export function useAdminDiagnostics(initialDiagnostics?: PushDiagnosticRow[]) {
  const { toast } = useToast();
  const { data, loading, error, refresh } = useAdminQuery(
    fetchPushDiagnostics,
    initialDiagnostics,
  );

  const [group, setGroup] = useState<PushDiagnosticGroup>("technical");

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  const diagnostics = useMemo(() => data ?? [], [data]);
  const counts = useMemo(() => countPushDiagnostics(diagnostics), [diagnostics]);
  const filteredDiagnostics = useMemo(
    () => filterPushDiagnostics(diagnostics, group),
    [diagnostics, group],
  );

  return {
    diagnostics,
    filteredDiagnostics,
    counts,
    group,
    setGroup,
    loading,
    error,
    refresh,
  };
}
