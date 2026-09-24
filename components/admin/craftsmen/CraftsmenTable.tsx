import { ToggleSwitch } from "@/components/admin/ToggleSwitch";
import {
  DataTable,
  DataTableCell,
  DataTableRow,
} from "@/components/admin/ui/DataTable";
import {
  IconPhone,
  IconPin,
  IconUsers,
} from "@/components/shared/icons";
import { VerifiedBadge } from "@/components/shared/ui/VerifiedBadge";
import { ActionMenu, type ActionMenuProps } from "@/components/admin/craftsmen/ActionMenu";
import { CraftsmanMobileCard } from "@/components/admin/craftsmen/CraftsmanMobileCard";
import type { CraftsmanRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";

export function CraftsmenTable({
  craftsmen,
  busyKey,
  onToggleVerified,
  onTogglePublished,
  onEdit,
  onDelete,
  onView,
  onLinkAccount,
}: Omit<ActionMenuProps, "craftsman"> & { craftsmen: CraftsmanRow[] }) {
  const actionProps = {
    busyKey,
    onToggleVerified,
    onTogglePublished,
    onEdit,
    onDelete,
    onView,
    onLinkAccount,
  };

  return (
    <>
      {/* عرض الكروت المخصص للشاشات الصغيرة والموبايل */}
      <div className="grid gap-3 w-full max-w-full overflow-hidden lg:hidden">
        {craftsmen.map((craftsman) => (
          <CraftsmanMobileCard
            key={craftsman.id}
            craftsman={craftsman}
            {...actionProps}
          />
        ))}
      </div>

      {/* عرض الجدول المخصص للديسكتوب */}
      <div className="hidden lg:block">
        <DataTable
          minWidth={860}
          headers={["الصنايعي", "التخصص", "المنطقة", "الهاتف", "التفاعل", "إجراءات"]}
        >
          {craftsmen.map((craftsman) => {
            const verifiedBusy = busyKey === `craftsman-verified-${craftsman.id}`;
            const publishedBusy = busyKey === `craftsman-published-${craftsman.id}`;

            return (
              <DataTableRow key={craftsman.id}>
                {/* 1. الصنايعي */}
                <DataTableCell edge="start">
                  <div className="flex items-center gap-3">
                    {craftsman.image_url ? (
                      <img
                        src={craftsman.image_url}
                        alt={craftsman.name}
                        className="h-10 w-10 shrink-0 rounded-xl border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                        <IconUsers className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-base font-bold text-foreground">
                          {craftsman.name}
                        </p>
                        {craftsman.verified && <VerifiedBadge />}
                      </div>
                      <p className="truncate text-xs text-muted" dir="ltr">
                        {craftsman.slug}
                      </p>
                    </div>
                  </div>
                </DataTableCell>

                {/* 2. التخصص */}
                <DataTableCell>
                  {craftsman.category ? (
                    <span className="rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
                      {craftsman.category.name}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </DataTableCell>

                {/* 3. المنطقة */}
                <DataTableCell>
                  {craftsman.area ? (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                      <IconPin className="h-3.5 w-3.5 text-muted" />
                      {craftsman.area.name}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </DataTableCell>

                {/* 4. الهاتف */}
                <DataTableCell>
                  <span
                    dir="ltr"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-foreground"
                  >
                    <IconPhone className="h-3.5 w-3.5 text-accent" />
                    {craftsman.phone}
                  </span>
                </DataTableCell>

                {/* 5. التفاعل */}
                <DataTableCell>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span title="ضغطات الاتصال">
                      اتصال {toArabicDigits(craftsman.stats?.calls ?? 0)}
                    </span>
                    <span className="text-border">·</span>
                    <span title="ضغطات الواتساب">
                      واتساب {toArabicDigits(craftsman.stats?.whatsapp ?? 0)}
                    </span>
                    <span className="text-border">·</span>
                    <span title="مشاهدات الصفحة">
                      مشاهدة {toArabicDigits(craftsman.stats?.views ?? 0)}
                    </span>
                  </div>
                </DataTableCell>

                {/* 6. الإجراءات (توثيق + نشر + قائمة منبثقة) */}
                <DataTableCell edge="end">
                  <div className="flex items-center justify-end gap-2">
                    <ToggleSwitch
                      label="توثيق"
                      checked={craftsman.verified}
                      disabled={verifiedBusy}
                      onChange={() => onToggleVerified(craftsman)}
                    />
                    <ToggleSwitch
                      label="نشر"
                      checked={craftsman.is_published}
                      disabled={publishedBusy}
                      onChange={() => onTogglePublished(craftsman)}
                    />
                    <ActionMenu craftsman={craftsman} {...actionProps} />
                  </div>
                </DataTableCell>
              </DataTableRow>
            );
          })}
        </DataTable>
      </div>
    </>
  );
}