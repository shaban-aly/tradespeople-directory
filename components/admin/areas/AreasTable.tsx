import { ToggleSwitch } from "@/components/admin/ToggleSwitch";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import {
  DataTable,
  DataTableCell,
  DataTableRow,
} from "@/components/admin/ui/DataTable";
import { IconEdit, IconTrash } from "@/components/shared/icons";
import { AreaMobileCard } from "@/components/admin/areas/AreaMobileCard";
import type { AreaRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";

export function AreasTable({
  areas,
  counts,
  busyKey,
  onEdit,
  onToggle,
  onDelete,
}: {
  areas: AreaRow[];
  counts: Record<string, number>;
  busyKey: string;
  onEdit: (area: AreaRow) => void;
  onToggle: (area: AreaRow) => void;
  onDelete: (area: AreaRow) => void;
}) {
  return (
    <>
      {/* Mobile Card Layout */}
      <div className="grid gap-3 w-full max-w-full overflow-hidden lg:hidden">
        {areas.map((area) => (
          <AreaMobileCard
            key={area.id}
            area={area}
            count={counts[area.name] ?? 0}
            busyKey={busyKey}
            onEdit={onEdit}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Desktop DataTable Layout */}
      <div className="hidden lg:block">
        <DataTable minWidth={560} headers={["المنطقة", "الصنايعية", "نشطة", "إجراءات"]}>
          {areas.map((area) => (
            <DataTableRow key={area.id}>
              <DataTableCell edge="start" className="font-bold text-foreground">
                {area.name}
              </DataTableCell>
              <DataTableCell>{toArabicDigits(counts[area.name] ?? 0)}</DataTableCell>
              <DataTableCell>
                <ToggleSwitch
                  checked={area.is_active}
                  onChange={() => onToggle(area)}
                  disabled={busyKey === `area-${area.id}`}
                  label={`إظهار/إخفاء ${area.name}`}
                />
              </DataTableCell>
              <DataTableCell edge="end">
                <div className="flex flex-wrap items-center gap-2">
                  <AdminButton
                    type="button"
                    variant="accentHover"
                    size="icon"
                    aria-label="تعديل"
                    onClick={() => onEdit(area)}
                  >
                    <IconEdit className="h-5 w-5" />
                  </AdminButton>
                  <AdminButton
                    type="button"
                    variant="dangerHover"
                    size="icon"
                    aria-label="حذف"
                    onClick={() => onDelete(area)}
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