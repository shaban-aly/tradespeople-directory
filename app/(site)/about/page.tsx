import type { Metadata } from "next";
import { siteName, siteUrl } from "@/lib/data/site";
import { AboutHero } from "@/components/about/AboutHero";
import { AboutStory } from "@/components/about/AboutStory";
import { AboutFeatures } from "@/components/about/AboutFeatures";
import { AboutValues } from "@/components/about/AboutValues";
import { AboutSuezPride } from "@/components/about/AboutSuezPride";
import { AboutCta } from "@/components/about/AboutCta";

export const metadata: Metadata = {
  title: "عن دليل الصنايعية — منصة بأيدي شباب السويس",
  description:
    "تعرف على قصة دليل الصنايعية في السويس: مبادرة شبابية مجانية تربط أهالي السويس بأمهر الحرفيين والفنيين بدون وسيط، ومميزات المنصة ورؤيتنا لتشجيع منتج بلدنا.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "عن دليل الصنايعية — منصة بأيدي شباب السويس",
    description:
      "مبادرة شبابية مجانية تربط أهالي السويس بأمهر الفنيين وأصحاب المهن الحرفية مباشرة وبدون وسطاء أو عمولات.",
    type: "website",
    url: `${siteUrl}/about`,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "عن دليل الصنايعية في السويس" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "عن دليل الصنايعية — منصة بأيدي شباب السويس",
    description:
      "مبادرة شبابية مجانية تربط أهالي السويس بأمهر الفنيين وأصحاب المهن الحرفية مباشرة وبدون وسطاء أو عمولات.",
  },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "عن دليل الصنايعية في السويس",
    description:
      "منصة خدمية مجانية أسسها شباب من محافظة السويس لربط أصحاب المنازل بالحرفيين والفنيين الموثوقين بدون وسيط.",
    url: `${siteUrl}/about`,
    mainEntity: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
      areaServed: {
        "@type": "AdministrativeArea",
        name: "محافظة السويس",
      },
      foundingLocation: {
        "@type": "Place",
        name: "السويس، مصر",
      },
      knowsAbout: [
        "خدمات الصيانة المنزلية",
        "سباكة في السويس",
        "كهرباء في السويس",
        "نجارة ونقاشة وتكييف",
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen">
        <AboutHero />
        <AboutStory />
        <AboutFeatures />
        <AboutValues />
        <AboutSuezPride />
        <AboutCta />
      </main>
    </>
  );
}
