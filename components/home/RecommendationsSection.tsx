import type { Category } from "@/lib/data/craftsmen";
import type { CraftsmanWithStats } from "@/lib/db/queries";
import { RecommendationsPanel } from "@/components/home/RecommendationsPanel";

export async function RecommendationsSection({
  pool,
  categories,
}: {
  pool: CraftsmanWithStats[];
  categories: Category[];
}) {
  if (pool.length === 0) return null;

  return (
    <section className="border-t border-border bg-card/40 py-16">
      <div className="mx-auto w-full max-w-5xl px-4">
        <RecommendationsPanel pool={pool} categories={categories} />
      </div>
    </section>
  );
}
