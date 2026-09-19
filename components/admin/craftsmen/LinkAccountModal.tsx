"use client";

import { useState } from "react";
import { Modal } from "@/components/admin/Modal";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { linkCraftsmanAccount, type CraftsmanRow } from "@/lib/db/admin";
import { validateEmail } from "@/lib/utils/validation";

interface LinkAccountModalProps {
  craftsman: CraftsmanRow | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LinkAccountModal({
  craftsman,
  isOpen,
  onClose,
  onSuccess,
}: LinkAccountModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!craftsman) return null;

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    if (!craftsman) return;

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await linkCraftsmanAccount(craftsman.id, email);
      setSuccessMsg(`تم ربط الصنايعي (${craftsman.name}) بالحساب (${email}) بنجاح!`);
      setTimeout(() => {
        onSuccess();
        onClose();
        setEmail("");
        setSuccessMsg(null);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل ربط الحساب");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`ربط الصنايعي: ${craftsman.name}`}
    >
      <form onSubmit={handleLink} className="flex flex-col gap-4">
        <p className="text-sm text-muted leading-relaxed">
          أدخل البريد الإلكتروني الذي سجّل به الفني دخوله في الموقع (عبر Google)، ليتم تحويل حسابه لدور <strong className="text-foreground font-semibold">فني</strong> وتفعيل لوحة تحكمه الخاصة.
        </p>

        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl border border-action/30 bg-action/10 p-3 text-sm text-action">
            {successMsg}
          </div>
        )}

        <div>
          <label htmlFor="craftsman-link-email" className="mb-1.5 block text-sm font-bold text-foreground">
            البريد الإلكتروني لحساب الفني *
          </label>
          <input
            id="craftsman-link-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            className="min-h-12 w-full rounded-xl border border-border-strong bg-background px-4 py-3 text-base text-foreground focus:outline-none"
            dir="ltr"
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <AdminButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            إلغاء
          </AdminButton>
          <AdminButton
            type="submit"
            variant="action"
            size="sm"
            disabled={loading}
          >
            {loading ? "جاري الربط..." : "ربط الحساب الآن"}
          </AdminButton>
        </div>
      </form>
    </Modal>
  );
}
