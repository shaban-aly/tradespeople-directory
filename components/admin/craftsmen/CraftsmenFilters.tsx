import { SearchInput } from "@/components/admin/SearchInput";
import { AdminSelect } from "@/components/admin/ui/AdminSelect";
import type { CategoryRow } from "@/lib/db/admin";
import type { CraftsmanFilter } from "@/lib/db/admin-selectors";

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
      <AdminSelect
        value={filter.category}
        onChange={(event) => onChange({ category: event.target.value })}
      >
        <option value="all">كل التخصصات</option>
        {categories.map((category) => (
          <option key={category.id} value={category.slug}>
            {category.name}
          </option>
        ))}
      </AdminSelect>
      <AdminSelect
        value={filter.published}
        onChange={(event) =>
          onChange({ published: event.target.value as CraftsmanFilter["published"] })
        }
      >
        <option value="all">منشور / مخفي</option>
        <option value="published">منشور فقط</option>
        <option value="hidden">مخفي فقط</option>
      </AdminSelect>
      <AdminSelect
        value={filter.verified}
        onChange={(event) =>
          onChange({ verified: event.target.value as CraftsmanFilter["verified"] })
        }
      >
        <option value="all">موثّق / غير موثق</option>
        <option value="verified">موثّق فقط</option>
        <option value="unverified">غير موثق فقط</option>
      </AdminSelect>
    </div>
  );
}
