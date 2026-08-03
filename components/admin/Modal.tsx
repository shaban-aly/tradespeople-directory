"use client";

import { useEffect } from "react";
import { IconX } from "@/components/shared/icons";

export function Modal({
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
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="font-heading text-xl font-extrabold text-foreground">
            {title}
          </h3>
          <button
            type="button"
            aria-label="إغلاق"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:text-foreground"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-4">{children}</div>
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
