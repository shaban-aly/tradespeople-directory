import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getCraftsmanBySlug, getCraftsmen } from "@/lib/db/queries";
import { Footer } from "@/components/shared/layout/Footer";
import { Header } from "@/components/shared/layout/Header";
import { CraftsmanDetail } from "@/components/craftsman/CraftsmanDetail";

export const revalidate = 3600;

export async function generateStaticParams() {
  const craftsmen = await getCraftsmen();
  return craftsmen.map((craftsman) => ({ slug: craftsman.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const craftsman = await getCraftsmanBySlug(slug);
  if (!craftsman) return {};
  return {
    title: craftsman.name,
    description: craftsman.description,
  };
}

export default async function CraftsmanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const craftsman = await getCraftsmanBySlug(slug);
  if (!craftsman) notFound();

  const category = await getCategoryBySlug(craftsman.category);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <CraftsmanDetail craftsman={craftsman} category={category} />
      </main>
      <Footer />
    </div>
  );
}
