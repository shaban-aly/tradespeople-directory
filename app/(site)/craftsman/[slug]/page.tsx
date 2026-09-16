import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCategoryBySlug,
  getCraftsmanBySlug,
  getCraftsmen,
  getCraftsmenByCategory,
} from "@/lib/db/queries";
import { JsonLd } from "@/components/shared/seo/JsonLd";
import { CraftsmanDetail } from "@/components/craftsman/CraftsmanDetail";
import { RelatedCraftsmen } from "@/components/craftsman/RelatedCraftsmen";
import { IconTrendingUp } from "@/components/shared/icons";
import { breadcrumbSchema, craftsmanSchema } from "@/lib/seo/schema";
import { rankRelatedCraftsmen } from "@/lib/recommendations";
import { getCraftsmanRatingSummary } from "@/lib/db/reviews";
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
          url: craftsman.image || "/og.webp",
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

  const [category, categoryCraftsmen, ratingSummary] =
    await Promise.all([
      getCategoryBySlug(craftsman.category),
      getCraftsmenByCategory(craftsman.category),
      getCraftsmanRatingSummary(craftsman.id),
    ]);

  // القسم الذكي «شاهد أيضاً»: نفس التخصص مرتباً بالأكثر تواصلاً/ظهوراً
  const relatedCraftsmen = rankRelatedCraftsmen(
    categoryCraftsmen,
    { count: 6, excludeId: craftsman.id },
  );

  return (
    <>
      <div className="mx-auto w-full max-w-4xl px-4 pb-8 pt-4">
        <JsonLd
          data={breadcrumbSchema([
            { name: "الرئيسية", url: `${siteUrl}/` },
            ...(category
              ? [
                  {
                    name: category.name,
                    url: `${siteUrl}/category/${category.slug}`,
                  },
                ]
              : []),
            {
              name: craftsman.name,
              url: `${siteUrl}/craftsman/${craftsman.slug}`,
            },
          ])}
        />
        <JsonLd data={craftsmanSchema(craftsman, category?.name ?? "صنايعي")} />
        <CraftsmanDetail
          craftsman={craftsman}
          category={category}
          ratingSummary={ratingSummary}
        />
      </div>

      <RelatedCraftsmen
        id="related"
        eyebrow="صنايعية مقترحة"
        title="شاهد أيضاً"
        description="من نفس التخصص — الأكثر تواصلاً وطلباً بين أهالي السويس."
        icon={<IconTrendingUp className="h-4 w-4" />}
        craftsmen={relatedCraftsmen}
        categories={category ? [category] : []}
      />
    </>
  );
}
