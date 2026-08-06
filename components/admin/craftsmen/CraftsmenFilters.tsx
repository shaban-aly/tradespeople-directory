import { SearchInput } from "@/components/admin/SearchInput";
import type { CategoryRow } from "@/lib/db/admin";
import type { CraftsmanFilter } from "@/lib/db/admin-selectors";

const selectClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-base text-foreground focus:border-accent focus:outline-none";

export function CraftsmenFilters({
  filter,
  categories,
  onChange,
}: {
  filter: CraftsmanFilter;
  categories: CategoryRow[];
  onChange: (next: Partial<CraftsmanFilter>) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_repeat(3,minmax(10rem,1fr))]">
      <SearchInput
        value={filter.search}
        onChange={(search) => onChange({ search })}
        placeholder="ابحث بالاسم أو الهاتف..."
      />
      <select
        value={filter.category}
        onChange={(event) =>
          onChange({ category: event.target.value })
        }
        className={selectClass}
      >
        <option value="all">كل التخصصات</option>
        {categories.map((category) => (
          <option key={category.id} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>
      <select
        value={filter.published}
        onChange={(event) =>
          onChange({
            published: event.target.value as CraftsmanFilter["published"],
          })
        }
        className={selectClass}
      >
        <option value="all">منشور / مخفي</option>
        <option value="published">منشور فقط</option>
        <option value="hidden">مخفي فقط</option>
      </select>
      <select
        value={filter.verified}
        onChange={(event) =>
          onChange({
            verified: event.target.value as CraftsmanFilter["verified"],
          })
        }
        className={selectClass}
      >
        <option value="all">موثّق / غير موثق</option>
        <option value="verified">موثّق فقط</option>
        <option value="unverified">غير موثق فقط</option>
      </select>
    </div>
  );
}
