"use client";

import { useEffect, useState } from "react";
import {
  IconEdit,
  IconPlus,
  IconRefresh,
  IconTags,
  IconTrash,
} from "@/components/shared/icons";
import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";
import { CategoryIconPicker } from "@/components/admin/CategoryIconPicker";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { EmptyState } from "@/components/admin/EmptyState";
import { Modal } from "@/components/admin/Modal";
import { PageHeader } from "@/components/admin/PageHeader";
import { ToggleSwitch } from "@/components/admin/ToggleSwitch";
import {
  CATEGORY_ICON_OPTIONS,
  type CategoryRow,
  useAdminDashboard,
} from "@/hooks/admin/useAdminDashboard";
import { useToast } from "@/hooks/ui/useToast";
import { toArabicDigits } from "@/lib/utils/format";
import { Field, fieldErrorId } from "@/components/shared/form/Field";
import { TextField } from "@/components/shared/form/TextField";
import {
  anyError,
  type CategoryFormErrors,
  FIELD_LIMITS,
  validateCategoryFields,
} from "@/lib/utils/validation";

const inputClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

export default function CategoriesPage() {
  const { toast } = useToast();
  const {
    categories,
    categoryCounts,
    loading,
    error,
    busyKey,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryActive,
    refresh,
  } = useAdminDashboard({ categories: true, counts: true });
  const [formTarget, setFormTarget] = useState<CategoryRow | "new" | null>(null);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<(typeof CATEGORY_ICON_OPTIONS)[number]>("plumbing");
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [touched, setTouched] = useState<Partial<Record<"name" | "slug", boolean>>>({});
  const [errors, setErrors] = useState<CategoryFormErrors>({});

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  if (loading) return <DashboardLoading />;

  function openForm(target: CategoryRow | "new") {
    setFormTarget(target);
    setErrors({});
    setTouched({});
    if (target === "new") {
      setSlug("");
      setName("");
      setIcon("plumbing");
    } else {
      setSlug(target.slug);
      setName(target.name);
      setIcon(target.icon as (typeof CATEGORY_ICON_OPTIONS)[number]);
    }
  }

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

    const payload = { slug: slug.trim(), name: name.trim(), icon };
    if (formTarget === "new") {
      const ok = await addCategory(payload);
      if (ok) {
        toast("success", "تمت إضافة التخصص");
        setFormTarget(null);
      }
    } else if (formTarget) {
      const ok = await updateCategory(formTarget.id, payload);
      if (ok) {
        toast("success", "تم حفظ تعديلات التخصص");
        setFormTarget(null);
      }
    }
  }

  async function handleToggle(category: CategoryRow) {
    const ok = await toggleCategoryActive(category);
    if (ok) {
      toast("success", category.is_active ? "تم إخفاء التخصص" : "تم إظهار التخصص");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    if ((categoryCounts[deleteTarget.slug] ?? 0) > 0) {
      toast(
        "error",
        `لا يمكن حذف تخصص عليه ${toArabicDigits(categoryCounts[deleteTarget.slug] ?? 0)} صنايعي`,
      );
      setDeleteTarget(null);
      return;
    }
    const ok = await deleteCategory(deleteTarget.id);
    if (ok) {
      toast("success", "تم حذف التخصص");
      setDeleteTarget(null);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="التصنيفات"
        description={`إدارة ${categories.length} تخصص معروض في الموقع.`}
        actions={
          <>
            <button
              type="button"
              onClick={() => void refresh()}
              className="flex min-h-12 items-center gap-2 rounded-xl border border-border px-4 text-base font-bold text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              <IconRefresh className="h-5 w-5" />
              تحديث
            </button>
            <button
              type="button"
              onClick={() => openForm("new")}
              className="flex min-h-12 items-center gap-2 rounded-xl bg-accent px-4 text-base font-bold text-on-accent transition-colors hover:bg-accent/90"
            >
              <IconPlus className="h-5 w-5" />
              إضافة تخصص
            </button>
          </>
        }
      />

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        {categories.length === 0 ? (
          <EmptyState
            icon={<IconTags className="h-8 w-8" />}
            title="لا توجد تصنيفات"
            description="أضف أول تخصص ليظهر في الصفحة الرئيسية."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-right">
              <thead>
                <tr className="border-b border-border text-base text-muted">
                  <th className="py-3 pr-2 font-bold">الأيقونة</th>
                  <th className="py-3 px-3 font-bold">الاسم</th>
                  <th className="py-3 px-3 font-bold">slug</th>
                  <th className="py-3 px-3 font-bold">الصنايعية</th>
                  <th className="py-3 px-3 font-bold">نشط</th>
                  <th className="py-3 pl-2 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-3 pr-2">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                        <CategoryIcon name={category.icon} className="h-6 w-6" />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-base font-bold text-foreground">
                      {category.name}
                    </td>
                    <td className="py-3 px-3 text-base text-muted" dir="ltr">
                      {category.slug}
                    </td>
                    <td className="py-3 px-3 text-base text-muted">
                      {toArabicDigits(categoryCounts[category.slug] ?? 0)}
                    </td>
                    <td className="py-3 px-3">
                      <ToggleSwitch
                        checked={category.is_active}
                        onChange={() => void handleToggle(category)}
                        disabled={busyKey === `category-${category.id}`}
                        label={`إظهار/إخفاء ${category.name}`}
                      />
                    </td>
                    <td className="py-3 pl-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          aria-label="تعديل"
                          onClick={() => openForm(category)}
                          className="rounded-xl border border-border p-3 text-muted transition-colors hover:border-accent hover:text-accent"
                        >
                          <IconEdit className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          aria-label="حذف"
                          onClick={() => setDeleteTarget(category)}
                          className="rounded-xl border border-border p-3 text-muted transition-colors hover:border-danger hover:text-danger"
                        >
                          <IconTrash className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={formTarget !== null}
        onClose={() => setFormTarget(null)}
        title={formTarget === "new" ? "إضافة تخصص" : "تعديل التخصص"}
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
                aria-describedby={getError("name") ? fieldErrorId("category-name") : undefined}
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
                aria-describedby={getError("slug") ? fieldErrorId("category-slug") : undefined}
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
            disabled={busyKey === "add-category" || busyKey.startsWith("update-category-")}
            className="min-h-12 rounded-xl bg-accent px-4 text-base font-bold text-on-accent transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {busyKey === "add-category" || busyKey.startsWith("update-category-")
              ? "جاري الحفظ..."
              : formTarget === "new"
                ? "إضافة التخصص"
                : "حفظ التعديلات"}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="حذف التخصص"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟`}
        confirmLabel="حذف التخصص"
        danger
        busy={busyKey === `delete-category-${deleteTarget?.id}`}
      />
    </div>
  );
}
