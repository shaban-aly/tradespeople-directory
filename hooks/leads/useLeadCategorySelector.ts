"use client";

import { useMemo, useState } from "react";
import type { LeadCategoryItem } from "@/components/leads/LeadCategorySelector";

interface UseLeadCategorySelectorProps {
  categories: LeadCategoryItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function useLeadCategorySelector({
  categories,
  selectedId,
  onSelect,
  disabled = false,
}: UseLeadCategorySelectorProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedId),
    [categories, selectedId],
  );

  // التخصصات الشائعة للوصول السريع بنقرة واحدة
  const quickCategories = useMemo(() => {
    const popularSlugs = ["plumbing", "electricity", "carpentry", "air-conditioning", "painting"];
    const popular = categories.filter((c) => c.slug && popularSlugs.includes(c.slug));
    return popular.length > 0 ? popular : categories.slice(0, 4);
  }, [categories]);

  // تصفية التخصصات في نافذة البحث
  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.slug && c.slug.toLowerCase().includes(q)),
    );
  }, [categories, query]);

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
    selectedCategory,
    quickCategories,
    filteredCategories,
    handleSelect,
  };
}
