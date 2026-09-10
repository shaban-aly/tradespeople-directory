"use client";

import { useMemo } from "react";
import {
  approveJoinRequest,
  fetchAreas,
  fetchCategories,
  fetchCraftsmen,
  fetchMessages,
  fetchRequests,
  rejectJoinRequest,
  type JoinRequestRow,
} from "@/lib/db/admin";
import { buildOverviewMetrics, type OverviewMetrics } from "@/lib/db/admin-selectors";
import { useAdminAction } from "./useAdminAction";
import { useAdminQuery } from "./useAdminQuery";

export interface AdminOverviewData {
  requests: JoinRequestRow[];
  categories: Awaited<ReturnType<typeof fetchCategories>>;
  areas: Awaited<ReturnType<typeof fetchAreas>>;
  craftsmen: Awaited<ReturnType<typeof fetchCraftsmen>>;
  messages: Awaited<ReturnType<typeof fetchMessages>>;
}

export function useAdminOverview(initialData?: AdminOverviewData) {
  const { data, loading, error: loadError, refresh } = useAdminQuery(async () => {
    const [requests, categories, areas, craftsmen, messages] = await Promise.all([
      fetchRequests(),
      fetchCategories(),
      fetchAreas(),
      fetchCraftsmen(),
      fetchMessages(),
    ]);
    return { requests, categories, areas, craftsmen, messages };
  }, initialData);
  const { busyKey, error: actionError, run } = useAdminAction();

  const metrics = useMemo<OverviewMetrics | null>(
    () => (data ? buildOverviewMetrics(data) : null),
    [data],
  );

  const approveRequest = (request: JoinRequestRow) =>
    run(`approve-${request.id}`, () => approveJoinRequest(request), refresh);

  const rejectRequest = (requestId: string) =>
    run(`reject-${requestId}`, () => rejectJoinRequest(requestId), refresh);

  return {
    metrics,
    loading,
    error: loadError || actionError,
    busyKey,
    approveRequest,
    rejectRequest,
    refresh,
  };
}
