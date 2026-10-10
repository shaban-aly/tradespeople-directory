import type { Metadata } from "next";
import { siteName, siteUrl } from "@/lib/data/site";
import { privacyPolicy } from "@/lib/data/legal";
import { LegalPage } from "@/components/shared/legal/LegalPage";

export const metadata: Metadata = {
  title: "سياسة الخصوصية — دليل الصنايعية في السويس",
  description:
    "تعرف على سياسة الخصوصية وحماية البيانات في دليل الصنايعية: حماية سرية المستخدمين، تشفير البيانات عبر Supabase، وعدم مشاركة أي معلومات مع جهات إعلانية.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "سياسة الخصوصية — دليل الصنايعية في السويس",
    description:
      "كيف نجمع بياناتك ونستخدمها ونحميها في دليل الصنايعية — بشفافية ووضوح تام وبأعلى معايير الأمان المتبعة.",
    type: "website",
    url: `${siteUrl}/privacy`,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "سياسة الخصوصية في دليل الصنايعية" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "سياسة الخصوصية — دليل الصنايعية في السويس",
    description:
      "كيف نجمع بياناتك ونستخدمها ونحميها في دليل الصنايعية — بشفافية ووضوح تام وبأعلى معايير الأمان المتبعة.",
  },
};

export default function PrivacyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "سياسة الخصوصية — دليل الصنايعية في السويس",
    description: privacyPolicy.description,
    url: `${siteUrl}/privacy`,
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
      <LegalPage doc={privacyPolicy} />
    </>
  );
}