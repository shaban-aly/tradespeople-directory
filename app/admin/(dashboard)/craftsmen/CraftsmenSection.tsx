"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { CraftsmanForm } from "@/components/admin/CraftsmanForm";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { EmptyState } from "@/components/admin/EmptyState";
import { Modal } from "@/components/admin/Modal";
import { PageHeader } from "@/components/admin/PageHeader";
import { Pagination } from "@/components/admin/Pagination";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { CraftsmenFilters } from "@/components/admin/craftsmen/CraftsmenFilters";
import { CraftsmenTable } from "@/components/admin/craftsmen/CraftsmenTable";
import { LinkAccountModal } from "@/components/admin/craftsmen/LinkAccountModal";
import { IconPlus, IconUsers } from "@/components/shared/icons";
import {
  type CraftsmanInput,
  type CraftsmanRow,
} from "@/lib/db/admin";
import {
  filterCraftsmen,
  paginate,
  type CraftsmanFilter,
} from "@/lib/db/admin-selectors";
import { useAdminCraftsmen, type AdminCraftsmenData } from "@/hooks/admin/useAdminCraftsmen";
import { useToast } from "@/hooks/ui/useToast";

const PAGE_SIZE = 8;

export function CraftsmenSection({
  initialData,
  initialFilter,
  initialPagination,
}: {
  initialData: AdminCraftsmenData;
  initialFilter?: CraftsmanFilter;
  initialPagination?: {
    page: number;
    pageCount: number;
    totalCount: number;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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
  } = useAdminCraftsmen(initialData);

  const [filter, setFilter] = useState<CraftsmanFilter>(
    initialFilter ?? {
      search: "",
      category: "all",
      published: "all",
      verified: "all",
    },
  );
  const [page, setPage] = useState(initialPagination?.page ?? 1);
  const [formTarget, setFormTarget] = useState<CraftsmanRow | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<CraftsmanRow | null>(null);
  const [linkTarget, setLinkTarget] = useState<CraftsmanRow | null>(null);

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  useEffect(() => {
    if (initialFilter) {
      setFilter(initialFilter);
    }
  }, [initialFilter]);

  useEffect(() => {
    if (initialPagination?.page) {
      setPage(initialPagination.page);
    }
  }, [initialPagination?.page]);

  const isServerPaginated = Boolean(initialPagination);

  const updateQuery = useCallback(
    (newFilter: CraftsmanFilter, newPage: number) => {
      const q = new URLSearchParams();
      if (newPage > 1) q.set("page", String(newPage));
      if (newFilter.search.trim()) q.set("search", newFilter.search.trim());
      if (newFilter.category !== "all") q.set("category", newFilter.category);
      if (newFilter.published !== "all") q.set("published", newFilter.published);
      if (newFilter.verified !== "all") q.set("verified", newFilter.verified);

      const qs = q.toString();
      const targetUrl = `/admin/craftsmen${qs ? `?${qs}` : ""}`;
      startTransition(() => {
        router.replace(targetUrl, { scroll: false });
      });
    },
    [router],
  );

  // تحديث الـ URL بعد توقف الكتابة في حقل البحث
  useEffect(() => {
    if (!isServerPaginated) return;
    const timer = setTimeout(() => {
      if (filter.search !== (initialFilter?.search ?? "")) {
        updateQuery(filter, 1);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [filter.search, initialFilter?.search, isServerPaginated, updateQuery, filter]);

  const handleFilterChange = (next: Partial<CraftsmanFilter>) => {
    const updated = { ...filter, ...next };
    setFilter(updated);
    setPage(1);
    if (!("search" in next) && isServerPaginated) {
      updateQuery(updated, 1);
    }
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    if (isServerPaginated) {
      updateQuery(filter, nextPage);
    }
  };

  // عند تفعيل التقسيم الخادمي، تكون craftsmen من السيرفر هي صفحة العرض مباشرة
  const pageItems = isServerPaginated
    ? craftsmen
    : paginate(filterCraftsmen(craftsmen, filter), page, PAGE_SIZE).pageItems;
  const pageCount = isServerPaginated
    ? (initialPagination?.pageCount ?? 1)
    : paginate(filterCraftsmen(craftsmen, filter), page, PAGE_SIZE).pageCount;
  const safePage = isServerPaginated
    ? page
    : paginate(filterCraftsmen(craftsmen, filter), page, PAGE_SIZE).page;
  const totalDisplayCount = isServerPaginated
    ? (initialPagination?.totalCount ?? craftsmen.length)
    : filterCraftsmen(craftsmen, filter).length;

  if (loading) return <DashboardLoading />;

  async function handleSubmit(payload: CraftsmanInput): Promise<boolean> {
    if (formTarget === "new") {
      const ok = await createCraftsman(payload);
      if (ok) {
        toast("success", "تمت إضافة الصنايعي");
        setFormTarget(null);
        router.refresh();
      }
      return ok;
    }
    if (formTarget) {
      const ok = await updateCraftsman(formTarget.id, payload);
      if (ok) {
        toast("success", "تم حفظ التعديلات");
        setFormTarget(null);
        router.refresh();
      }
      return ok;
    }
    return false;
  }

  async function handleToggleVerified(craftsman: CraftsmanRow) {
    const ok = await toggleCraftsmanVerified(craftsman);
    if (ok) {
      toast("success", craftsman.verified ? "تم إلغاء التوثيق" : "تم توثيق الصنايعي");
      router.refresh();
    }
  }

  async function handleTogglePublished(craftsman: CraftsmanRow) {
    const ok = await toggleCraftsmanPublished(craftsman);
    if (ok) {
      toast("success", craftsman.is_published ? "تم إخفاء الصنايعي" : "تم نشر الصنايعي");
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const ok = await deleteCraftsman(deleteTarget.id);
    if (ok) {
      toast("success", "تم حذف الصنايعي");
      setDeleteTarget(null);
      router.refresh();
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="الصنايعية"
        description={`إدارة ${totalDisplayCount} صنايعي في الدليل.`}
        actions={
          <>
            <RefreshButton
              onRefresh={() => {
                void refresh();
                router.refresh();
              }}
            />
            <AdminButton
              type="button"
              onClick={() => setFormTarget("new")}
            >
              <IconPlus className="h-5 w-5" />
              إضافة صنايعي
            </AdminButton>
          </>
        }
      />

      <section
        className={`grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card transition-opacity duration-200 ${
          isPending ? "opacity-60 pointer-events-none" : "opacity-100"
        }`}
      >
        <CraftsmenFilters
          filter={filter}
          categories={categories}
          onChange={handleFilterChange}
        />

        {pageItems.length === 0 ? (
          <EmptyState
            icon={<IconUsers className="h-8 w-8" />}
            title="لا توجد نتائج"
            description="جرّب تغيير البحث أو الفلاتر، أو أضف صنايعي جديد."
          />
        ) : (
          <>
            <CraftsmenTable
              craftsmen={pageItems}
              busyKey={busyKey}
              onToggleVerified={(item) => void handleToggleVerified(item)}
              onTogglePublished={(item) => void handleTogglePublished(item)}
              onEdit={setFormTarget}
              onDelete={setDeleteTarget}
              onLinkAccount={setLinkTarget}
              onView={(slug) => window.open(`/craftsman/${slug}`, "_blank")}
            />
            <Pagination
              page={safePage}
              pageCount={pageCount}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </section>

      <LinkAccountModal
        craftsman={linkTarget}
        isOpen={linkTarget !== null}
        onClose={() => setLinkTarget(null)}
        onSuccess={() => {
          toast("success", "تم ربط حساب الفني بنجاح!");
          refresh();
        }}
      />

      <Modal
        open={formTarget !== null}
        onClose={() => setFormTarget(null)}
        title={formTarget === "new" ? "إضافة صنايعي" : "تعديل بيانات الصنايعي"}
      >
        <CraftsmanForm
          categories={categories}
          areas={areas}
          initial={formTarget === "new" ? null : formTarget}
          busy={
            busyKey === "create-craftsman" ||
            busyKey.startsWith("update-craftsman-")
          }
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