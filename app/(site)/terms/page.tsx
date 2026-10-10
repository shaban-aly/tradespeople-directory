import type { Metadata } from "next";
import { siteName, siteUrl } from "@/lib/data/site";
import { termsOfService } from "@/lib/data/legal";
import { LegalPage } from "@/components/shared/legal/LegalPage";

export const metadata: Metadata = {
  title: "الشروط والأحكام — دليل الصنايعية في السويس",
  description:
    "اتفاقية استخدام دليل الصنايعية في السويس: شروط وضوابط طلبات الصيانة، معايير التقييمات العادلة، التزامات الحرفيين، والتعامل المالي المباشر بدون وسطاء.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "الشروط والأحكام — دليل الصنايعية في السويس",
    description:
      "اتفاقية استخدام دليل الصنايعية في السويس — الضوابط والحقوق والمسؤوليات المتبادلة بين المنصة وأهالي المدينة والحرفيين.",
    type: "website",
    url: `${siteUrl}/terms`,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "الشروط والأحكام في دليل الصنايعية" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "الشروط والأحكام — دليل الصنايعية في السويس",
    description:
      "اتفاقية استخدام دليل الصنايعية في السويس — الضوابط والحقوق والمسؤوليات المتبادلة بين المنصة وأهالي المدينة والحرفيين.",
  },
};

export default function TermsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "الشروط والأحكام — دليل الصنايعية في السويس",
    description: termsOfService.description,
    url: `${siteUrl}/terms`,
    isPartOf: {
      "@type": "WebSite",
      name: siteName,
      url: siteUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LegalPage doc={termsOfService} />
    </>
  );
}