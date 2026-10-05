"use client";

import { Modal } from "@/components/shared/ui/Modal";
import { Button } from "@/components/shared/ui/Button";

/**
 * حوار تأكيد موحّد لواجهة الزائر — الطلبات المدمّرة (حذف/إلغاء) لا تُنفَّذ
 * على ضغطة زر واحدة، بل عبر هذه النافذة. النسخة المخصّصة للوحة المشرف في
 * `components/admin/ConfirmDialog.tsx` (بأنماط اللوحة الخاصة).
 */
export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  danger = false,
  busy = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "جاري..." : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-base text-foreground/90">{message}</p>
    </Modal>
  );
}