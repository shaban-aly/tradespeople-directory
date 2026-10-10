import { useState, useMemo } from "react";
import type { Craftsman, CraftsmanSort } from "@/lib/data/craftsmen";
import { getAvailableAreas, sortCraftsmen } from "@/lib/data/craftsmen";

interface UseCategoryCraftsmenProps {
  craftsmen: Craftsman[];
  areas: string[];
}

export function useCategoryCraftsmen({
  craftsmen,
  areas,
}: UseCategoryCraftsmenProps) {
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [sort, setSort] = useState<CraftsmanSort>("verified");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const availableAreas = useMemo(
    () => getAvailableAreas(craftsmen, areas),
    [craftsmen, areas]
  );

  const hasFilters = selectedArea !== "all";

  const activeFilterCount =
    (selectedArea !== "all" ? 1 : 0) + (sort !== "verified" ? 1 : 0);

  const filteredCraftsmen = useMemo(() => {
    const list =
      selectedArea !== "all"
        ? craftsmen.filter((c) => c.area === selectedArea)
        : craftsmen;
    return sortCraftsmen(list, sort);
  }, [craftsmen, selectedArea, sort]);

  const resetFilters = () => {
    setSelectedArea("all");
    setSort("verified");
  };

  return {
    selectedArea,
    setSelectedArea,
    sort,
    setSort,
    isSheetOpen,
    setIsSheetOpen,
    availableAreas,
    hasFilters,
    activeFilterCount,
    filteredCraftsmen,
    resetFilters,
  };
}
