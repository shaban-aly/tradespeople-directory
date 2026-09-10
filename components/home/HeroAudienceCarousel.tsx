"use client";

import { HeroClientCta } from "@/components/home/HeroClientCta";
import { HeroCraftsmanCta } from "@/components/home/HeroCraftsmanCta";
import { useHeroAudienceCarousel } from "@/hooks/useHeroAudienceCarousel";

const slides = [
  { label: "بطاقة البحث عن صنايعي", content: <HeroClientCta /> },
  { label: "بطاقة الانضمام كصنايعي", content: <HeroCraftsmanCta /> },
];

export function HeroAudienceCarousel() {
  const { activeSlide, setActiveSlide, pause, resume } = useHeroAudienceCarousel();
  return (
    <div className="relative" aria-roledescription="carousel" aria-label="خدمات دليل الصنايعية" onMouseEnter={pause} onMouseLeave={resume} onFocusCapture={pause} onBlurCapture={resume}>
      <div className="h-45 sm:h-50 md:h-56.25" aria-live="polite">
        {slides[activeSlide].content}
      </div>
      <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="اختيار البطاقة">
        {slides.map((slide, index) => <button key={slide.label} type="button" role="tab" aria-label={slide.label} aria-selected={activeSlide === index} onClick={() => setActiveSlide(index)} className={`h-3 rounded-full transition-all ${activeSlide === index ? "w-9 bg-accent" : "w-3 bg-border hover:bg-muted"}`} />)}
      </div>
    </div>
  );
}
