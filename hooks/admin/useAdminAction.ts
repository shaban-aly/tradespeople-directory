"use client";

import { useCallback, useState } from "react";
import { revalidateSearchCache } from "@/lib/db/admin";
import { notifyNavCountsChanged } from "@/hooks/admin/useAdminNavCounts";

export function useAdminAction() {
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");

  const run = useCallback(
    async (
      key: string,
      action: () => Promise<void>,
      onSuccess?: () => Promise<void>,
    ): Promise<boolean> => {
      setBusyKey(key);
      setError("");
      try {
        await action();
        await onSuccess?.();
        void revalidateSearchCache();
        notifyNavCountsChanged();
        return true;
      } catch (nextError) {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "حصلت مشكلة في العملية",
        );
        return false;
      } finally {
        setBusyKey("");
      }
    },
    [],
  );

  return { busyKey, error, run };
}
