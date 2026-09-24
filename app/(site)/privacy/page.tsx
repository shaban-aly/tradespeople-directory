import type { Metadata } from "next";
import { privacyPolicy } from "@/lib/data/legal";
import { LegalPage } from "@/components/shared/legal/LegalPage";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description:
    "إزاي بنجمع بياناتك ونستخدمها ونحميها في دليل الصنايعية — بأسلوب واضح وبسيط.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "سياسة الخصوصية — دليل الصنايعية في السويس",
    description:
      "إزاي بنجمع بياناتك ونستخدمها ونحميها في دليل الصنايعية.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
};

export default function PrivacyPage() {
  return <LegalPage doc={privacyPolicy} />;
}