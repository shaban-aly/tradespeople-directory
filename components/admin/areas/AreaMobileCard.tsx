import { ToggleSwitch } from "@/components/admin/ToggleSwitch";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { IconEdit, IconPin, IconTrash } from "@/components/shared/icons";
import type { AreaRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";

export function AreaMobileCard({
  area,
  count,
  busyKey,
  onEdit,
  onToggle,
  onDelete,
}: {
  area: AreaRow;
  count: number;
  busyKey: string;
  onEdit: (area: AreaRow) => void;
  onToggle: (area: AreaRow) => void;
  onDelete: (area: AreaRow) => void;
}) {
  const isBusy = busyKey === `area-${area.id}`;

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-card w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <IconPin className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-foreground">
              {area.name}
            </p>
            <span
              className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                area.is_active
                  ? "bg-action/10 text-action"
                  : "bg-muted/20 text-muted"
              }`}
            >
              {area.is_active ? "نشطة" : "مخفية"}
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <ToggleSwitch
            checked={area.is_active}
            onChange={() => onToggle(area)}
            disabled={isBusy}
            label={`إظهار/إخفاء ${area.name}`}
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
            aria-label={`تعديل ${area.name}`}
            onClick={() => onEdit(area)}
          >
            <IconEdit className="h-4 w-4" />
          </AdminButton>
          <AdminButton
            type="button"
            variant="dangerHover"
            size="icon"
            aria-label={`حذف ${area.name}`}
            onClick={() => onDelete(area)}
          >
            <IconTrash className="h-4 w-4 text-red-500" />
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
