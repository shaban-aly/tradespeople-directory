"use client";

import { useEffect, useState } from "react";
import { IconX } from "@/components/shared/icons";
import { useBodyScrollLock } from "@/hooks/ui/useBodyScrollLock";

export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
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
    <div className={`fixed inset-0 z-[80] ${closing ? "pointer-events-none" : ""}`}>
      <button
        type="button"
        aria-label="إغلاق"
        onClick={handleClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-e border-border bg-card shadow-card transition-transform duration-300 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <h3 className="font-heading text-xl font-extrabold text-foreground">
            {title}
          </h3>
          <button
            type="button"
            aria-label="إغلاق"
            onClick={handleClose}
            className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:text-foreground"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  );
}
