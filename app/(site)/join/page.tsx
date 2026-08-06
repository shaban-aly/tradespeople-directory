import type { Metadata } from "next";
import { getAreas, getCategories } from "@/lib/db/queries";
import { JoinForm } from "@/components/join/JoinForm";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "أضف صنايعي",
  description:
    "سجّل اسمك وتخصصك ومنطقتك لينضم دليلك إلى دليل الصنايعية في السويس.",
  alternates: { canonical: "/join" },
  openGraph: {
    title: "أضف صنايعي — دليل الصنايعية في السويس",
    description:
      "سجّل اسمك وتخصصك ومنطقتك لينضم دليلك إلى دليل الصنايعية في السويس.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
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
