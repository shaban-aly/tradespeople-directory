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
    </Modal>
  );
}
