import type { Category, Craftsman } from "@/lib/data/craftsmen";
import type { RatingSummary } from "@/lib/db/reviews";
import { CraftsmanContactCard } from "@/components/craftsman/CraftsmanContactCard";
import { CompactRelatedCraftsmen } from "@/components/craftsman/CompactRelatedCraftsmen";

interface CraftsmanSidebarProps {
  craftsman: Craftsman;
  category?: Category;
  ratingSummary?: RatingSummary;
  relatedCraftsmen: Craftsman[];
  className?: string;
}

export function CraftsmanSidebar({
  craftsman,
  category,
  ratingSummary,
  relatedCraftsmen,
  className = "",
}: CraftsmanSidebarProps) {
  return (
    <aside
      aria-label="خيارات التواصل والصناع المشابهين"
      className={`w-full lg:w-80 xl:w-92 shrink-0 sticky top-24 self-start flex flex-col gap-5 ${className}`}
    >
      {/* [1] كارت الاتصال والتواصل المباشر الملتصق */}
      <CraftsmanContactCard
        craftsman={craftsman}
        category={category}
        ratingSummary={ratingSummary}
      />

      {/* [2] كروت الصناع البدلاء الموثوقين بنفس التخصص */}
      <CompactRelatedCraftsmen
        craftsmen={relatedCraftsmen}
        category={category}
        maxItems={4}
      />
    </aside>
  );
}
