"use client";

import { useState } from "react";
import Link from "next/link";
import { IconChevronLeft, IconUserPlus } from "@/components/shared/icons";

export function HeroCraftsmanCta() {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative mx-auto mt-5 sm:mt-8 max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
      {/* الكارت: overflow-hidden لقطع الخلفية فقط */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-l from-[#a7f3d0] via-[#bbf7d0] to-[#86efac] shadow-md hover:shadow-lg transition-shadow text-start">
        {/* علامة مائية */}
        <div className="pointer-events-none absolute -left-2 -bottom-2 text-emerald-700/15">
          <IconUserPlus className="h-28 w-28 sm:h-40 sm:w-40" />
        </div>

        {/* grid عمودين RTL: النص يمين، الفراغ للصورة يسار */}
        <div className="relative z-9 grid grid-cols-[1fr_38%] sm:grid-cols-[1fr_30%] md:grid-cols-[1fr_250px] items-center min-h-27.5 sm:min-h-36.25 pr-4 sm:pr-8 py-4 sm:py-6">
          {/* النصوص — العمود الأيمن في RTL */}
          <div>
            <h2 className="font-heading text-lg sm:text-2xl font-extrabold text-[#0f172a] leading-tight">
             أنت صنايعي؟
            </h2>
            <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm md:text-base text-[#1e293b] leading-snug font-medium max-w-lg">
             انضم إلى دليل الصنايعية وإوصل لعملاء أكثر في السويس
            </p>

            {/* ميزات سريعة تظهر على الشاشات الكبيرة */}
            <div className="hidden sm:flex items-center gap-2.5 mt-2.5 text-xs font-bold text-emerald-950">
              <span className="inline-flex items-center gap-1 bg-white/65 px-3 py-1 rounded-full border border-emerald-600/20 shadow-2xs">
                ✓ تسجيل مجاني 100%
              </span>
              <span className="inline-flex items-center gap-1 bg-white/65 px-3 py-1 rounded-full border border-emerald-600/20 shadow-2xs">
                ✓ تواصل مباشر مع الزبائن
              </span>
            </div>

            <div className="mt-3 sm:mt-4">
              <Link
                href="/join"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0f172a] px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:bg-[#1e293b] hover:shadow-lg hover:scale-105 active:scale-95"
              >
                <span>سجل كصنايعي الآن</span>
                <IconChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
            </div>
          </div>

          {/* فراغ عمود الصورة — العمود الأيسر في RTL */}
          <div />
        </div>
      </div>

      {/* الصورة: تبرز للأعلى بشكل مدروس على الموبايل والديسكتوب ثلاثي الأبعاد */}
      {!imageError && (
        <div className="absolute left-0 bottom-0 w-[34%] sm:w-[28%] md:w-62.5 pointer-events-none flex items-end justify-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-images/craftsman-banner.webp"
            alt="انضم كصنايعي"
            className="w-full max-h-32 sm:max-h-43.75 md:max-h-48.75 object-contain object-bottom drop-shadow-xl"
            onError={() => setImageError(true)}
          />
        </div>
      )}
    </div>
  );
}
