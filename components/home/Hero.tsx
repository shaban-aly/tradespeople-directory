import Link from "next/link";
import { getStats } from "@/lib/db/queries";
import { Zap } from "lucide-react";
import { AnimatedNumber } from "@/components/shared/ui/AnimatedNumber";
import { TrustStrip } from "@/components/shared/ui/TrustStrip";
import { HeroSearchButton } from "@/components/home/HeroSearchButton";
import { HeroAudienceCarousel } from "@/components/home/HeroAudienceCarousel";
import {
  IconChevronLeft,
  IconGrid,
  IconMapPin,
  IconUsers,
} from "@/components/shared/icons";

export async function Hero() {
  const stats = await getStats();

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
          { }
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
        <div className="absolute inset-0 bg-linear-to-b from-background/50 via-background/30 to-background/60 dark:from-background/80 dark:via-background/70 dark:to-background/90" />

        {/* تدرج تلاشي ناعم في أسفل الهيرو لدمج الصورة بانسيابية تامة مع قسم التصنيفات وخلفية الموقع */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 sm:h-36 bg-linear-to-b from-transparent via-background/50 to-background" />
      </div>

      {/* المحتوى الرئيسي للهيرو */}
      <div className="relative mx-auto w-full max-w-5xl px-4 text-center">
        {/* الشارة العلوية الدائرية */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 backdrop-blur-md shadow-xs mb-2 sm:mb-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-action opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-action" />
          </span>
          <span className="text-xs sm:text-sm font-bold text-foreground tracking-wide drop-shadow-xs">
            صنايعية موثوقين بالقرب منك
          </span>
        </div>

        {/* العنوان الرئيسي */}
        <h1 className="mx-auto max-w-3xl font-heading text-3xl sm:text-5xl font-extrabold text-foreground leading-tight tracking-tight drop-shadow-xs">
          الصنايعي اللي محتاجه
          <br />
          <span className="text-accent">في السويس</span> خلال ثواني
        </h1>

        {/* النص التوضيحي */}
        <p className="mx-auto mt-1.5 sm:mt-4 max-w-xl text-sm sm:text-lg text-foreground/90 leading-relaxed drop-shadow-xs font-medium text-halo">
          سباك، كهربائي، نقاش، نجار أو تكييف ...
          <br className="hidden sm:inline" />
          ابحث عن التخصص واختار الصنايعي المناسب.
        </p>

        {/* شريط البحث المدمج الأنيق */}
        <div className="mx-auto mt-3 sm:mt-7 max-w-xl sm:max-w-2xl md:max-w-3xl flex flex-col gap-2.5">
          <HeroSearchButton />
        </div>

        {/* كبسولة طلب فني سريعة — مكملة زجاجية انسيابية لشريط البحث */}
        <div className="mx-auto mt-3 sm:mt-4 max-w-md px-4 sm:px-0">
          <Link
            href="/request/new"
            className="group flex min-h-12 w-full items-center justify-between gap-3 rounded-full border border-border/70 bg-card/75 px-3.5 py-2 sm:px-4.5 shadow-xs backdrop-blur-md transition-all hover:border-accent/60 hover:bg-card/90 hover:shadow-md active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent group-hover:bg-accent group-hover:text-on-accent transition-colors">
                <Zap className="h-4 w-4 fill-current" />
              </span>
              <span className="text-xs sm:text-sm font-bold text-foreground text-start leading-tight">
                سجل طلبك وانتظر مكالمة من الصنايعي
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-muted group-hover:text-accent transition-colors">
              <span className="hidden sm:inline text-xs font-semibold">طلب فني</span>
              <IconChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>

        {/* كارت الإحصائيات الزجاجي الشفاف */}
        <div className="mx-auto mt-3 sm:mt-5 max-w-xl sm:max-w-2xl md:max-w-3xl rounded-3xl border border-border/60 bg-card/60 p-3 sm:p-5 backdrop-blur-md shadow-card">
          <dl className="grid grid-cols-3 divide-x divide-x-reverse divide-border/60">
            <div className="flex flex-col items-center justify-center px-2">
              <div className="flex items-center gap-1.5 text-accent mb-1">
                <IconUsers className="h-4 w-4 sm:h-6 sm:w-6" />
                <span className="font-heading text-xl sm:text-3xl font-extrabold text-foreground drop-shadow-xs">
                  +<AnimatedNumber value={stats.craftsmen} />
                </span>
              </div>
              <span className="text-xs sm:text-sm text-muted font-semibold drop-shadow-xs">
                صنايعي متاح
              </span>
            </div>

            <div className="flex flex-col items-center justify-center px-2">
              <div className="flex items-center gap-1.5 text-action mb-1">
                <IconGrid className="h-4 w-4 sm:h-6 sm:w-6" />
                <span className="font-heading text-xl sm:text-3xl font-extrabold text-foreground drop-shadow-xs">
                  +<AnimatedNumber value={stats.categories} />
                </span>
              </div>
              <span className="text-xs sm:text-sm text-muted font-semibold drop-shadow-xs">
                تخصص
              </span>
            </div>

            <div className="flex flex-col items-center justify-center px-2">
              <div className="flex items-center gap-1.5 text-accent mb-1">
                <IconMapPin className="h-4 w-4 sm:h-6 sm:w-6" />
                <span className="font-heading text-xl sm:text-3xl font-extrabold text-foreground drop-shadow-xs">
                  +<AnimatedNumber value={stats.areas} />
                </span>
              </div>
              <span className="text-xs sm:text-sm text-muted font-semibold drop-shadow-xs">
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
