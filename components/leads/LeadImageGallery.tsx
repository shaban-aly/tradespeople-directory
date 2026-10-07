"use client";

import { useState } from "react";
import { ImageViewer } from "@/components/shared/ImageViewer";

/**
 * مصغرات صور المشكلة + عارض مكبّر قابل للتقليب.
 * لا يُعرض شيء عند غياب الصور — الكارت المتضمن يقرر ذلك.
 */
export function LeadImageGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="flex gap-2 overflow-x-auto" role="list" aria-label="صور المشكلة">
        {images.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            role="listitem"
            onClick={() => setOpenIndex(i)}
            aria-label={`عرض الصورة ${i + 1} من ${images.length} بحجم كامل`}
            className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-background transition-transform hover:scale-[1.03] active:scale-95"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${alt} — صورة ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      <ImageViewer
        src={null}
        alt={alt}
        title="صور المشكلة"
        open={openIndex !== null}
        onClose={() => setOpenIndex(null)}
        images={images}
        index={openIndex ?? 0}
        onIndexChange={setOpenIndex}
      />
    </>
  );
}
