import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAreas, getCategories, getCategoryBySlug, getCraftsmenByCategory } from "@/lib/db/queries";
import { toArabicDigits } from "@/lib/utils/format";
import { Footer } from "@/components/shared/layout/Footer";
import { Header } from "@/components/shared/layout/Header";
import { JsonLd } from "@/components/shared/seo/JsonLd";
import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";
import { CraftsmanList } from "@/components/category/CraftsmanList";
import { breadcrumbSchema, categoryPageSchema } from "@/lib/seo/schema";
import { siteUrl } from "@/lib/data/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: `أفضل ${category.name} في السويس — اتصل أو راسل واتساب مباشرة.`,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title: `${category.name} في السويس — دليل الصنايعية`,
      description: `أفضل ${category.name} في السويس — اتصل أو راسل واتساب مباشرة.`,
      type: "website",
      images: [{ url: "/og.png", width: 1200, height: 630 }],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [craftsmen, areas] = await Promise.all([
    getCraftsmenByCategory(slug),
    getAreas(),
  ]);

  const verifiedCount = craftsmen.filter((c) => c.verified).length;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <JsonLd
          data={breadcrumbSchema([
            { name: "الرئيسية", url: `${siteUrl}/` },
            { name: category.name, url: `${siteUrl}/category/${category.slug}` },
          ])}
        />
        <JsonLd data={categoryPageSchema(category, craftsmen)} />
        <section className="relative overflow-hidden border-b border-border bg-card">
          <div
            className="absolute inset-0 bg-gradient-to-b from-accent/10 to-card"
            aria-hidden
          />
          <div className="relative mx-auto w-full max-w-5xl px-4 py-10">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-accent/15 p-3 text-accent">
                <CategoryIcon name={category.icon} className="h-9 w-9" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-muted">
                  دليل الصنايعية · السويس
                </p>
                <h1 className="mt-1 font-heading text-3xl font-extrabold sm:text-4xl">
                  {category.name}
                </h1>
                <p className="mt-2 max-w-xl text-base text-muted">
                  اختر الصنايعي المناسب لمنطقتك واتصل به مباشرة — بدون تسجيل
                  أو وسيط.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-border bg-background px-4 py-2 text-base font-bold">
                {toArabicDigits(craftsmen.length)}{" "}
                {craftsmen.length === 1 ? "صنايعي" : "صنايعية"}
              </div>
              {verifiedCount > 0 && (
                <div className="rounded-full border border-border bg-background px-4 py-2 text-base font-bold text-action">
                  {toArabicDigits(verifiedCount)} موثّق
                </div>
              )}
              <div className="rounded-full border border-border bg-background px-4 py-2 text-base font-bold">
                {toArabicDigits(areas.length)} منطقة
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 py-8">
          <CraftsmanList craftsmen={craftsmen} areas={areas} category={category} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
