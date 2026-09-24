"use client";

import { useEffect, useRef } from "react";
import { useStats } from "@/hooks/useStats";
import { track } from "@/lib/analytics/track";
import { recordUniqueCraftsmanView } from "@/lib/utils/view-dedup";

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

    // احتساب مشاهدة فريدة واحدة فقط لكل 24 ساعة لنفس الفني
    if (recordUniqueCraftsmanView(slug)) {
      counterTrack(slug, "view", categorySlug);
    }

    track("view_craftsman", {
      craftsman_slug: slug,
      category_slug: categorySlug,
      area,
    });
  }, [slug, categorySlug, area, counterTrack]);

  return null;
}