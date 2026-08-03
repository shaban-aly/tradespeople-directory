import type { Metadata } from "next";
import { getCategoriesWithCounts, getStats } from "@/lib/db/queries";
import { toArabicDigits } from "@/lib/utils/format";
import { CategoryGrid } from "@/components/categories/CategoryGrid";
import { Footer } from "@/components/shared/layout/Footer";
import { Header } from "@/components/shared/layout/Header";
import { JsonLd } from "@/components/shared/seo/JsonLd";
import { allCategoriesSchema } from "@/lib/seo/schema";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "كل التصنيفات",
  description: "تصفح كل تخصصات دليل الصنايعية في السويس واختار الأنسب لك.",
  alternates: { canonical: "/categories" },
  openGraph: {
    title: "كل التصنيفات — دليل الصنايعية في السويس",
    description: "تصفح كل تخصصات دليل الصنايعية في السويس واختار الأنسب لك.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
};

export default async function CategoriesPage() {
  const [stats, categories] = await Promise.all([
    getStats(),
    getCategoriesWithCounts(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <JsonLd data={allCategoriesSchema(categories)} />
        <section className="border-b border-border bg-card">
          <div className="mx-auto w-full max-w-5xl px-4 py-8">
            <p className="text-sm font-bold text-muted">دليل الصنايعية · السويس</p>
            <h1 className="mt-1 font-heading text-3xl font-extrabold sm:text-4xl">
              كل التصنيفات
            </h1>
            <p className="mt-2 max-w-xl text-base text-muted">
              {toArabicDigits(stats.categories)} تخصص — اختار اللي يناسبك واوصل للصنايعي المناسب.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 py-8">
          <CategoryGrid categories={categories} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
