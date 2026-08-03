import type { Metadata } from "next";
import { getAreas, getCategories, searchCraftsmen } from "@/lib/db/queries";
import type { CraftsmanSort } from "@/lib/data/craftsmen";
import { Footer } from "@/components/shared/layout/Footer";
import { Header } from "@/components/shared/layout/Header";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchResults } from "@/components/search/SearchResults";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string | string[];
  category?: string | string[];
  area?: string | string[];
  sort?: string | string[];
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
    title: query ? `بحث: ${query}` : "البحث",
    description:
      "ابحث عن صنايعي محترف في السويس بالاسم أو التخصص أو المنطقة.",
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

  const [craftsmen, categories, areas] = await Promise.all([
    searchCraftsmen(query, category, area, sort),
    getCategories(),
    getAreas(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="border-b border-border bg-card">
          <div className="mx-auto w-full max-w-5xl px-4 py-8">
            <p className="text-sm font-bold text-muted">دليل الصنايعية · السويس</p>
            <h1 className="mt-1 font-heading text-3xl font-extrabold sm:text-4xl">
              البحث
            </h1>
            <p className="mt-2 max-w-xl text-base text-muted">
              {query
                ? `نتائج البحث عن «${query}»`
                : "ابحث عن صنايعي بالاسم أو التخصص أو المنطقة، واتصل به مباشرة."}
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 py-8">
          <SearchFilters
            categories={categories}
            areas={areas}
            current={{ query, category, area, sort }}
          />
          <SearchResults
            craftsmen={craftsmen}
            categories={categories}
            query={query}
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}
