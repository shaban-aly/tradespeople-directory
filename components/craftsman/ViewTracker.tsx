"use client";

import { useEffect, useRef } from "react";
import { useStats } from "@/hooks/useStats";
import { track } from "@/lib/analytics/track";

export function ViewTracker({
  slug,
  categorySlug,
  area,
}: {
  slug: string;
  categorySlug?: string;
  area?: string;
}) {
  const { track: counterTrack } = useStats();
  const sentSlug = useRef<string | null>(null);

  useEffect(() => {
    if (!slug || sentSlug.current === slug) return;
    sentSlug.current = slug;
    counterTrack(slug, "view", categorySlug);
    track("view_craftsman", {
      craftsman_slug: slug,
      category_slug: categorySlug,
      area,
    });
  }, [slug, categorySlug, area, counterTrack]);

  return null;
}