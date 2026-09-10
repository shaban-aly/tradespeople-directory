"use client";

import { IconChevronLeft, IconHome } from "@/components/shared/icons";
import { openSearchModal } from "@/hooks/search/useSearchModal";

export function HeroClientCta() {
  return (
    <div className="relative mx-auto mt-5 max-w-xl sm:mt-8 sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card text-start shadow-card sm:rounded-3xl">
        <div className="pointer-events-none absolute -left-10 -bottom-14 h-56 w-56 rounded-full bg-accent/10 sm:h-80 sm:w-80" />
        <IconHome className="pointer-events-none absolute left-5 top-5 h-12 w-12 text-accent/25 sm:left-10 sm:top-8 sm:h-20 sm:w-20" />

        <div className="relative z-10 grid min-h-27.5 grid-cols-[1fr_38%] items-center py-4 pr-4 sm:min-h-36.25 sm:grid-cols-[1fr_30%] sm:px-8 sm:py-6 md:grid-cols-[1fr_250px]">
          <div>
            <h2 className="font-heading text-lg font-extrabold leading-tight text-foreground sm:text-2xl">
              محتاج <span className="text-accent">صنايعي؟</span>
            </h2>
            <p className="mt-1 max-w-lg text-xs font-medium leading-snug text-muted sm:mt-1.5 sm:text-sm md:text-base">
              ابحث عن أفضل الصنايعية في السويس، قارن التقييمات وتواصل مباشرة بكل سهولة.
            </p>
            <div className="mt-3 sm:mt-4">
              <button
                type="button"
                onClick={() => openSearchModal()}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0f172a] px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-[#1e293b] hover:scale-105 hover:shadow-lg active:scale-95 sm:px-6 sm:py-2.5 sm:text-sm"
              >
                <span>ابدأ البحث الآن</span>
                <IconChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>

          <div />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 flex w-[42%] items-end justify-start sm:w-[35%] md:w-75">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-images/client-banner.webp"
          alt=""
          className="w-full max-h-37.5 object-contain object-bottom drop-shadow-xl sm:max-h-50 md:max-h-56.25"
        />
      </div>
    </div>
  );
}
