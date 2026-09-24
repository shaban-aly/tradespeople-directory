import type { Metadata } from "next";
import { getCategoriesWithCounts, getStats } from "@/lib/db/queries";
import { toArabicDigits } from "@/lib/utils/format";
import { CategoryGrid } from "@/components/categories/CategoryGrid";
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
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: categoriesSeo.ogTitle,
    description: categoriesSeo.ogDescription,
    images: ["/og.png"],
  },
};

export default async function CategoriesPage() {
  const [stats, categories] = await Promise.all([
    getStats(),
    getCategoriesWithCounts(),
  ]);

  return (
    <>
      <JsonLd data={allCategoriesSchema(categories)} />
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-5xl px-4 py-8">
          <p className="text-sm font-bold text-muted">
            دليل الصنايعية · السويس
          </p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold sm:text-4xl">
            كل التصنيفات
          </h1>
          <p className="mt-2 max-w-xl text-base text-muted">
            {toArabicDigits(stats.categories)} تخصص — اختار اللي يناسبك واوصل
            للصنايعي المناسب.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-8">
        <CategoryGrid categories={categories} />
      </section>
    </>
  );
}
