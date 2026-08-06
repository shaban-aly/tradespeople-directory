"use client";

import {
  createCraftsman,
  deleteCraftsman,
  fetchAreas,
  fetchCategories,
  fetchCraftsmen,
  toggleCraftsmanPublished,
  toggleCraftsmanVerified,
  updateCraftsman,
  type CraftsmanInput,
  type CraftsmanRow,
} from "@/lib/db/admin";
import { useAdminAction } from "./useAdminAction";
import { useAdminQuery } from "./useAdminQuery";

export function useAdminCraftsmen() {
  const { data, loading, error: loadError, refresh } = useAdminQuery(async () => {
    const [categories, areas, craftsmen] = await Promise.all([
      fetchCategories(),
      fetchAreas(),
      fetchCraftsmen(),
    ]);
    return { categories, areas, craftsmen };
  });
  const { busyKey, error: actionError, run } = useAdminAction();

  const createCraftsmanItem = (payload: CraftsmanInput) =>
    run("create-craftsman", () => createCraftsman(payload), refresh);

  const updateCraftsmanItem = (id: string, payload: CraftsmanInput) =>
    run(`update-craftsman-${id}`, () => updateCraftsman(id, payload), refresh);

  const deleteCraftsmanItem = (id: string) =>
    run(
      `delete-craftsman-${id}`,
      () => deleteCraftsman(id, data?.craftsmen ?? []),
      refresh,
    );

  const toggleVerified = (craftsman: CraftsmanRow) =>
    run(
      `craftsman-verified-${craftsman.id}`,
      () => toggleCraftsmanVerified(craftsman),
      refresh,
    );

  const togglePublished = (craftsman: CraftsmanRow) =>
    run(
      `craftsman-published-${craftsman.id}`,
      () => toggleCraftsmanPublished(craftsman),
      refresh,
    );

  return {
    categories: data?.categories ?? [],
    areas: data?.areas ?? [],
    craftsmen: data?.craftsmen ?? [],
    loading,
    error: loadError || actionError,
    busyKey,
    createCraftsman: createCraftsmanItem,
    updateCraftsman: updateCraftsmanItem,
    deleteCraftsman: deleteCraftsmanItem,
    toggleCraftsmanVerified: toggleVerified,
    toggleCraftsmanPublished: togglePublished,
    refresh,
  };
}
