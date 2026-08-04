import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getCraftsmanBySlug, getCraftsmen, getCraftsmenByCategory } from "@/lib/db/queries";
import { Footer } from "@/components/shared/layout/Footer";
import { Header } from "@/components/shared/layout/Header";
import { JsonLd } from "@/components/shared/seo/JsonLd";
import { CraftsmanDetail } from "@/components/craftsman/CraftsmanDetail";
import { CraftsmanCard } from "@/components/shared/ui/CraftsmanCard";
import { SectionHeader } from "@/components/shared/ui/SectionHeader";
import { breadcrumbSchema, craftsmanSchema } from "@/lib/seo/schema";
import { siteUrl } from "@/lib/data/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  const craftsmen = await getCraftsmen();
  return craftsmen.map((craftsman) => ({ slug: craftsman.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const craftsman = await getCraftsmanBySlug(slug);
  if (!craftsman) return {};
  const category = await getCategoryBySlug(craftsman.category);
  const title = category
    ? `${craftsman.name} — ${category.name} في السويس`
    : craftsman.name;
  return {
    title,
    description: craftsman.description,
    alternates: { canonical: `/craftsman/${craftsman.slug}` },
    openGraph: {
      title: `${craftsman.name} — ${category?.name ?? "صنايعي"} في السويس | دليل الصنايعية`,
      description: craftsman.description,
      type: "profile",
      images: [
        {
          url: craftsman.image || "/og.png",
          ...(craftsman.image ? {} : { width: 1200, height: 630 }),
        },
      ],
    },
  };
}

export default async function CraftsmanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const craftsman = await getCraftsmanBySlug(slug);
  if (!craftsman) notFound();

  const [category, categoryCraftsmen] = await Promise.all([
    getCategoryBySlug(craftsman.category),
    getCraftsmenByCategory(craftsman.category),
  ]);

  const relatedCraftsmen = categoryCraftsmen
    .filter((c) => c.slug !== craftsman.slug)
    .slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-8 pt-4">
        <JsonLd
          data={breadcrumbSchema([
            { name: "الرئيسية", url: `${siteUrl}/` },
            ...(category
              ? [{ name: category.name, url: `${siteUrl}/category/${category.slug}` }]
              : []),
            { name: craftsman.name, url: `${siteUrl}/craftsman/${craftsman.slug}` },
          ])}
        />
        <JsonLd
          data={craftsmanSchema(craftsman, category?.name ?? "صنايعي")}
        />
        <CraftsmanDetail craftsman={craftsman} category={category} />

        {relatedCraftsmen.length > 0 && (
          <section className="mt-12">
            <SectionHeader
              eyebrow="أكثر صنايعية"
              title={`صنايعية ${category?.name ?? "نفس التخصص"} آخرون`}
              description="صنايعية آخرون في نفس التخصص — تواصل معهم مباشرة بدون وسيط."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedCraftsmen.map((related) => (
                <CraftsmanCard
                  key={related.id}
                  craftsman={related}
                  category={category}
                />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
