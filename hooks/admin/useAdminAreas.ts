"use client";

import { useMemo } from "react";
import {
  createArea,
  deleteArea,
  fetchAreas,
  fetchCounts,
  toggleAreaActive,
  updateArea,
  type AreaRow,
} from "@/lib/db/admin";
import { buildAreaCounts } from "@/lib/db/admin-selectors";
import { useAdminAction } from "./useAdminAction";
import { useAdminQuery } from "./useAdminQuery";

export function useAdminAreas() {
  const { data, loading, error: loadError, refresh } = useAdminQuery(async () => {
    const [areas, counts] = await Promise.all([fetchAreas(), fetchCounts()]);
    return { areas, counts };
  });
  const { busyKey, error: actionError, run } = useAdminAction();

  const areaCounts = useMemo(
    () => buildAreaCounts(data?.counts ?? []),
    [data],
  );

  const addArea = (name: string) =>
    run("add-area", () => createArea(name, data?.areas ?? []), refresh);

  const updateAreaItem = (id: string, name: string) =>
    run(`update-area-${id}`, () => updateArea(id, name), refresh);

  const deleteAreaItem = (id: string) =>
    run(`delete-area-${id}`, () => deleteArea(id), refresh);

  const toggleAreaActiveItem = (area: AreaRow) =>
    run(`area-${area.id}`, () => toggleAreaActive(area), refresh);

  return {
    areas: data?.areas ?? [],
    areaCounts,
    loading,
    error: loadError || actionError,
    busyKey,
    addArea,
    updateArea: updateAreaItem,
    deleteArea: deleteAreaItem,
    toggleAreaActive: toggleAreaActiveItem,
    refresh,
  };
}
