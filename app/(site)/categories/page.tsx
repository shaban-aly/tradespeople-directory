import type { Metadata } from "next";
import { getCategoriesWithCounts, getStats } from "@/lib/db/queries";
import { CategoryHeader } from "@/components/category/CategoryHeader";
import { CategoryDirectory } from "@/components/category/CategoryDirectory";
import { JsonLd } from "@/components/shared/seo/JsonLd";
import { allCategoriesSchema } from "@/lib/seo/schema";
import { categoriesSeo } from "@/lib/seo/metadata";

// لا تحديث دوري — يُبطَّل الكاش عبر Supabase Webhook → /api/webhooks/supabase
export const revalidate = false;

export const metadata: Metadata = {
  title: categoriesSeo.title,
  description: categoriesSeo.description,
  keywords: categoriesSeo.keywords,
  alternates: { canonical: "/categories" },
  openGraph: {
    title: categoriesSeo.ogTitle,
    description: categoriesSeo.ogDescription,
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: categoriesSeo.ogTitle,
    description: categoriesSeo.ogDescription,
    images: ["/og.jpg"],
  },
};

export default async function CategoriesPage() {
  const [stats, categories] = await Promise.all([
    getStats(),
    getCategoriesWithCounts(),
  ]);

  const activeCount = categories.filter((c) => (c.count ?? 0) > 0).length;

  return (
    <>
      <JsonLd data={allCategoriesSchema(categories)} />
      <CategoryHeader
        categoriesCount={categories.length}
        totalCraftsmen={stats.craftsmen}
        activeCount={activeCount}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
        <CategoryDirectory categories={categories} />
      </main>
    </>
  );
}
