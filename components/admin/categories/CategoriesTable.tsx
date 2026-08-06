import { ToggleSwitch } from "@/components/admin/ToggleSwitch";
import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";
import { IconEdit, IconTrash } from "@/components/shared/icons";
import type { CategoryRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";

export function CategoriesTable({
  categories,
  counts,
  busyKey,
  onEdit,
  onToggle,
  onDelete,
}: {
  categories: CategoryRow[];
  counts: Record<string, number>;
  busyKey: string;
  onEdit: (category: CategoryRow) => void;
  onToggle: (category: CategoryRow) => void;
  onDelete: (category: CategoryRow) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-right">
        <thead>
          <tr className="border-b border-border text-base text-muted">
            <th className="py-3 pr-2 font-bold">الأيقونة</th>
            <th className="py-3 px-3 font-bold">الاسم</th>
            <th className="py-3 px-3 font-bold">slug</th>
            <th className="py-3 px-3 font-bold">الصنايعية</th>
            <th className="py-3 px-3 font-bold">نشط</th>
            <th className="py-3 pl-2 font-bold">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr
              key={category.id}
              className="border-b border-border last:border-0"
            >
              <td className="py-3 pr-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <CategoryIcon name={category.icon} className="h-6 w-6" />
                </div>
              </td>
              <td className="py-3 px-3 text-base font-bold text-foreground">
                {category.name}
              </td>
              <td className="py-3 px-3 text-base text-muted" dir="ltr">
                {category.slug}
              </td>
              <td className="py-3 px-3 text-base text-muted">
                {toArabicDigits(counts[category.slug] ?? 0)}
              </td>
              <td className="py-3 px-3">
                <ToggleSwitch
                  checked={category.is_active}
                  onChange={() => onToggle(category)}
                  disabled={busyKey === `category-${category.id}`}
                  label={`إظهار/إخفاء ${category.name}`}
                />
              </td>
              <td className="py-3 pl-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    aria-label="تعديل"
                    onClick={() => onEdit(category)}
                    className="rounded-xl border border-border p-3 text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    <IconEdit className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="حذف"
                    onClick={() => onDelete(category)}
                    className="rounded-xl border border-border p-3 text-muted transition-colors hover:border-danger hover:text-danger"
                  >
                    <IconTrash className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
