"use client";

import { useState } from "react";
import { CategoryIconPicker } from "@/components/admin/CategoryIconPicker";
import { Modal } from "@/components/admin/Modal";
import { Field, fieldErrorId } from "@/components/shared/form/Field";
import { TextField } from "@/components/shared/form/TextField";
import {
  CATEGORY_ICON_OPTIONS,
  type CategoryRow,
} from "@/lib/db/admin";
import {
  anyError,
  type CategoryFormErrors,
  FIELD_LIMITS,
  validateCategoryFields,
} from "@/lib/utils/validation";

const inputClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

export type CategoryFormValues = {
  slug: string;
  name: string;
  icon: (typeof CATEGORY_ICON_OPTIONS)[number];
};

export function CategoryFormModal({
  target,
  open,
  busy,
  onClose,
  onSubmit,
}: {
  target: CategoryRow | "new" | null;
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (payload: CategoryFormValues) => Promise<boolean>;
}) {
  const [slug, setSlug] = useState(
    target === "new" || !target ? "" : target.slug,
  );
  const [name, setName] = useState(
    target === "new" || !target ? "" : target.name,
  );
  const [icon, setIcon] = useState<(typeof CATEGORY_ICON_OPTIONS)[number]>(
    target === "new" || !target
      ? "plumbing"
      : (target.icon as (typeof CATEGORY_ICON_OPTIONS)[number]),
  );
  const [touched, setTouched] = useState<
    Partial<Record<"name" | "slug", boolean>>
  >({});
  const [errors, setErrors] = useState<CategoryFormErrors>({});

  function getError(field: "name" | "slug"): string | undefined {
    return touched[field] ? errors[field] : undefined;
  }

  function handleChange(field: "name" | "slug", value: string) {
    if (field === "name") setName(value);
    else setSlug(value);
    if (touched[field]) {
      const single = validateCategoryFields({
        name: field === "name" ? value : name,
        slug: field === "slug" ? value : slug,
      });
      setErrors((prev) => ({ ...prev, [field]: single[field] }));
    }
  }

  function handleBlur(field: "name" | "slug") {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const single = validateCategoryFields({ name, slug });
    setErrors((prev) => ({ ...prev, [field]: single[field] }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateCategoryFields({ name: name.trim(), slug: slug.trim() });
    setErrors(nextErrors);
    setTouched({ name: true, slug: true });
    if (anyError(nextErrors)) return;
    await onSubmit({ slug: slug.trim(), name: name.trim(), icon });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={target === "new" ? "إضافة تخصص" : "تعديل التخصص"}
    >
      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="الاسم"
            htmlFor="category-name"
            required
            error={getError("name")}
          >
            <TextField
              id="category-name"
              required
              maxLength={FIELD_LIMITS.nameMax}
              value={name}
              invalid={Boolean(getError("name"))}
              aria-describedby={
                getError("name") ? fieldErrorId("category-name") : undefined
              }
              onChange={(event) => handleChange("name", event.target.value)}
              onBlur={() => handleBlur("name")}
              placeholder="مثال: سباكة"
              className={inputClass}
            />
          </Field>
          <Field
            label="slug"
            htmlFor="category-slug"
            required
            error={getError("slug")}
          >
            <TextField
              id="category-slug"
              required
              dir="ltr"
              maxLength={FIELD_LIMITS.slugMax}
              value={slug}
              invalid={Boolean(getError("slug"))}
              aria-describedby={
                getError("slug") ? fieldErrorId("category-slug") : undefined
              }
              onChange={(event) => handleChange("slug", event.target.value)}
              onBlur={() => handleBlur("slug")}
              placeholder="plumbing"
              className={inputClass}
            />
          </Field>
        </div>
        <label className="grid gap-1">
          <span className="text-base font-bold text-foreground">الأيقونة</span>
          <CategoryIconPicker value={icon} onChange={setIcon} />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="min-h-12 rounded-xl bg-accent px-4 text-base font-bold text-on-accent transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {busy ? "جاري الحفظ..." : target === "new" ? "إضافة التخصص" : "حفظ التعديلات"}
        </button>
      </form>
    </Modal>
  );
}
