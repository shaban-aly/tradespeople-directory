"use client";

import { useEffect, useState } from "react";

const SLIDE_COUNT = 2;
const AUTOPLAY_DELAY = 7000;

export function useHeroAudienceCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (isPaused || reduceMotion.matches) return;
    const interval = window.setInterval(() => {
      setActiveSlide((slide) => (slide + 1) % SLIDE_COUNT);
    }, AUTOPLAY_DELAY);
    return () => window.clearInterval(interval);
  }, [isPaused]);

  return { activeSlide, setActiveSlide, pause: () => setIsPaused(true), resume: () => setIsPaused(false) };
}
