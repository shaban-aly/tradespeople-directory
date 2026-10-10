"use client";

import { useMemo, useState } from "react";
import type { LeadAreaItem } from "@/components/leads/LeadAreaSelector";

interface UseLeadAreaSelectorProps {
  areas: LeadAreaItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function useLeadAreaSelector({
  areas,
  selectedId,
  onSelect,
  disabled = false,
}: UseLeadAreaSelectorProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedArea = useMemo(
    () => areas.find((a) => a.id === selectedId),
    [areas, selectedId],
  );

  const filteredAreas = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return areas;
    return areas.filter((a) => a.name.toLowerCase().includes(q));
  }, [areas, query]);

  function handleSelect(id: string) {
    if (disabled) return;
    onSelect(id);
    setModalOpen(false);
    setQuery("");
  }

  return {
    modalOpen,
    setModalOpen,
    query,
    setQuery,
    selectedArea,
    filteredAreas,
    handleSelect,
  };
}
