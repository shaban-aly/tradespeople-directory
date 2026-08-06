"use client";

import { useState } from "react";
import { Modal } from "@/components/admin/Modal";
import { Field, fieldErrorId } from "@/components/shared/form/Field";
import { TextField } from "@/components/shared/form/TextField";
import type { AreaRow } from "@/lib/db/admin";
import { FIELD_LIMITS, validateName } from "@/lib/utils/validation";

const inputClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

export function AreaFormModal({
  target,
  open,
  busy,
  onClose,
  onSubmit,
}: {
  target: AreaRow | "new" | null;
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<boolean>;
}) {
  const [name, setName] = useState(
    target === "new" || !target ? "" : target.name,
  );
  const [touched, setTouched] = useState(false);
  const [nameError, setNameError] = useState("");

  function getError() {
    return touched ? nameError : "";
  }

  function handleChange(value: string) {
    setName(value);
    if (touched) setNameError(validateName(value) ?? "");
  }

  function handleBlur() {
    setTouched(true);
    setNameError(validateName(name) ?? "");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextName = name.trim();
    const nextError = validateName(nextName) ?? "";
    setTouched(true);
    setNameError(nextError);
    if (nextError) return;
    await onSubmit(nextName);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={target === "new" ? "إضافة منطقة" : "تعديل المنطقة"}
    >
      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        <Field label="اسم المنطقة" htmlFor="area-name" required error={getError()}>
          <TextField
            id="area-name"
            required
            maxLength={FIELD_LIMITS.nameMax}
            value={name}
            invalid={Boolean(getError())}
            aria-describedby={getError() ? fieldErrorId("area-name") : undefined}
            onChange={(event) => handleChange(event.target.value)}
            onBlur={handleBlur}
            placeholder="مثال: الأربعين"
            className={inputClass}
          />
        </Field>
        <button
          type="submit"
          disabled={busy}
          className="min-h-12 rounded-xl bg-accent px-4 text-base font-bold text-on-accent transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {busy ? "جاري الحفظ..." : target === "new" ? "إضافة المنطقة" : "حفظ التعديلات"}
        </button>
      </form>
    </Modal>
  );
}
