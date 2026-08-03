"use client";

import { useRef, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function useHydratedValue<T>(
  serverValue: T,
  makeClientValue: () => T,
): T {
  const clientValueRef = useRef<T | null>(null);
  if (clientValueRef.current === null) {
    clientValueRef.current = makeClientValue();
  }
  return useSyncExternalStore(
    emptySubscribe,
    () => clientValueRef.current as T,
    () => serverValue,
  );
}
