import Link from "next/link";
import Image from "next/image";
import { highlightQuery, type SearchSuggestion } from "@/lib/search";
import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";
import { VerifiedBadge } from "@/components/shared/ui/VerifiedBadge";
import { IconSearch, IconWrench } from "@/components/shared/icons";

export function SearchResultRow({
  suggestion,
  query = "",
  active = false,
  onSelect,
}: {
  suggestion: SearchSuggestion;
  query?: string;
  active?: boolean;
  onSelect?: () => void;
}) {
  const nameParts = highlightQuery(suggestion.name, query);

  return (
    <Link
      href={suggestion.href}
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        active ? "bg-card text-foreground" : "text-foreground hover:bg-card"
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent/10 text-accent">
        {suggestion.kind === "craftsman" ? (
          suggestion.image ? (
            <Image
              src={suggestion.image}
              alt=""
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          ) : (
            <IconWrench className="h-4 w-4" />
          )
        ) : suggestion.kind === "category" && suggestion.icon ? (
          <CategoryIcon name={suggestion.icon} className="h-4 w-4" />
        ) : (
          <IconSearch className="h-4 w-4" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-base font-bold">
            {nameParts.map((part, index) => (
              <span
                key={index}
                className={part.isMatch ? "text-accent" : undefined}
              >
                {part.text}
              </span>
            ))}
          </span>
          {suggestion.verified && <VerifiedBadge />}
        </span>
        <span className="block truncate text-sm text-muted">
          {suggestion.subtitle}
        </span>
      </span>
    </Link>
  );
}
