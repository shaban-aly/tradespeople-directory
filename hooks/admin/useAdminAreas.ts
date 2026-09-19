"use client";

import { useMemo } from "react";
import {
  createArea,
  deleteArea,
  fetchAdminBreakdownCounts,
  fetchAreas,
  fetchCounts,
  toggleAreaActive,
  updateArea,
  type AreaRow,
} from "@/lib/db/admin";
import { buildAreaCounts } from "@/lib/db/admin-selectors";
import { useAdminAction } from "./useAdminAction";
import { useAdminQuery } from "./useAdminQuery";

export interface AdminAreasData {
  areas: AreaRow[];
  counts?: Awaited<ReturnType<typeof fetchCounts>>;
  areaCounts?: Record<string, number>;
}

export function useAdminAreas(initialData?: AdminAreasData) {
  const seeded = useMemo(() => {
    if (!initialData) return undefined;
    return {
      areas: initialData.areas,
      areaCounts:
        initialData.areaCounts ?? buildAreaCounts(initialData.counts ?? []),
    };
  }, [initialData]);

  const { data, loading, error: loadError, refresh } = useAdminQuery(async () => {
    const [areas, breakdown] = await Promise.all([
      fetchAreas(),
      fetchAdminBreakdownCounts(),
    ]);
    return { areas, areaCounts: breakdown.byArea };
  }, seeded);
  const { busyKey, error: actionError, run } = useAdminAction();

  const areaCounts = data?.areaCounts ?? {};

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
