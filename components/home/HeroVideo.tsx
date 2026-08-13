"use client";

import { useSyncExternalStore } from "react";
import type { HeroVideoSource } from "@/lib/data/site";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

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

export function HeroVideo({ videos }: { videos: HeroVideoSource[] }) {
  const reducedMotion = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (reducedMotion || videos.length === 0) {
    return <div className="h-full w-full bg-background" aria-hidden />;
  }

  return (
    <video
      className="h-full w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      disablePictureInPicture
      preload="metadata"
      aria-hidden
    >
      {videos.map((video) => (
        <source key={video.src} src={video.src} media={video.media} />
      ))}
    </video>
  );
}
