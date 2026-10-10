import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAreas,
  getCategories,
  getCategoryBySlug,
  getCraftsmenByCategory,
} from "@/lib/db/queries";
import { getAvailableAreas } from "@/lib/data/craftsmen";
import { JsonLd } from "@/components/shared/seo/JsonLd";
import { CategoryDetailHeader } from "@/components/category/CategoryDetailHeader";
import { CategoryTracker } from "@/components/category/CategoryTracker";
import { CraftsmanList } from "@/components/category/CraftsmanList";
import { PushActivationLayer } from "@/components/notifications/PushActivationLayer";
import { breadcrumbSchema, categoryPageSchema } from "@/lib/seo/schema";
import { siteUrl } from "@/lib/data/site";
import { getCategorySeo } from "@/lib/seo/metadata";

// لا تحديث دوري — يُبطَّل الكاش عبر Supabase Webhook → /api/webhooks/supabase
export const revalidate = false;

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

  const seo = getCategorySeo(
    category.name,
    category.singular_name,
    category.plural_name,
  );

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title: seo.ogTitle,
      description: seo.description,
      type: "website",
      images: [{ url: "/og.jpg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.ogTitle,
      description: seo.description,
      images: ["/og.jpg"],
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
  const availableAreas = getAvailableAreas(craftsmen, areas);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "الرئيسية", url: `${siteUrl}/` },
          { name: "كل التصنيفات", url: `${siteUrl}/categories` },
          { name: category.name, url: `${siteUrl}/category/${category.slug}` },
        ])}
      />
      <JsonLd data={categoryPageSchema(category, craftsmen)} />
      <CategoryTracker slug={category.slug} />
      <PushActivationLayer
        context={{ scope: "category", refId: category.slug, label: category.name }}
      />

      <CategoryDetailHeader
        category={category}
        craftsmenCount={craftsmen.length}
        verifiedCount={verifiedCount}
        coveredAreasCount={availableAreas.length}
      />

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-10">
        <CraftsmanList
          craftsmen={craftsmen}
          areas={areas}
          category={category}
        />
      </section>
    </>
  );
}
