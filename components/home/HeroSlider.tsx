"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import type { HeroImage } from "@/lib/data/site";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const SLIDE_INTERVAL = 5000;

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(reducedMotionQuery);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(reducedMotionQuery).matches;
}

function getServerSnapshot() {
  return true;
}

function ResponsiveImage({ images, alt }: { images: HeroImage[]; alt: string }) {
  return (
    <picture className="absolute inset-0 h-full w-full">
      {images.map((image) => (
        <source key={image.src} srcSet={image.src} media={image.media} />
      ))}
      <Image
        src={images[images.length - 1].src}
        alt={alt}
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />
    </picture>
  );
}

export function HeroSlider({ slides }: { slides: { alt: string; images: HeroImage[] }[] }) {
  const reducedMotion = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [active, setActive] = useState(0);

  const goTo = useCallback(
    (index: number) => setActive((index + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (reducedMotion || slides.length <= 1) return;

    const id = setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, SLIDE_INTERVAL);

    return () => clearInterval(id);
  }, [reducedMotion, slides.length]);

  return (
    <div className="relative h-full w-full">
      {slides.map((slide, index) => (
        <div
          key={slide.alt}
          aria-hidden={index !== active}
          className={
            index === active
              ? "absolute inset-0 opacity-100 transition-opacity duration-700"
              : "absolute inset-0 opacity-0"
          }
        >
          <ResponsiveImage images={slide.images} alt={slide.alt} />
        </div>
      ))}

      {slides.length > 1 && !reducedMotion && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.alt}
              type="button"
              onClick={() => goTo(index)}
              aria-label={index === active ? "الشريحة الحالية" : `الانتقال للشريحة ${index + 1}`}
              className={`h-2 rounded-full transition-all ${
                index === active ? "w-6 bg-white" : "w-2 bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
