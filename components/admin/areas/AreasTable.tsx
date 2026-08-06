import { ToggleSwitch } from "@/components/admin/ToggleSwitch";
import { IconEdit, IconTrash } from "@/components/shared/icons";
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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-right">
        <thead>
          <tr className="border-b border-border text-base text-muted">
            <th className="py-3 pr-2 font-bold">المنطقة</th>
            <th className="py-3 px-3 font-bold">الصنايعية</th>
            <th className="py-3 px-3 font-bold">نشطة</th>
            <th className="py-3 pl-2 font-bold">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {areas.map((area) => (
            <tr key={area.id} className="border-b border-border last:border-0">
              <td className="py-3 pr-2 text-base font-bold text-foreground">
                {area.name}
              </td>
              <td className="py-3 px-3 text-base text-muted">
                {toArabicDigits(counts[area.name] ?? 0)}
              </td>
              <td className="py-3 px-3">
                <ToggleSwitch
                  checked={area.is_active}
                  onChange={() => onToggle(area)}
                  disabled={busyKey === `area-${area.id}`}
                  label={`إظهار/إخفاء ${area.name}`}
                />
              </td>
              <td className="py-3 pl-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    aria-label="تعديل"
                    onClick={() => onEdit(area)}
                    className="rounded-xl border border-border p-3 text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    <IconEdit className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="حذف"
                    onClick={() => onDelete(area)}
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
