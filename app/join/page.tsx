import type { Metadata } from "next";
import { getAreas, getCategories } from "@/lib/db/queries";
import { Footer } from "@/components/shared/layout/Footer";
import { Header } from "@/components/shared/layout/Header";
import { JoinForm } from "@/components/join/JoinForm";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "أضف صنايعي",
  description:
    "سجّل اسمك وتخصصك ومنطقتك لينضم دليلك إلى دليل الصنايعية في السويس.",
};

export default async function JoinPage() {
  const [categories, areas] = await Promise.all([getCategories(), getAreas()]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <JoinForm categories={categories} areas={areas} />
      </main>
      <Footer />
    </div>
  );
}
