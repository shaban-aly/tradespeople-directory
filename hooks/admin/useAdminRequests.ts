"use client";

import {
  approveJoinRequest,
  deleteJoinRequest,
  fetchRequests,
  rejectJoinRequest,
  type JoinRequestRow,
} from "@/lib/db/admin";
import { useAdminAction } from "./useAdminAction";
import { useAdminQuery } from "./useAdminQuery";

export function useAdminRequests() {
  const { data, loading, error: loadError, refresh } = useAdminQuery(fetchRequests);
  const { busyKey, error: actionError, run } = useAdminAction();

  const approveRequest = (request: JoinRequestRow) =>
    run(`approve-${request.id}`, () => approveJoinRequest(request), refresh);

  const rejectRequest = (requestId: string) =>
    run(`reject-${requestId}`, () => rejectJoinRequest(requestId), refresh);

  const deleteRequest = (requestId: string) =>
    run(
      `delete-request-${requestId}`,
      () => deleteJoinRequest(requestId, data ?? []),
      refresh,
    );

  return {
    requests: data ?? [],
    loading,
    error: loadError || actionError,
    busyKey,
    approveRequest,
    rejectRequest,
    deleteRequest,
    refresh,
  };
}
