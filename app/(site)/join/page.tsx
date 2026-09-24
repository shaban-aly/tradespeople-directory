import type { Metadata } from "next";
import { getAreas, getCategories } from "@/lib/db/queries";
import { JoinForm } from "@/components/join/JoinForm";

// لا تحديث دوري — التصنيفات والمناطق تُبطَّل عبر Supabase Webhook
export const revalidate = false;

export const metadata: Metadata = {
  title: "أضف صنايعي",
  description:
    "سجّل دخولك وأضف صنايعي للدليل — الصنايعي هيترتبط بحسابك لما يوافق عليه المشرف.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/join" },
  openGraph: {
    title: "أضف صنايعي — دليل الصنايعية في السويس",
    description:
      "سجّل اسمك وتخصصك ومنطقتك لينضم دليلك إلى دليل الصنايعية في السويس.",
    type: "website",
    images: [{ url: "/og.webp", width: 1200, height: 630 }],
  },
};

export default async function JoinPage() {
  const [categories, areas] = await Promise.all([getCategories(), getAreas()]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <JoinForm categories={categories} areas={areas} />
    </div>
  );
}
