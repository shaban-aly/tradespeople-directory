"use client";

import { useEffect, useState } from "react";
import { IconX } from "@/components/shared/icons";
import { useBodyScrollLock } from "@/hooks/ui/useBodyScrollLock";

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [closing, setClosing] = useState(false);
  useBodyScrollLock(open);

  function handleClose() {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      onClose();
    }, 300);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  if (!open) return null;

  const visible = !closing;

  return (
    <div className={`fixed inset-0 z-[90] ${closing ? "pointer-events-none" : ""}`}>
      <button
        type="button"
        aria-label="إغلاق"
        onClick={handleClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-3xl border-t border-border bg-card shadow-card transition-transform duration-300 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="shrink-0 border-b border-border px-5 pb-4 pt-3">
          <span aria-hidden className="mx-auto mb-3 block h-1.5 w-12 rounded-full bg-border" />
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-heading text-xl font-extrabold text-foreground">
              {title}
            </h2>
            <button
              type="button"
              aria-label="إغلاق"
              onClick={handleClose}
              className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:text-foreground"
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-border p-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
