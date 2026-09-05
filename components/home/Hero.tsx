import { getStats } from "@/lib/db/queries";
import { heroVideos, type HeroVideoSource } from "@/lib/data/site";
import { ButtonAnchor, ButtonLink } from "@/components/shared/ui/Button";
import { HeroVideo } from "@/components/home/HeroVideo";
import { SearchBox } from "@/components/search/SearchBox";
import { MobileSearch } from "@/components/search/MobileSearch";
import { AnimatedNumber } from "@/components/shared/ui/AnimatedNumber";

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/70 px-4 py-3 text-center">
      <div className="font-heading text-2xl font-extrabold text-foreground">
        <AnimatedNumber value={value} />
      </div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}

export async function Hero({ videos = heroVideos }: { videos?: HeroVideoSource[] }) {
  const stats = await getStats();

  return (
    <section className="relative">
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        {videos.length > 0 ? (
          <>
            <HeroVideo videos={videos} />
            <div
              className="absolute inset-0 bg-background/70 dark:bg-background/40"
              aria-hidden
            />
          </>
        ) : (
          <div className="h-full w-full bg-background" aria-hidden />
        )}
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-4 py-20 text-center sm:py-28">
        <h1 className="mx-auto max-w-3xl font-heading text-4xl font-extrabold leading-tight sm:text-5xl">
          الصنايعي اللي محتاجه، في السويس، خلال ثواني
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted sm:text-lg">
          دليلك لأفضل الصنايعية المحليين — سباك، كهربائي، نجار... اختار التخصص
          وكلم الصنايعي مباشرة
        </p>

        <div className="mx-auto mt-6 max-w-xl">
          <div className="hidden sm:block">
            <SearchBox />
          </div>
          <div className="sm:hidden">
            <MobileSearch />
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonAnchor
            href="/categories"
            variant="action"
            size="md"
            className="w-full sm:w-auto"
          >
            تصفح التصنيفات
          </ButtonAnchor>
          <ButtonLink
            href="/join"
            variant="outline"
            size="md"
            className="w-full sm:w-auto"
          >
            أضف صنايعي
          </ButtonLink>
        </div>

        <dl className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Stat value={stats.craftsmen} label="صنايعي متاح" />
          <Stat value={stats.categories} label="تخصص" />
          <Stat value={stats.areas} label="منطقة" />
        </dl>
      </div>
    </section>
  );
}
