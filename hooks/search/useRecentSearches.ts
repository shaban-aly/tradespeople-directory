"use client";

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "suez_recent_searches";
const MAX_SEARCHES = 8;

export function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  // تحميل السجل عند بدء التشغيل في المتصفح
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSearches(parsed.slice(0, MAX_SEARCHES));
        }
      }
    } catch {
      // تجاهل أخطاء التخزين
    } finally {
      setIsReady(true);
    }
  }, []);

  // إضافة استعلام بحث إلى السجل
  const addSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;

    setSearches((prev) => {
      // إزالة التكرار إن وجد
      const filtered = prev.filter(
        (item) => item.toLowerCase() !== trimmed.toLowerCase(),
      );
      // وضع البحث الجديد في المقدمة بحد أقصى 8
      const next = [trimmed, ...filtered].slice(0, MAX_SEARCHES);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // تجاهل أخطاء التخزين
      }

      return next;
    });
  }, []);

  // حذف عملية بحث محددة
  const removeSearch = useCallback((queryToRemove: string) => {
    setSearches((prev) => {
      const next = prev.filter(
        (item) => item.toLowerCase() !== queryToRemove.toLowerCase(),
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // تجاهل أخطاء التخزين
      }
      return next;
    });
  }, []);

  // مسح السجل بالكامل
  const clearSearches = useCallback(() => {
    setSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // تجاهل أخطاء التخزين
    }
  }, []);

  return {
    searches,
    isReady,
    addSearch,
    removeSearch,
    clearSearches,
  };
}
