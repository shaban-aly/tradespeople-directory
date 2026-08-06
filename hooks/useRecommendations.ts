"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  hasBehaviorHistory,
  rankRecommendations,
  readBehaviorEventsCached,
  subscribeBehavior,
  type BehaviorEvent,
  type RecommendableCraftsman,
} from "@/lib/recommendations";

const EMPTY_EVENTS: BehaviorEvent[] = [];

export function useRecommendations(
  pool: RecommendableCraftsman[],
  count = 8,
) {
  const events = useSyncExternalStore(
    subscribeBehavior,
    readBehaviorEventsCached,
    () => EMPTY_EVENTS,
  );

  const ranked = useMemo(
    () => rankRecommendations(pool, events, { count }),
    [pool, events, count],
  );
  const hasHistory = useMemo(
    () => hasBehaviorHistory(events),
    [events],
  );

  return { ranked, hasHistory };
}
