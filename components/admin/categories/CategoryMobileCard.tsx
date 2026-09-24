import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";
import { ToggleSwitch } from "@/components/admin/ToggleSwitch";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { IconEdit, IconTrash } from "@/components/shared/icons";
import type { CategoryRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";

export function CategoryMobileCard({
  category,
  count,
  busyKey,
  onEdit,
  onToggle,
  onDelete,
}: {
  category: CategoryRow;
  count: number;
  busyKey: string;
  onEdit: (category: CategoryRow) => void;
  onToggle: (category: CategoryRow) => void;
  onDelete: (category: CategoryRow) => void;
}) {
  const isBusy = busyKey === `category-${category.id}`;

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-card w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <CategoryIcon name={category.icon} className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-foreground">
              {category.name}
            </p>
            <p className="truncate text-xs text-muted" dir="ltr">
              {category.slug}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <ToggleSwitch
            checked={category.is_active}
            onChange={() => onToggle(category)}
            disabled={isBusy}
            label={`إظهار/إخفاء ${category.name}`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/70 pt-2.5 text-xs text-muted">
        <div className="flex items-center gap-1.5 font-medium">
          <span>عدد الصنايعية:</span>
          <span className="font-bold text-foreground">
            {toArabicDigits(count)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <AdminButton
            type="button"
            variant="accentHover"
            size="icon"
            aria-label={`تعديل ${category.name}`}
            onClick={() => onEdit(category)}
          >
            <IconEdit className="h-4 w-4" />
          </AdminButton>
          <AdminButton
            type="button"
            variant="dangerHover"
            size="icon"
            aria-label={`حذف ${category.name}`}
            onClick={() => onDelete(category)}
          >
            <IconTrash className="h-4 w-4 text-red-500" />
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
