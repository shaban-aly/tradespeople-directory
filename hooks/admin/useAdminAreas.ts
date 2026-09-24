"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useToast } from "@/hooks/ui/useToast";
import { toArabicDigits } from "@/lib/utils/format";
import { useAdminAction } from "./useAdminAction";
import { useAdminQuery } from "./useAdminQuery";

export interface AdminAreasData {
  areas: AreaRow[];
  counts?: Awaited<ReturnType<typeof fetchCounts>>;
  areaCounts?: Record<string, number>;
}

export function useAdminAreas(initialData?: AdminAreasData) {
  const { toast } = useToast();
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
  const error = loadError || actionError;

  const [formTarget, setFormTarget] = useState<AreaRow | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AreaRow | null>(null);

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  const rawAreas = data?.areas ?? [];
  const areaCounts = data?.areaCounts ?? {};

  const addArea = (name: string) =>
    run("add-area", () => createArea(name, rawAreas), refresh);

  const updateAreaItem = (id: string, name: string) =>
    run(`update-area-${id}`, () => updateArea(id, name), refresh);

  const deleteAreaItem = (id: string) =>
    run(`delete-area-${id}`, () => deleteArea(id), refresh);

  const toggleAreaActiveItem = (area: AreaRow) =>
    run(`area-${area.id}`, () => toggleAreaActive(area), refresh);

  const handleSubmit = async (name: string): Promise<boolean> => {
    if (formTarget === "new") {
      const ok = await addArea(name);
      if (ok) {
        toast("success", "تمت إضافة المنطقة");
        setFormTarget(null);
      }
      return ok;
    }
    if (formTarget) {
      const ok = await updateAreaItem(formTarget.id, name);
      if (ok) {
        toast("success", "تم حفظ تعديلات المنطقة");
        setFormTarget(null);
      }
      return ok;
    }
    return false;
  };

  const handleToggle = async (area: AreaRow) => {
    const ok = await toggleAreaActiveItem(area);
    if (ok) {
      toast("success", area.is_active ? "تم إخفاء المنطقة" : "تم إظهار المنطقة");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const count = areaCounts[deleteTarget.name] ?? 0;
    if (count > 0) {
      toast(
        "error",
        `لا يمكن حذف منطقة عليها ${toArabicDigits(count)} صنايعي`,
      );
      setDeleteTarget(null);
      return;
    }
    const ok = await deleteAreaItem(deleteTarget.id);
    if (ok) {
      toast("success", "تم حذف المنطقة");
      setDeleteTarget(null);
    }
  };

  return {
    areas: rawAreas,
    areaCounts,
    loading,
    error,
    busyKey,
    formTarget,
    setFormTarget,
    deleteTarget,
    setDeleteTarget,
    handleSubmit,
    handleToggle,
    handleDelete,
    addArea,
    updateArea: updateAreaItem,
    deleteArea: deleteAreaItem,
    toggleAreaActive: toggleAreaActiveItem,
    refresh,
  };
}
