"use client";

import { Modal } from "./Modal";
import { AdminButton } from "@/components/admin/ui/AdminButton";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "تأكيد",
  danger = false,
  busy = false,
  note,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  /** حقل ملاحظة اختياري (مثل سبب الإخفاء) — يُعرض فوق زرّي التأكيد. */
  note?: {
    label: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    maxLength?: number;
  };
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <AdminButton
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={busy}
          >
            إلغاء
          </AdminButton>
          <AdminButton
            type="button"
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "جاري..." : confirmLabel}
          </AdminButton>
        </>
      }
    >
      <p className="text-base text-muted">{message}</p>
      {note && (
        <div className="mt-4">
          <label className="mb-1 block text-sm font-bold text-foreground">
            {note.label}
          </label>
          <textarea
            value={note.value}
            onChange={(event) => note.onChange(event.target.value)}
            maxLength={note.maxLength ?? 500}
            placeholder={note.placeholder}
            rows={2}
            disabled={busy}
            className="w-full rounded-xl border border-border-strong bg-card px-3 py-2.5 text-base text-foreground focus:border-accent focus:outline-none"
          />
        </div>
      )}
    </Modal>
  );
}
