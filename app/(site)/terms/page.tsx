import type { Metadata } from "next";
import { termsOfService } from "@/lib/data/legal";
import { LegalPage } from "@/components/shared/legal/LegalPage";

export const metadata: Metadata = {
  title: "الشروط والأحكام",
  description:
    "اتفاقية استخدام دليل الصنايعية — دورك وحقوقك ومسؤولياتك كزائر أو صنايعي.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "الشروط والأحكام — دليل الصنايعية في السويس",
    description:
      "اتفاقية استخدام دليل الصنايعية — دورك وحقوقك ومسؤولياتك كزائر أو صنايعي.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
};

export default function TermsPage() {
  return <LegalPage doc={termsOfService} />;
}