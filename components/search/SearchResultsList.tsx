import type { SearchSuggestion } from "@/lib/search";
import { SearchResultRow } from "@/components/search/SearchResultRow";

export function SearchResultsList({
  suggestions,
  query,
  activeIndex = -1,
  onSelect,
}: {
  suggestions: SearchSuggestion[];
  query: string;
  activeIndex?: number;
  onSelect?: () => void;
}) {
  const groups = [
    {
      label: "التصنيفات",
      items: suggestions.filter((suggestion) => suggestion.kind === "category"),
    },
    {
      label: "المناطق",
      items: suggestions.filter((suggestion) => suggestion.kind === "area"),
    },
    {
      label: "الصنايعية",
      items: suggestions.filter((suggestion) => suggestion.kind === "craftsman"),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <ul className="flex flex-col gap-0.5">
      {groups.map((group) => (
        <li key={group.label}>
          <p className="px-3 pb-1 pt-2 text-sm font-bold text-muted">
            {group.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((suggestion) => (
              <li key={`${suggestion.kind}-${suggestion.href}`}>
                <SearchResultRow
                  suggestion={suggestion}
                  query={query}
                  active={suggestions[activeIndex] === suggestion}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
