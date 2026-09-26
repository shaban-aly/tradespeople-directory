"use client";

import { useEffect } from "react";

/**
 * حالة القفل مشتركة على مستوى الموديول ومُعدّدة بعدّاد مراجع، لأن أكتر من
 * كومبوننت ممكن يقفل السكرول في نفس الوقت (مثلاً AuthGuardModal اللي بيتركّب
 * جوّه كل FavoriteButton). من غير العدّاد، أول قفل يتحرر بيرجّع حالة الصفحة
 * الأصلية والسكرول بيتفتح وأنا لسه في نص كومبوننت تاني مفتوح.
 */
let lockCount = 0;
let savedState: {
  htmlOverflow: string;
  bodyOverflow: string;
  bodyPaddingRight: string;
} | null = null;

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    if (lockCount === 0) {
      // حساب عرض الـ Scrollbar لمنع اهتزاز الشاشة (Layout Shift) عند إخفائه
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      savedState = {
        htmlOverflow: document.documentElement.style.overflow,
        bodyOverflow: document.body.style.overflow,
        bodyPaddingRight: document.body.style.paddingRight,
      };

      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0 && savedState) {
        document.documentElement.style.overflow = savedState.htmlOverflow;
        document.body.style.overflow = savedState.bodyOverflow;
        document.body.style.paddingRight = savedState.bodyPaddingRight;
        savedState = null;
      }
    };
  }, [active]);
}
