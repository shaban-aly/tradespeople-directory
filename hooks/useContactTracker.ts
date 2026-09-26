"use client";

import { useCallback } from "react";
import { useStats } from "@/hooks/useStats";
import { track } from "@/lib/analytics/track";

export function useContactTracker({
  craftsmanId,
  craftsmanSlug,
  craftsmanName,
  categoryName,
  categorySlug,
}: {
  craftsmanId?: string;
  craftsmanSlug?: string;
  craftsmanName?: string;
  categoryName?: string;
  categorySlug?: string;
}) {
  const { track: counterTrack } = useStats();

  const handleContact = useCallback(
    (method: "phone" | "whatsapp") => {
      if (craftsmanSlug) {
        counterTrack(craftsmanSlug, method === "phone" ? "call" : "whatsapp", categorySlug);
        track("contact_click", {
          craftsman_id: craftsmanId,
          craftsman_slug: craftsmanSlug,
          craftsman_name: craftsmanName,
          category: categoryName,
          contact_method: method,
        });
      }
    },
    [
      counterTrack,
      craftsmanId,
      craftsmanSlug,
      craftsmanName,
      categoryName,
      categorySlug,
    ]
  );

  return { handleContact };
}
