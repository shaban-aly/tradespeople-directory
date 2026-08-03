"use client";

import { Modal } from "./Modal";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "تأكيد",
  danger = false,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="min-h-12 rounded-xl border border-border px-4 text-base font-bold text-muted transition-colors hover:text-foreground"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`min-h-12 rounded-xl px-4 text-base font-bold text-on-accent transition-colors ${
              danger
                ? "bg-danger hover:bg-danger/90"
                : "bg-accent hover:bg-accent/90"
            } disabled:opacity-50`}
          >
            {busy ? "جاري..." : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-base text-muted">{message}</p>
    </Modal>
  );
}
