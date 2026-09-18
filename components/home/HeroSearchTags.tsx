"use client";

import { openSearchModal } from "@/hooks/search/useSearchModal";

interface SearchTag {
  name: string;
  slug: string;
}

interface HeroSearchTagsProps {
  tags: SearchTag[];
}

export function HeroSearchTags({ tags }: HeroSearchTagsProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1" data-tour="hero-search-tags">
      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-400 shrink-0 drop-shadow-sm">
        الأكثر طلباً:
      </span>
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {tags.map((tag) => (
          <button
            key={tag.slug}
            type="button"
            onClick={() => openSearchModal(tag.name)}
            className="inline-flex items-center rounded-full border border-white/50 dark:border-white/10 bg-white/40 dark:bg-card/70 px-2.5 sm:px-3 py-1 text-xs font-semibold text-slate-800 dark:text-zinc-300 backdrop-blur-sm transition-all hover:border-blue-500/60 hover:bg-white/70 dark:hover:bg-card hover:text-blue-700 dark:hover:text-sky-400 active:scale-95 shadow-sm drop-shadow-sm"
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );
}
