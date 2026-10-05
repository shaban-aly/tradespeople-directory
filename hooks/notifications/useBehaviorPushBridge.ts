"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/hooks/auth/useSession";
import {
  subscribeBehavior,
  readBehaviorEvents,
  type BehaviorEvent,
} from "@/lib/recommendations";
import {
  updateAnonymousInterests,
  subscribeUserInterest,
} from "@/lib/push/tokens";
import {
  PUSH_ANON_TOKEN_KEY,
  getStoredInterests,
  saveStoredInterests,
} from "@/lib/push/activation";

const DEBOUNCE_MS = 30_000; // 30 ثانية
const TYPE_WEIGHTS: Record<string, number> = {
  view: 1,
  search: 2,
  call: 3,
  whatsapp: 3,
  like: 5,
  dismiss: 0,
};

/**
 * استخراج أعلى التصنيفات اهتماماً من أحداث السلوك المخزنة.
 * دالة صافية خاضعة لمعادلة تقادم نصف العمر (7 أيام).
 */
export function extractTopCategories(
  events: BehaviorEvent[],
  limit = 3,
  now = Date.now(),
): string[] {
  const affinity = new Map<string, number>();

  for (const event of events) {
    const cat = event.categorySlug;
    if (!cat) continue;

    const ageMs = Math.max(0, now - event.ts);
    const isRealTs = event.ts > 1_000_000_000_000;
    // تقادم نصف عمر 7 أيام
    const decay = isRealTs
      ? Math.exp(-ageMs / ((7 * 24 * 3600 * 1000) / Math.LN2))
      : 1;
    const weight = (TYPE_WEIGHTS[event.type] ?? 1) * decay;

    affinity.set(cat, (affinity.get(cat) ?? 0) + weight);
  }

  return [...affinity.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([, score]) => score >= 1.0)
    .slice(0, limit)
    .map(([cat]) => cat);
}

/**
 * هوك الجسر الخفيف (Lightweight Behavioral Bridge)
 * يربط بين نشاط المستخدم السلوكي المحلي (Local Behavior Events)
 * واهتمامات الـ Push Notifications في Supabase في الخلفية بصمت وبدون أي إزعاج.
 */
export function useBehaviorPushBridge(): void {
  const { isLoggedIn } = useSession();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedRef = useRef<string>("");

  useEffect(() => {
    const sync = () => {
      // التحقق 1: صلاحية الإشعارات ممنوحة
      if (typeof window === "undefined" || typeof Notification === "undefined") {
        return;
      }
      if (Notification.permission !== "granted") {
        return;
      }

      const events = readBehaviorEvents();
      const topCategories = extractTopCategories(events);

      // التحقق 2: هل توجد اهتمامات كافية؟
      if (topCategories.length === 0) {
        return;
      }

      // التحقق 3: منع التكرار إذا لم يتغير الترتيب
      const key = JSON.stringify([...topCategories].sort());
      if (key === lastSyncedRef.current) {
        return;
      }

      lastSyncedRef.current = key;

      if (isLoggedIn) {
        // للمسجل: إضافة التصنيفات الجديدة فقط
        const existing = getStoredInterests();
        const newOnes = topCategories.filter((c) => !existing.includes(c));
        if (newOnes.length === 0) return;
        saveStoredInterests([...new Set([...existing, ...newOnes])]);
        newOnes.forEach((slug) => {
          void subscribeUserInterest(slug).catch(() => undefined);
        });
      } else {
        // للزائر المجهول: استبدال قائمة الاهتمامات بالكامل
        const anonToken = window.localStorage.getItem(PUSH_ANON_TOKEN_KEY);
        if (!anonToken) return;
        saveStoredInterests(topCategories);
        void updateAnonymousInterests(anonToken, topCategories).catch(
          () => undefined,
        );
      }
    };

    // فحص أولي بعد ثانيتين من تحميل الصفحة (للأحداث المحفوظة مسبقاً)
    const initialTimer = setTimeout(sync, 2000);

    // جدولة مع debounce لمدة 30 ثانية عند أي تغيير في السلوك
    const scheduleSync = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(sync, DEBOUNCE_MS);
    };

    const unsubscribe = subscribeBehavior(scheduleSync);

    return () => {
      clearTimeout(initialTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
      unsubscribe();
    };
  }, [isLoggedIn]);
}
