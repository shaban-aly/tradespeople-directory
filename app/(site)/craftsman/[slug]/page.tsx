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
import { getCraftsmanSeo } from "@/lib/seo/metadata";
import { rankRelatedCraftsmen } from "@/lib/recommendations";
import { getCraftsmanRatingSummary } from "@/lib/db/reviews";
import { CraftsmanSidebar } from "@/components/craftsman/CraftsmanSidebar";
import { PushActivationLayer } from "@/components/notifications/PushActivationLayer";
import { siteUrl } from "@/lib/data/site";
import { supabaseTransformUrl } from "@/lib/utils/image-transform";


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
  const categoryName = category?.name ?? "صنايعي";
  const seo = getCraftsmanSeo({
    name: craftsman.name,
    categoryName,
    singularName: category?.singular_name ?? "صنايعي",
    pluralName: category?.plural_name ?? "صنايعية",
    area: craftsman.area,
    customDescription: craftsman.description,
  });
  // og/twitter: نطلب من Supabase نسخة 1200×630 مقصوصة (نفس الأبعاد المعلنة)
  // بدل إرسال الصورة الأصلية — الروابط تُبنى وقت الطلب والأصل لا يُمس.
  const ogImage = craftsman.image
    ? supabaseTransformUrl(craftsman.image, {
      width: 1200,
      height: 630,
      resize: "cover",
    }) ?? craftsman.image
    : "/og.jpg";

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: `/craftsman/${craftsman.slug}` },
    openGraph: {
      title: seo.ogTitle,
      description: seo.description,
      type: "profile",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: seo.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${craftsman.name} — ${categoryName} في السويس`,
      description: seo.description,
      images: [ogImage],
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
      <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-4">
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
        <JsonLd data={craftsmanSchema(craftsman, category?.name ?? "صنايعي", ratingSummary)} />

        {/* تخطيط عمودين للديسكتوب: المحتوى الرئيسي يميناً والسايدبار الملتصق يساراً */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
          {/* العمود الرئيسي: البروفايل، النبذة، السوشيال، التقييمات */}
          <div className="flex-1 min-w-0 w-full">
            <CraftsmanDetail
              craftsman={craftsman}
              category={category}
              ratingSummary={ratingSummary}
            />
          </div>

          {/* السايد بار الأيسر الملتصق: كارت الاتصال الثابت + الصناع البدلاء بنفس التخصص */}
          <CraftsmanSidebar
            craftsman={craftsman}
            category={category}
            ratingSummary={ratingSummary}
            relatedCraftsmen={relatedCraftsmen}
            className="hidden lg:flex"
          />
        </div>

        <PushActivationLayer
          context={{
            scope: "category",
            refId: craftsman.category,
            label: category?.name,
          }}
        />
      </div>

      {/* قسم «شاهد أيضاً» الأفقي — يظهر على الموبايل والتابلت فقط */}
      <RelatedCraftsmen
        id="related"
        eyebrow="صنايعية مقترحة"
        title="شاهد أيضاً"
        description="من نفس التخصص — الأكثر تواصلاً وطلباً بين أهالي السويس."
        icon={<IconTrendingUp className="h-4 w-4" />}
        craftsmen={relatedCraftsmen}
        categories={category ? [category] : []}
        className="lg:hidden"
      />
    </>
  );
}
