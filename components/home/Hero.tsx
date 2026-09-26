import { getCategoriesWithCounts, getStats } from "@/lib/db/queries";
import { AnimatedNumber } from "@/components/shared/ui/AnimatedNumber";
import { TrustStrip } from "@/components/shared/ui/TrustStrip";
import { HeroSearchButton } from "@/components/home/HeroSearchButton";
import { HeroSearchTags } from "@/components/home/HeroSearchTags";
import { HeroAudienceCarousel } from "@/components/home/HeroAudienceCarousel";
import { IconGrid, IconMapPin, IconUsers } from "@/components/shared/icons";
import { getHeroSearchTags } from "@/lib/utils/hero";

export async function Hero() {
  const [stats, allCategories] = await Promise.all([
    getStats(),
    getCategoriesWithCounts(),
  ]);

  const searchTags = getHeroSearchTags(allCategories);

  return (
    <section className="relative overflow-hidden pt-4 pb-8 sm:pt-14 sm:pb-12">
      {/* صورة الخلفية الحقيقية مع طبقة التعتيم الزجاجية المتكيفة ديناميكياً مع الثيم */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <picture>
          <source
            media="(max-width: 767px)"
            srcSet="/hero-images/pol_mobile.webp"
          />
          <source
            media="(min-width: 768px)"
            srcSet="/hero-images/pol_desktop.webp"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-images/pol_mobile.webp"
            alt="صنايعي سباك أثناء صيانة منزلية بالسويس"
            className="h-full w-full object-cover object-center"
            fetchPriority="high"
            loading="eager"
            decoding="sync"
          />
        </picture>

        {/* تدرج خفيف زجاجي لضمان قراءة النصوص مع إبراز صورة الخلفية */}
        <div className="absolute inset-0 bg-linear-to-b from-white/40 via-white/25 to-white/50 dark:from-[#090d16]/70 dark:via-[#0d131f]/60 dark:to-[#0b101b]/80" />

        {/* تدرج تلاشي ناعم في أسفل الهيرو لدمج الصورة بانسيابية تامة مع قسم التصنيفات وخلفية الموقع */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 sm:h-36 bg-linear-to-b from-transparent via-background/50 to-background" />
      </div>

      {/* المحتوى الرئيسي للهيرو */}
      <div className="relative mx-auto w-full max-w-5xl px-4 text-center">
        {/* الشارة العلوية الدائرية */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 dark:border-white/15 dark:bg-black/40 px-4 py-1.5 backdrop-blur-md shadow-sm mb-2 sm:mb-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-wide drop-shadow-sm">
            صنايعية موثوقين بالقرب منك
          </span>
        </div>

        {/* العنوان الرئيسي */}
        <h1 className="mx-auto max-w-3xl font-heading text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight drop-shadow-sm">
          الصنايعي اللي محتاجه
          <br />
          <span className="text-accent">في السويس</span> خلال ثواني
        </h1>

        {/* النص التوضيحي */}
        <p className="mx-auto mt-1.5 sm:mt-4 max-w-xl text-sm sm:text-lg text-slate-800 dark:text-zinc-200 leading-relaxed drop-shadow-sm font-medium text-halo">
          سباك، كهربائي، نقاش، نجار أو تكييف ...
          <br className="hidden sm:inline" />
          ابحث عن التخصص واختار الصنايعي المناسب.
        </p>

        {/* شريط البحث المدمج الأنيق مع تاجات البحث السريعة الأكثر طلباً */}
        <div className="mx-auto mt-3 sm:mt-7 max-w-xl sm:max-w-2xl md:max-w-3xl flex flex-col gap-2.5">
          <HeroSearchButton />
          <HeroSearchTags tags={searchTags} />
        </div>

        {/* كارت الإحصائيات الزجاجي الشفاف */}
        <div className="mx-auto mt-3 sm:mt-5 max-w-xl sm:max-w-2xl md:max-w-3xl rounded-3xl border border-white/40 dark:border-white/10 bg-white/30 dark:bg-[#121824]/70 p-3 sm:p-5 backdrop-blur-md shadow-sm dark:shadow-xl">
          <dl className="grid grid-cols-3 divide-x divide-x-reverse divide-white/40 dark:divide-white/10">
            <div className="flex flex-col items-center justify-center px-2">
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-sky-400 mb-1">
                <IconUsers className="h-4 w-4 sm:h-6 sm:w-6" />
                <span className="font-heading text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white drop-shadow-sm">
                  +<AnimatedNumber value={stats.craftsmen} />
                </span>
              </div>
              <span className="text-[11px] sm:text-sm text-slate-700 dark:text-zinc-400 font-semibold drop-shadow-sm">
                صنايعي متاح
              </span>
            </div>

            <div className="flex flex-col items-center justify-center px-2">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 mb-1">
                <IconGrid className="h-4 w-4 sm:h-6 sm:w-6" />
                <span className="font-heading text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white drop-shadow-sm">
                  +<AnimatedNumber value={stats.categories} />
                </span>
              </div>
              <span className="text-[11px] sm:text-sm text-slate-700 dark:text-zinc-400 font-semibold drop-shadow-sm">
                تخصص
              </span>
            </div>

            <div className="flex flex-col items-center justify-center px-2">
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-sky-400 mb-1">
                <IconMapPin className="h-4 w-4 sm:h-6 sm:w-6" />
                <span className="font-heading text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white drop-shadow-sm">
                  +<AnimatedNumber value={stats.areas} />
                </span>
              </div>
              <span className="text-[11px] sm:text-sm text-slate-700 dark:text-zinc-400 font-semibold drop-shadow-sm">
                منطقة
              </span>
            </div>
          </dl>
        </div>

        {/* شريط الميزات الثلاث — زجاجي خفيف */}
        <TrustStrip
          tone="image"
          className="mx-auto mt-2.5 sm:mt-4 flex max-w-xl sm:max-w-2xl md:max-w-3xl items-center justify-center"
        />

        {/* كارت أنت صنايعي؟ */}
        <HeroAudienceCarousel />
      </div>
    </section>
  );
}
