"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/track";

export function CategoryTracker({ slug }: { slug: string }) {
  const sent = useRef<string | null>(null);

  useEffect(() => {
    if (sent.current === slug) return;
    sent.current = slug;
    track("view_category", { category_slug: slug });
  }, [slug]);

  return null;
}