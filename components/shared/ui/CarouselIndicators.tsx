"use client";

import type { RefObject } from "react";
import { useScrollIndicators } from "@/hooks/ui/useScrollIndicators";

export function CarouselIndicators({
  containerRef,
  count,
  className = "",
}: {
  containerRef: RefObject<HTMLElement | null>;
  count: number;
  className?: string;
}) {
  const activeIndex = useScrollIndicators(containerRef, count);

  if (count <= 1) return null;

  return (
    <div
      className={`mt-3 flex items-center justify-center gap-1.5 ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full bg-accent transition-all duration-300 ${
            i === activeIndex ? "w-4 opacity-100" : "w-1.5 opacity-30"
          }`}
        />
      ))}
    </div>
  );
}