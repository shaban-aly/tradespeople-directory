"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCraftsman,
  deleteCraftsman,
  fetchAreas,
  fetchCategories,
  fetchCraftsmen,
  toggleCraftsmanPublished,
  toggleCraftsmanVerified,
  updateCraftsman,
  type CraftsmanInput,
  type CraftsmanRow,
  type CategoryRow,
  type AreaRow,
} from "@/lib/db/admin";
import {
  filterCraftsmen,
  paginate,
  type CraftsmanFilter,
} from "@/lib/db/admin-selectors";
import { useToast } from "@/hooks/ui/useToast";
import { useAdminAction } from "./useAdminAction";
import { useAdminQuery } from "./useAdminQuery";

const PAGE_SIZE = 8;

export interface AdminCraftsmenData {
  categories: CategoryRow[];
  areas: AreaRow[];
  craftsmen: CraftsmanRow[];
}

export interface UseAdminCraftsmenOptions {
  initialData?: AdminCraftsmenData;
  initialFilter?: CraftsmanFilter;
  initialPagination?: {
    page: number;
    pageCount: number;
    totalCount: number;
  };
}

export function useAdminCraftsmen(
  optionsOrData?: AdminCraftsmenData | UseAdminCraftsmenOptions,
) {
  const options: UseAdminCraftsmenOptions =
    optionsOrData && "craftsmen" in optionsOrData
      ? { initialData: optionsOrData }
      : (optionsOrData ?? {});

  const { initialData, initialFilter, initialPagination } = options;

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const { data, loading, error: loadError, refresh } = useAdminQuery(async () => {
    const [categories, areas, craftsmen] = await Promise.all([
      fetchCategories(),
      fetchAreas(),
      fetchCraftsmen(),
    ]);
    return { categories, areas, craftsmen };
  }, initialData);

  const { busyKey, error: actionError, run } = useAdminAction();
  const error = loadError || actionError;

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

  // Debounce search input
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

  const rawCraftsmen = data?.craftsmen ?? [];
  const categories = data?.categories ?? [];
  const areas = data?.areas ?? [];

  const pageItems = isServerPaginated
    ? rawCraftsmen
    : paginate(filterCraftsmen(rawCraftsmen, filter), page, PAGE_SIZE).pageItems;
  const pageCount = isServerPaginated
    ? (initialPagination?.pageCount ?? 1)
    : paginate(filterCraftsmen(rawCraftsmen, filter), page, PAGE_SIZE).pageCount;
  const safePage = isServerPaginated
    ? page
    : paginate(filterCraftsmen(rawCraftsmen, filter), page, PAGE_SIZE).page;
  const totalDisplayCount = isServerPaginated
    ? (initialPagination?.totalCount ?? rawCraftsmen.length)
    : filterCraftsmen(rawCraftsmen, filter).length;

  const handleSubmit = async (payload: CraftsmanInput): Promise<boolean> => {
    if (formTarget === "new") {
      const ok = await run("create-craftsman", () => createCraftsman(payload), refresh);
      if (ok) {
        toast("success", "تمت إضافة الصنايعي");
        setFormTarget(null);
        router.refresh();
      }
      return ok;
    }
    if (formTarget) {
      const ok = await run(
        `update-craftsman-${formTarget.id}`,
        () => updateCraftsman(formTarget.id, payload),
        refresh,
      );
      if (ok) {
        toast("success", "تم حفظ التعديلات");
        setFormTarget(null);
        router.refresh();
      }
      return ok;
    }
    return false;
  };

  const handleToggleVerified = async (craftsman: CraftsmanRow) => {
    const ok = await run(
      `craftsman-verified-${craftsman.id}`,
      () => toggleCraftsmanVerified(craftsman),
      refresh,
    );
    if (ok) {
      toast("success", craftsman.verified ? "تم إلغاء التوثيق" : "تم توثيق الصنايعي");
      router.refresh();
    }
  };

  const handleTogglePublished = async (craftsman: CraftsmanRow) => {
    const ok = await run(
      `craftsman-published-${craftsman.id}`,
      () => toggleCraftsmanPublished(craftsman),
      refresh,
    );
    if (ok) {
      toast("success", craftsman.is_published ? "تم إخفاء الصنايعي" : "تم نشر الصنايعي");
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await run(
      `delete-craftsman-${deleteTarget.id}`,
      () => deleteCraftsman(deleteTarget.id, rawCraftsmen),
      refresh,
    );
    if (ok) {
      toast("success", "تم حذف الصنايعي");
      setDeleteTarget(null);
      router.refresh();
    }
  };

  const handleRefresh = () => {
    void refresh();
    router.refresh();
  };

  return {
    categories,
    areas,
    craftsmen: rawCraftsmen,
    pageItems,
    pageCount,
    page: safePage,
    totalDisplayCount,
    loading,
    error,
    busyKey,
    isPending,
    filter,
    setFilter,
    handleFilterChange,
    handlePageChange,
    formTarget,
    setFormTarget,
    deleteTarget,
    setDeleteTarget,
    linkTarget,
    setLinkTarget,
    handleSubmit,
    handleToggleVerified,
    handleTogglePublished,
    handleDelete,
    refresh: handleRefresh,
  };
}
