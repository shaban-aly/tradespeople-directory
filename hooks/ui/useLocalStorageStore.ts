"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * مخزن خارجي لقيم localStorage يتشارك الحالة بين كل مConsumers للمفتاح نفسه.
 *
 * لماذا لا `useState` + `useEffect`?
 * - `useEffect` + `setState` هو أصل أخطاء set-state-in-effect و Solves ريندراً إضافياً.
 * - قراءة localStorage داخل الريندر تكسر الـ hydration، لذا نمر عبر
 *   `useSyncExternalStore` مع `getServerSnapshot` (نمط المشروع في useOnlineStatus).
 *
 * لماذا الكاش داخل `getSnapshot`?
 * `useSyncExternalStore` يتطلب snapshot ثابتاً بالمرجع. لو أعدنا `JSON.parse`
 * `useEffect` + `setState` هو أصل أخطاء set-state-in-effect ويسبب ريندراً إضافياً.
 * ("The result of getSnapshot should be cached to avoid an infinite loop").
 * لذلك نخزّن {raw, value}: طالما النص الخام لم يتغيّر نُعيد المرجع نفسه.
 * وميزة الكاش أنه يلتقط تغييرات التبويبات الأخرى تلقائياً — النص الجديد
 * مختلف فيُعاد التحليل.
 */

type CacheEntry = { raw: string | null; value: unknown };

const valueCache = new Map<string, CacheEntry>();
const keyListeners = new Map<string, Set<() => void>>();

const emptySubscribe = () => () => {};
const getClientTrue = () => true;
const getServerFalse = () => false;

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // التخزين محظور (وضع التصفح الخاص) — نتعامل كمفتاح غير موجود
    return null;
  }
}

function notify(key: string) {
  const listeners = keyListeners.get(key);
  if (!listeners) return;
  for (const listener of Array.from(listeners)) listener();
}

function subscribeToKey(key: string, onStoreChange: () => void) {
  let listeners = keyListeners.get(key);
  if (!listeners) {
    listeners = new Set();
    keyListeners.set(key, listeners);
  }
  listeners.add(onStoreChange);

  // مزامنة بين التبويبات (StorageEvent لا يصل للمكتوب نفسه، فقط للتبويبات الأخرى)
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === key) onStoreChange();
  };
  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0) keyListeners.delete(key);
    window.removeEventListener("storage", handleStorage);
  };
}

export interface LocalStorageStoreOptions<T> {
  /** مفتاح التخزين. */
  key: string;
  /** القيمة المعروضة قبل الترطيب، وعند غياب المفتاح أو فساد محتواه. */
  fallback: T;
  /** يحوّل النص الخام إلى قيمة، أو undefined إذا كان غير صالح. */
  parse: (raw: string) => T | undefined;
  /** يحوّل القيمة إلى نص للتخزين. */
  serialize: (value: T) => string;
}

export interface LocalStorageStore<T> {
  value: T;
  /** يستبدل القيمة ويكتبها في التخزين. */
  setValue: (next: T) => void;
  /** تعديل دلالي على القيمة الحالية (آمن من الإغلاق القديم). */
  updateValue: (updater: (previous: T) => T) => void;
  /** يحذف المفتاح فيعود إلى قيمة fallback. */
  removeValue: () => void;
  /** false على السيرفر وقبل الترطيب، true بعده. */
  hydrated: boolean;
}

export function useLocalStorageStore<T>({
  key,
  fallback,
  parse,
  serialize,
}: LocalStorageStoreOptions<T>): LocalStorageStore<T> {
  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeToKey(key, onStoreChange),
    [key],
  );

  const getSnapshot = useCallback((): T => {
    const raw = readRaw(key);
    const cached = valueCache.get(key);
    if (cached && cached.raw === raw) return cached.value as T;

    // parse قد يرمي استثناء (بيانات JSON فاسدة) أو يرجع undefined — كلاهما يعني

    let parsed: T | undefined;
    if (raw !== null) {
      try {
        parsed = parse(raw);
      } catch {
        parsed = undefined;
      }
    }
    const value = parsed === undefined ? fallback : parsed;
    valueCache.set(key, { raw, value });
    return value;
  }, [key, fallback, parse]);

  const getServerSnapshot = useCallback((): T => fallback, [fallback]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, serialize(next));
      } catch {
        // نُبقي التغيير في الذاكرة فقط
      }
      notify(key);
    },
    [key, serialize],
  );

  const updateValue = useCallback(
    (updater: (previous: T) => T) => {
      setValue(updater(getSnapshot()));
    },
    [getSnapshot, setValue],
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    notify(key);
  }, [key]);

  const hydrated = useSyncExternalStore(
    emptySubscribe,
    getClientTrue,
    getServerFalse,
  );

  return { value, setValue, updateValue, removeValue, hydrated };
}
