import type { Metadata } from "next";
import { ReportForm } from "@/components/join/ReportForm";

// صفحة ثابتة تماماً — لا تحديث دوري ولا webhook مطلوب
export const revalidate = false;

export const metadata: Metadata = {
  title: "أبلغ عن بيانات خاطئة",
  description:
    "لقيت رقم متغير أو بيانات غلط عن صنايعي في الدليل؟ بلغنا وبنراجع البيانات في نفس اليوم.",
  alternates: { canonical: "/report" },
  openGraph: {
    title: "أبلغ عن بيانات خاطئة — دليل الصنايعية في السويس",
    description:
      "لقيت رقم متغير أو بيانات غلط عن صنايعي في الدليل؟ بلغنا وبنراجع البيانات في نفس اليوم.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "أبلغ عن بيانات خاطئة — دليل الصنايعية في السويس",
    description:
      "لقيت رقم متغير أو بيانات غلط عن صنايعي في الدليل؟ بلغنا وبنراجع البيانات في نفس اليوم.",
    images: ["/og.png"],
  },
};

interface Props {
  searchParams: Promise<{ craftsman?: string }>;
}

export default async function ReportPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <ReportForm initialCraftsmanName={params.craftsman ?? ""} />
    </div>
  );
}