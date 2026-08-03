"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconEdit,
  IconExternalLink,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUsers,
} from "@/components/shared/icons";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { CraftsmanForm } from "@/components/admin/CraftsmanForm";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { EmptyState } from "@/components/admin/EmptyState";
import { Modal } from "@/components/admin/Modal";
import { PageHeader } from "@/components/admin/PageHeader";
import { Pagination } from "@/components/admin/Pagination";
import { SearchInput } from "@/components/admin/SearchInput";
import { ToggleSwitch } from "@/components/admin/ToggleSwitch";
import {
  type CraftsmanInput,
  type CraftsmanRow,
  useAdminDashboard,
} from "@/hooks/admin/useAdminDashboard";
import { useToast } from "@/hooks/ui/useToast";
import { toArabicDigits } from "@/lib/utils/format";

const PAGE_SIZE = 8;

const selectClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-base text-foreground focus:border-accent focus:outline-none";

export default function CraftsmenPage() {
  const { toast } = useToast();
  const {
    categories,
    areas,
    craftsmen,
    loading,
    error,
    busyKey,
    toggleCraftsmanVerified,
    toggleCraftsmanPublished,
    createCraftsman,
    updateCraftsman,
    deleteCraftsman,
    refresh,
  } = useAdminDashboard({ categories: true, areas: true, craftsmen: true });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [publishedFilter, setPublishedFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [formTarget, setFormTarget] = useState<CraftsmanRow | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<CraftsmanRow | null>(null);

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return craftsmen.filter((craftsman) => {
      if (
        query &&
        !craftsman.name.toLowerCase().includes(query) &&
        !craftsman.phone.toLowerCase().includes(query)
      ) {
        return false;
      }
      if (categoryFilter !== "all" && craftsman.category?.slug !== categoryFilter) {
        return false;
      }
      if (
        publishedFilter !== "all" &&
        craftsman.is_published !== (publishedFilter === "published")
      ) {
        return false;
      }
      if (
        verifiedFilter !== "all" &&
        craftsman.verified !== (verifiedFilter === "verified")
      ) {
        return false;
      }
      return true;
    });
  }, [craftsmen, search, categoryFilter, publishedFilter, verifiedFilter]);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => setPage(1), 0);
    return () => window.clearTimeout(resetTimer);
  }, [search, categoryFilter, publishedFilter, verifiedFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (loading) return <DashboardLoading />;

  async function handleSubmit(payload: CraftsmanInput): Promise<boolean> {
    if (formTarget === "new") {
      const ok = await createCraftsman(payload);
      if (ok) {
        toast("success", "تمت إضافة الصنايعي");
        setFormTarget(null);
      }
      return ok;
    }
    if (formTarget) {
      const ok = await updateCraftsman(formTarget.id, payload);
      if (ok) {
        toast("success", "تم حفظ التعديلات");
        setFormTarget(null);
      }
      return ok;
    }
    return false;
  }

  async function handleToggleVerified(craftsman: CraftsmanRow) {
    const ok = await toggleCraftsmanVerified(craftsman);
    if (ok) {
      toast("success", craftsman.verified ? "تم إلغاء التوثيق" : "تم توثيق الصنايعي");
    }
  }

  async function handleTogglePublished(craftsman: CraftsmanRow) {
    const ok = await toggleCraftsmanPublished(craftsman);
    if (ok) {
      toast("success", craftsman.is_published ? "تم إخفاء الصنايعي" : "تم نشر الصنايعي");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const ok = await deleteCraftsman(deleteTarget.id);
    if (ok) {
      toast("success", "تم حذف الصنايعي");
      setDeleteTarget(null);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="الصنايعية"
        description={`إدارة ${craftsmen.length} صنايعي في الدليل.`}
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
              onClick={() => setFormTarget("new")}
              className="flex min-h-12 items-center gap-2 rounded-xl bg-accent px-4 text-base font-bold text-on-accent transition-colors hover:bg-accent/90"
            >
              <IconPlus className="h-5 w-5" />
              إضافة صنايعي
            </button>
          </>
        }
      />

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="grid gap-3 lg:grid-cols-[1fr_repeat(3,minmax(10rem,1fr))]">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="ابحث بالاسم أو الهاتف..."
          />
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className={selectClass}
          >
            <option value="all">كل التخصصات</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={publishedFilter}
            onChange={(event) => setPublishedFilter(event.target.value)}
            className={selectClass}
          >
            <option value="all">منشور / مخفي</option>
            <option value="published">منشور فقط</option>
            <option value="hidden">مخفي فقط</option>
          </select>
          <select
            value={verifiedFilter}
            onChange={(event) => setVerifiedFilter(event.target.value)}
            className={selectClass}
          >
            <option value="all">موثّق / غير موثق</option>
            <option value="verified">موثّق فقط</option>
            <option value="unverified">غير موثق فقط</option>
          </select>
        </div>

        {pageItems.length === 0 ? (
          <EmptyState
            icon={<IconUsers className="h-8 w-8" />}
            title="لا توجد نتائج"
            description="جرّب تغيير البحث أو الفلاتر، أو أضف صنايعي جديد."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-right">
                <thead>
                  <tr className="border-b border-border text-base text-muted">
                    <th className="py-3 pr-2 font-bold">الصنايعي</th>
                    <th className="py-3 px-3 font-bold">التخصص</th>
                    <th className="py-3 px-3 font-bold">المنطقة</th>
                    <th className="py-3 px-3 font-bold">الهاتف</th>
                    <th className="py-3 px-3 font-bold">التفاعل</th>
                    <th className="py-3 px-3 font-bold">موثّق</th>
                    <th className="py-3 px-3 font-bold">منشور</th>
                    <th className="py-3 pl-2 font-bold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((craftsman) => (
                    <tr
                      key={craftsman.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="py-3 pr-2">
                        <div className="flex min-w-0 items-center gap-3">
                          {craftsman.image_url ? (
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
                              <Image
                                src={craftsman.image_url}
                                alt={craftsman.name}
                                fill
                                sizes="44px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                              <IconUsers className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-base font-bold text-foreground">
                              {craftsman.name}
                            </p>
                            <p className="truncate text-sm text-muted" dir="ltr">
                              {craftsman.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-base text-muted">
                        {craftsman.category?.name}
                      </td>
                      <td className="py-3 px-3 text-base text-muted">
                        {craftsman.area?.name}
                      </td>
                      <td className="py-3 px-3 text-base text-muted" dir="ltr">
                        {craftsman.phone}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                          <span title="ضغطات الاتصال">
                            اتصال {toArabicDigits(craftsman.stats?.calls ?? 0)}
                          </span>
                          <span className="text-border">·</span>
                          <span title="ضغطات الواتساب">
                            واتساب {toArabicDigits(craftsman.stats?.whatsapp ?? 0)}
                          </span>
                          <span className="text-border">·</span>
                          <span title="مشاهدات الصفحة">
                            مشاهدة {toArabicDigits(craftsman.stats?.views ?? 0)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <ToggleSwitch
                          checked={craftsman.verified}
                          onChange={() => void handleToggleVerified(craftsman)}
                          disabled={busyKey === `craftsman-verified-${craftsman.id}`}
                          label={`توثيق ${craftsman.name}`}
                        />
                      </td>
                      <td className="py-3 px-3">
                        <ToggleSwitch
                          checked={craftsman.is_published}
                          onChange={() => void handleTogglePublished(craftsman)}
                          disabled={busyKey === `craftsman-published-${craftsman.id}`}
                          label={`نشر ${craftsman.name}`}
                        />
                      </td>
                      <td className="py-3 pl-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/craftsman/${craftsman.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="عرض في الدليل"
                            className="rounded-xl border border-border p-3 text-muted transition-colors hover:border-accent hover:text-accent"
                          >
                            <IconExternalLink className="h-5 w-5" />
                          </Link>
                          <button
                            type="button"
                            aria-label="تعديل"
                            onClick={() => setFormTarget(craftsman)}
                            className="rounded-xl border border-border p-3 text-muted transition-colors hover:border-accent hover:text-accent"
                          >
                            <IconEdit className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            aria-label="حذف"
                            onClick={() => setDeleteTarget(craftsman)}
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
            <Pagination
              page={safePage}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      <Modal
        open={formTarget !== null}
        onClose={() => setFormTarget(null)}
        title={formTarget === "new" ? "إضافة صنايعي" : "تعديل بيانات الصنايعي"}
      >
        <CraftsmanForm
          categories={categories}
          areas={areas}
          initial={formTarget === "new" ? null : formTarget}
          busy={busyKey === "create-craftsman" || busyKey.startsWith("update-craftsman-")}
          onSubmit={handleSubmit}
        />
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="حذف الصنايعي"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}" نهائياً؟ ستُحذف روابط السوشيال وصورة الصنايعي أيضاً.`}
        confirmLabel="حذف نهائي"
        danger
        busy={busyKey === `delete-craftsman-${deleteTarget?.id}`}
      />
    </div>
  );
}
