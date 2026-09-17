import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ToggleSwitch } from "@/components/admin/ToggleSwitch";
import {
  DataTable,
  DataTableCell,
  DataTableRow,
} from "@/components/admin/ui/DataTable";
import {
  IconEdit,
  IconExternalLink,
  IconLink,
  IconMoreVertical,
  IconTrash,
  IconUsers,
} from "@/components/shared/icons";
import type { CraftsmanRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";

const MENU_WIDTH = 208;
const MENU_GAP = 6;

type ActionMenuProps = {
  craftsman: CraftsmanRow;
  busyKey: string;
  onToggleVerified: (craftsman: CraftsmanRow) => void;
  onTogglePublished: (craftsman: CraftsmanRow) => void;
  onEdit: (craftsman: CraftsmanRow) => void;
  onDelete: (craftsman: CraftsmanRow) => void;
  onView: (slug: string) => void;
  onLinkAccount?: (craftsman: CraftsmanRow) => void;
};

const menuRowClass =
  "flex min-h-12 w-full items-center gap-2.5 rounded-lg px-3 text-base font-bold text-muted transition-colors hover:bg-background hover:text-foreground";

function ActionMenu({
  craftsman,
  busyKey,
  onToggleVerified,
  onTogglePublished,
  onEdit,
  onDelete,
  onView,
  onLinkAccount,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const fitsLeft = rect.right >= MENU_WIDTH + MENU_GAP;
    setPosition({
      top: rect.bottom + MENU_GAP,
      left: fitsLeft ? rect.right - MENU_WIDTH : rect.left,
    });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onReposition = () => setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open]);

  function closeAnd(run: () => void) {
    return () => {
      setOpen(false);
      run();
    };
  }

  const verifiedBusy = busyKey === `craftsman-verified-${craftsman.id}`;
  const publishedBusy = busyKey === `craftsman-published-${craftsman.id}`;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`إجراءات ${craftsman.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="rounded-lg border border-border p-2 text-muted transition-colors hover:bg-background hover:text-foreground"
      >
        <IconMoreVertical className="h-5 w-5" />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="إجراءات"
            className="fixed z-[100] w-52 rounded-xl border border-border bg-popover p-1.5 shadow-card"
            style={{ top: position.top, left: position.left }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={closeAnd(() => onEdit(craftsman))}
              className={menuRowClass}
            >
              <IconEdit className="h-5 w-5 shrink-0" />
              تعديل
            </button>

            {onLinkAccount && (
              <button
                type="button"
                role="menuitem"
                onClick={closeAnd(() => onLinkAccount(craftsman))}
                className={menuRowClass}
              >
                <IconLink className="h-5 w-5 shrink-0" />
                ربط الحساب
              </button>
            )}

            <button
              type="button"
              role="menuitem"
              onClick={closeAnd(() => onView(craftsman.slug))}
              className={menuRowClass}
            >
              <IconExternalLink className="h-5 w-5 shrink-0" />
              عرض في الدليل
            </button>

            <div className="my-1.5 border-t border-border" />

            <div
              role="menuitem"
              className={`${menuRowClass} justify-between gap-4`}
            >
              <span>موثّق</span>
              <ToggleSwitch
                checked={craftsman.verified}
                onChange={() => onToggleVerified(craftsman)}
                disabled={verifiedBusy}
                label={`توثيق ${craftsman.name}`}
              />
            </div>

            <div
              role="menuitem"
              className={`${menuRowClass} justify-between gap-4`}
            >
              <span>منشور</span>
              <ToggleSwitch
                checked={craftsman.is_published}
                onChange={() => onTogglePublished(craftsman)}
                disabled={publishedBusy}
                label={`نشر ${craftsman.name}`}
              />
            </div>

            <div className="my-1.5 border-t border-border" />

            <button
              type="button"
              role="menuitem"
              onClick={closeAnd(() => onDelete(craftsman))}
              className={`${menuRowClass} text-danger hover:bg-danger/10 hover:text-danger`}
            >
              <IconTrash className="h-5 w-5 shrink-0" />
              حذف
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

export function CraftsmenTable({
  craftsmen,
  busyKey,
  onToggleVerified,
  onTogglePublished,
  onEdit,
  onDelete,
  onView,
  onLinkAccount,
}: {
  craftsmen: CraftsmanRow[];
  busyKey: string;
  onToggleVerified: (craftsman: CraftsmanRow) => void;
  onTogglePublished: (craftsman: CraftsmanRow) => void;
  onEdit: (craftsman: CraftsmanRow) => void;
  onDelete: (craftsman: CraftsmanRow) => void;
  onView: (slug: string) => void;
  onLinkAccount?: (craftsman: CraftsmanRow) => void;
}) {
  return (
    <DataTable
      minWidth={860}
      headers={["الصنايعي", "التخصص", "المنطقة", "الهاتف", "التفاعل", "إجراءات"]}
    >
      {craftsmen.map((craftsman) => (
        <DataTableRow key={craftsman.id}>
          <DataTableCell edge="start">
            <div className="flex min-w-0 items-center gap-3">
              {craftsman.image_url ? (
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={craftsman.image_url}
                    alt={craftsman.name}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <IconUsers className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-foreground">
                  {craftsman.name}
                </p>
                <p className="truncate text-sm text-muted" dir="ltr">
                  {craftsman.slug}
                </p>
              </div>
            </div>
          </DataTableCell>
          <DataTableCell>{craftsman.category?.name}</DataTableCell>
          <DataTableCell>{craftsman.area?.name}</DataTableCell>
          <DataTableCell dir="ltr">{craftsman.phone}</DataTableCell>
          <DataTableCell>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
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
          <DataTableCell edge="end">
            <ActionMenu
              craftsman={craftsman}
              busyKey={busyKey}
              onToggleVerified={onToggleVerified}
              onTogglePublished={onTogglePublished}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              onLinkAccount={onLinkAccount}
            />
          </DataTableCell>
        </DataTableRow>
      ))}
    </DataTable>
  );
}