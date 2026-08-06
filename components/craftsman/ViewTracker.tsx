"use client";

import { useEffect, useRef } from "react";
import { useStats } from "@/hooks/useStats";

export function ViewTracker({ slug }: { slug: string }) {
  const { track } = useStats();
  const sentSlug = useRef<string | null>(null);

  useEffect(() => {
    if (!slug || sentSlug.current === slug) return;
    sentSlug.current = slug;
    track(slug, "view");
  }, [slug, track]);

  return null;
}
