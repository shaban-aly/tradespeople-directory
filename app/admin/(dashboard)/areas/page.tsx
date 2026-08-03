"use client";

import { useEffect, useState } from "react";
import {
  IconEdit,
  IconPin,
  IconPlus,
  IconRefresh,
  IconTrash,
} from "@/components/shared/icons";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { EmptyState } from "@/components/admin/EmptyState";
import { Modal } from "@/components/admin/Modal";
import { PageHeader } from "@/components/admin/PageHeader";
import { ToggleSwitch } from "@/components/admin/ToggleSwitch";
import { type AreaRow, useAdminDashboard } from "@/hooks/admin/useAdminDashboard";
import { useToast } from "@/hooks/ui/useToast";
import { toArabicDigits } from "@/lib/utils/format";
import { Field, fieldErrorId } from "@/components/shared/form/Field";
import { TextField } from "@/components/shared/form/TextField";
import { FIELD_LIMITS, validateName } from "@/lib/utils/validation";

const inputClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

export default function AreasPage() {
  const { toast } = useToast();
  const {
    areas,
    areaCounts,
    loading,
    error,
    busyKey,
    addArea,
    updateArea,
    deleteArea,
    toggleAreaActive,
    refresh,
  } = useAdminDashboard({ areas: true, counts: true });
  const [formTarget, setFormTarget] = useState<AreaRow | "new" | null>(null);
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AreaRow | null>(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  if (loading) return <DashboardLoading />;

  function openForm(target: AreaRow | "new") {
    setFormTarget(target);
    setName(target === "new" ? "" : target.name);
    setNameTouched(false);
    setNameError("");
  }

  function getError() {
    return nameTouched ? nameError : "";
  }

  function handleChange(value: string) {
    setName(value);
    if (nameTouched) setNameError(validateName(value) ?? "");
  }

  function handleBlur() {
    setNameTouched(true);
    setNameError(validateName(name) ?? "");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextName = name.trim();
    const nextError = validateName(nextName) ?? "";
    setNameTouched(true);
    setNameError(nextError);
    if (nextError) return;

    if (formTarget === "new") {
      const ok = await addArea(nextName);
      if (ok) {
        toast("success", "تمت إضافة المنطقة");
        setFormTarget(null);
      }
    } else if (formTarget) {
      const ok = await updateArea(formTarget.id, nextName);
      if (ok) {
        toast("success", "تم حفظ تعديلات المنطقة");
        setFormTarget(null);
      }
    }
  }

  async function handleToggle(area: AreaRow) {
    const ok = await toggleAreaActive(area);
    if (ok) {
      toast("success", area.is_active ? "تم إخفاء المنطقة" : "تم إظهار المنطقة");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const count = areaCounts[deleteTarget.name] ?? 0;
    if (count > 0) {
      toast(
        "error",
        `لا يمكن حذف منطقة عليها ${toArabicDigits(count)} صنايعي`,
      );
      setDeleteTarget(null);
      return;
    }
    const ok = await deleteArea(deleteTarget.id);
    if (ok) {
      toast("success", "تم حذف المنطقة");
      setDeleteTarget(null);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="المناطق"
        description={`إدارة ${areas.length} منطقة في السويس.`}
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
              إضافة منطقة
            </button>
          </>
        }
      />

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        {areas.length === 0 ? (
          <EmptyState
            icon={<IconPin className="h-8 w-8" />}
            title="لا توجد مناطق"
            description="أضف أول منطقة ليتمكن الصنايعية من اختيارها."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-right">
              <thead>
                <tr className="border-b border-border text-base text-muted">
                  <th className="py-3 pr-2 font-bold">المنطقة</th>
                  <th className="py-3 px-3 font-bold">الصنايعية</th>
                  <th className="py-3 px-3 font-bold">نشطة</th>
                  <th className="py-3 pl-2 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((area) => (
                  <tr
                    key={area.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-3 pr-2 text-base font-bold text-foreground">
                      {area.name}
                    </td>
                    <td className="py-3 px-3 text-base text-muted">
                      {toArabicDigits(areaCounts[area.name] ?? 0)}
                    </td>
                    <td className="py-3 px-3">
                      <ToggleSwitch
                        checked={area.is_active}
                        onChange={() => void handleToggle(area)}
                        disabled={busyKey === `area-${area.id}`}
                        label={`إظهار/إخفاء ${area.name}`}
                      />
                    </td>
                    <td className="py-3 pl-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          aria-label="تعديل"
                          onClick={() => openForm(area)}
                          className="rounded-xl border border-border p-3 text-muted transition-colors hover:border-accent hover:text-accent"
                        >
                          <IconEdit className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          aria-label="حذف"
                          onClick={() => setDeleteTarget(area)}
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
        title={formTarget === "new" ? "إضافة منطقة" : "تعديل المنطقة"}
      >
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <Field
            label="اسم المنطقة"
            htmlFor="area-name"
            required
            error={getError()}
          >
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
            disabled={busyKey === "add-area" || busyKey.startsWith("update-area-")}
            className="min-h-12 rounded-xl bg-accent px-4 text-base font-bold text-on-accent transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {busyKey === "add-area" || busyKey.startsWith("update-area-")
              ? "جاري الحفظ..."
              : formTarget === "new"
                ? "إضافة المنطقة"
                : "حفظ التعديلات"}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="حذف المنطقة"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟`}
        confirmLabel="حذف المنطقة"
        danger
        busy={busyKey === `delete-area-${deleteTarget?.id}`}
      />
    </div>
  );
}
