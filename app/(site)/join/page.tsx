import type { Metadata } from "next";
import { getAreas, getCategories } from "@/lib/db/queries";
import { JoinForm } from "@/components/join/JoinForm";

// لا تحديث دوري — التصنيفات والمناطق تُبطَّل عبر Supabase Webhook
export const revalidate = false;

export const metadata: Metadata = {
  title: "انضم كصنايعي | دليل السويس",
  description:
    "سجّل بياناتك وتخصصك لينضم ملفك لدليل صنايعية السويس — تواصل مباشر مع العملاء واتفاقك بالكامل معك.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/join" },
  openGraph: {
    title: "انضم كصنايعي — دليل الصنايعية في السويس",
    description:
      "سجّل اسمك وتخصصك ومنطقتك لينضم ملفك إلى دليل الصنايعية في السويس.",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630 }],
  },
};

export default async function JoinPage() {
  const [categories, areas] = await Promise.all([getCategories(), getAreas()]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <JoinForm categories={categories} areas={areas} />
    </div>
  );
}
