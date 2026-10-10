import type { Metadata } from "next";
import { getAreas, getCategories, searchCraftsmen } from "@/lib/db/queries";
import type { CraftsmanSort } from "@/lib/data/craftsmen";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchSidebar } from "@/components/search/SearchSidebar";
import { SearchResults } from "@/components/search/SearchResults";
import { SearchHeaderTrigger } from "@/components/search/SearchHeaderTrigger";
import { PushActivationLayer } from "@/components/notifications/PushActivationLayer";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string | string[];
  category?: string | string[];
  area?: string | string[];
  sort?: string | string[];
  limit?: string | string[];
};

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const query = firstParam(params.q).trim();
  return {
    title: query ? `بحث: ${query}` : "البحث في دليل الصنايعية",
    description:
      "ابحث عن صنايعي محترف في السويس بالاسم أو التخصص أو المنطقة، وقارن التقييمات وتواصل مباشرة.",
    alternates: { canonical: "/search" },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = firstParam(params.q).trim();
  const category = firstParam(params.category);
  const area = firstParam(params.area);
  const sort: CraftsmanSort = firstParam(params.sort) === "recent" ? "recent" : "verified";

  const hasActiveFilter = Boolean(query || category || area);
  const defaultLimit = hasActiveFilter ? 16 : 6;
  const parsedLimit = parseInt(firstParam(params.limit), 10);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : defaultLimit;

  const [craftsmen, categories, areas] = await Promise.all([
    searchCraftsmen(query, category, area, sort, limit),
    getCategories(),
    getAreas(),
  ]);

  const hasMore = craftsmen.length >= limit && limit < 200;
  const nextLimit = limit + (hasActiveFilter ? 16 : 12);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-radial-[ellipse_at_top] from-accent/5 via-card to-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
          <h1 className="font-heading text-2xl font-extrabold text-foreground sm:text-3xl lg:text-4xl">
            {query ? `نتائج البحث عن «${query}»` : "البحث في دليل صنايعية السويس"}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm sm:text-base text-muted">
            {query
              ? "تصفح الفنيين المتاحين المطابقين لبحثك، أو استخدم الفلاتر بالأسفل لتحديد التخصص والحي."
              : "ابحث بالاسم أو المهنة أو الحي، وقارن بين الصنايعية الموثقين وتواصل معهم مباشرة."}
          </p>

          <SearchHeaderTrigger initialQuery={query} />
          <PushActivationLayer context={{ scope: "general" }} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
          {/* السايدبار الثابت على الديسكتوب */}
          <aside className="hidden lg:block lg:w-64 xl:w-72 shrink-0 sticky top-24">
            <SearchSidebar
              categories={categories}
              areas={areas}
              current={{ query, category, area, sort }}
            />
          </aside>

          {/* مساحة النتائج والفلاتر المطبقة */}
          <main className="flex-1 min-w-0">
            <SearchFilters
              categories={categories}
              areas={areas}
              current={{ query, category, area, sort }}
            />
            <SearchResults
              craftsmen={craftsmen}
              categories={categories}
              query={query}
              category={category}
              area={area}
              sort={sort}
              hasMore={hasMore}
              nextLimit={nextLimit}
            />
          </main>
        </div>
      </section>
    </>
  );
}
