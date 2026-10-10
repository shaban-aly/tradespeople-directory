"use client";

import { useState } from "react";

export type LeadsFilter = "all" | "activeClaimed" | "open" | "closedClaimed";

interface UseLeadsBoardFilterProps {
  openCount: number;
  activeClaimedCount: number;
}

/**
 * هوك إدارة فلترة وتبويبات لوحة طلبات الفني:
 * - يحدد التبويب الافتراضي الذكي: إن لم تكن هناك عروض مفتوحة لكن يوجد طلب قيد التواصل،
 *   يبدأ تلقائياً بـ "activeClaimed" حتى يظهر كارت العميل ورقم هاتفه مباشرة في أعلى الشاشة.
 * - يدعم التبديل السريع بين: قيد التواصل، عروض متاحة، طلبات سابقة، أو عرض الكل.
 */
export function useLeadsBoardFilter({
  openCount,
  activeClaimedCount,
}: UseLeadsBoardFilterProps) {
  // الذكاء التشغيلي: الطلبات الجارية مع العملاء أولى بالظهور الفوري عند غياب عروض جديدة
  const defaultFilter: LeadsFilter =
    openCount === 0 && activeClaimedCount > 0 ? "activeClaimed" : "open";

  const [filter, setFilter] = useState<LeadsFilter>(defaultFilter);

  const selectFilter = (next: LeadsFilter) => {
    setFilter(next);
  };

  return {
    filter,
    setFilter: selectFilter,
  };
}
