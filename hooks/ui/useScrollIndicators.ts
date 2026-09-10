"use client";

import { useEffect, useState, type RefObject } from "react";

export function useScrollIndicators(
  containerRef: RefObject<HTMLElement | null>,
  itemCount: number,
) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || itemCount <= 1) {
      setActiveIndex(0);
      return;
    }

    const cards = Array.from(
      container.querySelectorAll<HTMLElement>("[data-snap-card]"),
    );
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = -1;
        let bestRatio = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = cards.indexOf(entry.target as HTMLElement);
          if (entry.intersectionRatio > bestRatio) {
            bestIndex = index;
            bestRatio = entry.intersectionRatio;
          }
        }
        if (bestIndex >= 0) setActiveIndex(bestIndex);
      },
      { root: container, threshold: 0.5 },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [containerRef, itemCount]);

  return activeIndex;
}