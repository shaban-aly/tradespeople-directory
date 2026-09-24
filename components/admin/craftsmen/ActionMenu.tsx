"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  IconEdit,
  IconExternalLink,
  IconLink,
  IconMoreVertical,
  IconTrash,
} from "@/components/shared/icons";
import type { CraftsmanRow } from "@/lib/db/admin";

const MENU_WIDTH = 208;
const MENU_GAP = 6;

export type ActionMenuProps = {
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

export function ActionMenu({
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
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // افتح لأعلى إذا كانت المساحة بالأسفل غير كافية والمساحة بالأعلى أكبر
    const openUp = spaceBelow < 280 && spaceAbove > spaceBelow;

    const maxHeight = Math.min(
      320,
      Math.max(160, openUp ? spaceAbove - MENU_GAP * 2 : spaceBelow - MENU_GAP * 2)
    );

    const top = openUp
      ? Math.max(8, rect.top - maxHeight - MENU_GAP)
      : rect.bottom + MENU_GAP;

    const fitsLeft = rect.right >= MENU_WIDTH + MENU_GAP;
    const rawLeft = fitsLeft ? rect.right - MENU_WIDTH : rect.left;
    const left = Math.max(
      MENU_GAP,
      Math.min(rawLeft, viewportWidth - MENU_WIDTH - MENU_GAP)
    );

    setPosition({ top, left, maxHeight });
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
            className="fixed z-[100] w-52 rounded-xl border border-border bg-popover p-1.5 shadow-card overflow-y-auto"
            style={{
              top: position.top,
              left: position.left,
              maxHeight: position.maxHeight,
            }}
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

            <button
              type="button"
              role="menuitem"
              onClick={closeAnd(() => onView(craftsman.slug))}
              className={menuRowClass}
            >
              <IconExternalLink className="h-5 w-5 shrink-0" />
              معاينة الصفحة
            </button>

            {onLinkAccount && (
              <button
                type="button"
                role="menuitem"
                onClick={closeAnd(() => onLinkAccount(craftsman))}
                className={menuRowClass}
              >
                <IconLink className="h-5 w-5 shrink-0" />
                ربط حساب فني
              </button>
            )}

            <div className="my-1 border-t border-border" />

            <button
              type="button"
              role="menuitem"
              disabled={verifiedBusy}
              onClick={closeAnd(() => onToggleVerified(craftsman))}
              className={`${menuRowClass} disabled:opacity-50`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  craftsman.verified ? "bg-action" : "bg-muted"
                }`}
              />
              {craftsman.verified ? "إلغاء التوثيق" : "توثيق"}
            </button>

            <button
              type="button"
              role="menuitem"
              disabled={publishedBusy}
              onClick={closeAnd(() => onTogglePublished(craftsman))}
              className={`${menuRowClass} disabled:opacity-50`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  craftsman.is_published ? "bg-action" : "bg-muted"
                }`}
              />
              {craftsman.is_published ? "إخفاء" : "نشر"}
            </button>

            <div className="my-1 border-t border-border" />

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
