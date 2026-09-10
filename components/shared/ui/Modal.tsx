"use client";

import { useId, type ReactNode } from "react";
import { IconX } from "@/components/shared/icons";
import { useBodyScrollLock } from "@/hooks/ui/useBodyScrollLock";

// مودال موحّد: خلفية معتمة + قفل سكرول الجسم + إغلاق بـ Escape
// أو بالنقر خارجياً + هيدر بعنوان وإغلاق + جسم قابل للتمرير.
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  headerAction?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}

export function Modal({
  open,
  onClose,
  title,
  description,
  headerAction,
  children,
  footer,
  size = "md",
}: ModalProps) {
  const titleId = useId();
  useBodyScrollLock(open);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-80 flex items-center justify-center p-3 sm:p-4"
    >
      {/* خلفية */}
      <button
        type="button"
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
      />

      {/* بطاقة المودال */}
      <div
        className={`relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card ${
          size === "lg" ? "max-w-2xl" : "max-w-lg"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border p-5 sm:p-6">
          <div className="min-w-0">
            <h3
              id={titleId}
              className="font-heading text-xl font-bold text-foreground sm:text-2xl"
            >
              {title}
            </h3>
            {description && (
              <div className="mt-0.5 text-xs sm:text-sm text-muted">
                {description}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerAction}
            <button
              type="button"
              aria-label="إغلاق"
              onClick={onClose}
              className="rounded-xl p-2 text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-border p-5 sm:p-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}