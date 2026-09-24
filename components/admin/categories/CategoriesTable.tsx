import { ToggleSwitch } from "@/components/admin/ToggleSwitch";
import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import {
  DataTable,
  DataTableCell,
  DataTableRow,
} from "@/components/admin/ui/DataTable";
import { IconEdit, IconTrash } from "@/components/shared/icons";
import { CategoryMobileCard } from "@/components/admin/categories/CategoryMobileCard";
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
    <>
      {/* Mobile Card Layout */}
      <div className="grid gap-3 w-full max-w-full overflow-hidden lg:hidden">
        {categories.map((category) => (
          <CategoryMobileCard
            key={category.id}
            category={category}
            count={counts[category.slug] ?? 0}
            busyKey={busyKey}
            onEdit={onEdit}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Desktop DataTable Layout */}
      <div className="hidden lg:block">
        <DataTable
          minWidth={640}
          headers={["الأيقونة", "الاسم", "slug", "الصنايعية", "نشط", "إجراءات"]}
        >
          {categories.map((category) => (
            <DataTableRow key={category.id}>
              <DataTableCell edge="start">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <CategoryIcon name={category.icon} className="h-6 w-6" />
                </div>
              </DataTableCell>
              <DataTableCell className="font-bold text-foreground">
                {category.name}
              </DataTableCell>
              <DataTableCell dir="ltr">{category.slug}</DataTableCell>
              <DataTableCell>{toArabicDigits(counts[category.slug] ?? 0)}</DataTableCell>
              <DataTableCell>
                <ToggleSwitch
                  checked={category.is_active}
                  onChange={() => onToggle(category)}
                  disabled={busyKey === `category-${category.id}`}
                  label={`إظهار/إخفاء ${category.name}`}
                />
              </DataTableCell>
              <DataTableCell edge="end">
                <div className="flex flex-wrap items-center gap-2">
                  <AdminButton
                    type="button"
                    variant="accentHover"
                    size="icon"
                    aria-label="تعديل"
                    onClick={() => onEdit(category)}
                  >
                    <IconEdit className="h-5 w-5" />
                  </AdminButton>
                  <AdminButton
                    type="button"
                    variant="dangerHover"
                    size="icon"
                    aria-label="حذف"
                    onClick={() => onDelete(category)}
                  >
                    <IconTrash className="h-5 w-5" />
                  </AdminButton>
                </div>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTable>
      </div>
    </>
  );
}