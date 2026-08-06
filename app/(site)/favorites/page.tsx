import type { Metadata } from "next";
import { getCategories, getCraftsmen } from "@/lib/db/queries";
import { FavoritesPanel } from "@/components/favorites/FavoritesPanel";

export const metadata: Metadata = {
  title: "محفوظاتي — دليل الصنايعية",
  description:
    "الصنايعية اللي حفظتهم في السويس — كلمهم على طول أو راسلهم واتساب.",
  robots: { index: false, follow: false },
};

export const revalidate = 3600;

export default async function FavoritesPage() {
  const [craftsmen, categories] = await Promise.all([
    getCraftsmen(),
    getCategories(),
  ]);

  return (
    <>
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-5xl px-4 py-8">
          <p className="text-sm font-bold text-muted">دليل الصنايعية · السويس</p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold sm:text-4xl">
            محفوظاتي
          </h1>
          <p className="mt-2 max-w-xl text-base text-muted">
            الصنايعية اللي حافظت عليهم بضغطة النجمة — لو مفيش، اضغط النجمة
            على أي كارت عشان تلاقيه هنا.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-8">
        <FavoritesPanel craftsmen={craftsmen} categories={categories} />
      </section>
    </>
  );
}
