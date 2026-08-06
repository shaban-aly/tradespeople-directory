"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ViewMode = "grid" | "list";

const STORAGE_KEY = "craftsmen-view-mode";
const listeners = new Set<() => void>();

function readStored(): ViewMode {
  const stored =
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem(STORAGE_KEY);
  return stored === "list" ? "list" : "grid";
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useViewPreference() {
  const view = useSyncExternalStore<ViewMode>(
    subscribe,
    readStored,
    () => "grid",
  );

  const setView = useCallback((next: ViewMode) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // تجاهل فشل التخزين (تصفح خاص)
    }
    emitChange();
  }, []);

  return { view, setView };
}
