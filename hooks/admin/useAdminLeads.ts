"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ADMIN_LEADS_PAGE_SIZE,
  fetchCategories,
  type AdminLeadResponseRow,
  type AdminLeadRow,
  type AdminLeadsPage,
  type CategoryRow,
} from "@/lib/db/admin";
import type { LeadFacetCounts, LeadFilter } from "@/lib/db/admin-selectors";
import {
  parseLeadFilterParams,
  serializeLeadFilterParams,
} from "@/lib/db/admin-selectors";
import {
  adminBulkLeadsAction,
  adminDeleteExpiredLeadsAction,
  adminDeleteLeadAction,
  adminHideLeadAction,
  fetchAdminLeadsPageAction,
  fetchAllLeadIdsAction,
  fetchLeadResponsesAction,
} from "@/app/actions/admin-leads";
import { toArabicDigits } from "@/lib/utils/format";
import { useToast } from "@/hooks/ui/useToast";
import { useAdminAction } from "./useAdminAction";

const DEFAULT_FILTER: LeadFilter = {
  search: "",
  category: "all",
  status: "all",
  visibility: "all",
  sort: "newest",
};

export type AdminLeadsData = {
  page: AdminLeadsPage;
  categories: CategoryRow[];
};

const SEARCH_DEBOUNCE_MS = 450;

const EMPTY_FACETS: LeadFacetCounts = {
  statusAll: 0,
  status: { open: 0, claimed: 0, completed: 0, expired: 0, cancelled: 0 },
  visibilityAll: 0,
  visible: 0,
  hidden: 0,
};

export function useAdminLeads(initialData?: AdminLeadsData) {
  const { toast } = useToast();
  const { busyKey, error: actionError, run } = useAdminAction();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // قراءة أولية من الـ URL — روابط قابلة للمشاركة (تحديث الصفحة يحافظ على العرض).
  const initialParams = useMemo(
    () => parseLeadFilterParams(searchParams),
    [searchParams],
  );
  const [filter, setFilter] = useState<LeadFilter>({
    ...DEFAULT_FILTER,
    ...initialParams.filter,
  });
  const [page, setPage] = useState(initialParams.page);
  const [refreshToken, setRefreshToken] = useState(0);
  const [pageData, setPageData] = useState<AdminLeadsPage | null>(
    initialData?.page ?? null,
  );
  const [categories, setCategories] = useState<CategoryRow[]>(
    initialData?.categories ?? [],
  );
  const [fetching, setFetching] = useState(false);
  const [loadError, setLoadError] = useState("");
  const error = loadError || actionError;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailsLead, setDetailsLead] = useState<AdminLeadRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminLeadRow | null>(null);
  const [hideTarget, setHideTarget] = useState<AdminLeadRow | null>(null);
  const [hideReason, setHideReason] = useState("");
  const [bulkAction, setBulkAction] = useState<"hide" | "unhide" | "delete" | null>(null);
  const [responses, setResponses] = useState<AdminLeadResponseRow[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);

  // البحث يُرسل للسيرفر بعد توقف الكتابة — باقي الفلاتر فورية.
  const [debouncedSearch, setDebouncedSearch] = useState(filter.search);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filter.search);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [filter.search]);

  // عكس الحالة على الـ URL (replace بلا تكديس history، والبحث بعد الـ debounce)
  // — روابط قابلة للمشاركة وزر الرجوع يحافظ على السياق.
  useEffect(() => {
    const qs = serializeLeadFilterParams(
      { ...filter, search: debouncedSearch },
      page,
    );
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, filter, debouncedSearch, page]);

  // الصفحة المطلوبة للسيرفر — تُقَصّ على عدد الصفحات المعروف (بعد حذف
  // عناصر قد يتجاوز `page` المتاح، فيُعاد الجلب تلقائياً بالصفحة الآمنة
  // عبر تغيّر queryKey — بلا setState داخل effect).
  const totalForClamp = pageData?.totalCount ?? 0;
  const pageCountForClamp = Math.max(
    1,
    Math.ceil(totalForClamp / ADMIN_LEADS_PAGE_SIZE),
  );
  const requestPage = Math.min(page, pageCountForClamp);

  // مفتاح الاستعلام الحالي — أي تغيّر فيه يجلب صفحة جديدة من السيرفر.
  const queryKey = useMemo(
    () =>
      JSON.stringify([
        debouncedSearch,
        filter.category,
        filter.status,
        filter.visibility,
        filter.sort,
        requestPage,
        refreshToken,
      ]),
    [
      debouncedSearch,
      filter.category,
      filter.status,
      filter.visibility,
      filter.sort,
      requestPage,
      refreshToken,
    ],
  );

  // الصفحة الأولى بالفلتر الافتراضي تأتي من السيرفر مع initialData — لا إعادة جلب لها.
  const initialKey = useMemo(
    () => JSON.stringify(["", "all", "all", "all", "newest", 1, 0]),
    [],
  );
  const skipInitialFetch = useRef(initialData !== undefined && queryKey === initialKey);
  // حارس السباق: الأحدث فقط هو من يكتب النتيجة (تجاهل الردود القديمة).
  const latestRequest = useRef<unknown>(null);

  const refresh = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      if (initialData?.categories.length) return;
    }
    let cancelled = false;
    const requestId = Symbol("leads-page");
    latestRequest.current = requestId;
    setFetching(true);
    setLoadError("");
    const query: Parameters<typeof fetchAdminLeadsPageAction>[0] = {
      filter: { ...filter, search: debouncedSearch },
      page: requestPage,
      pageSize: ADMIN_LEADS_PAGE_SIZE,
    };
    const tasks: [Promise<AdminLeadsPage>, Promise<CategoryRow[] | null>] = [
      fetchAdminLeadsPageAction(query),
      categories.length === 0 ? fetchCategories() : Promise.resolve(null),
    ];
    void Promise.all(tasks)
      .then(([nextPage, nextCategories]) => {
        if (cancelled || latestRequest.current !== requestId) return;
        setPageData(nextPage);
        if (nextCategories) setCategories(nextCategories);
      })
      .catch(() => {
        if (cancelled || latestRequest.current !== requestId) return;
        setLoadError("مقدرناش نحمّل عروض العملاء");
      })
      .finally(() => {
        if (cancelled || latestRequest.current !== requestId) return;
        setFetching(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  const facets = useMemo(() => pageData?.facets, [pageData]);
  const totalCount = pageData?.totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / ADMIN_LEADS_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = useMemo(() => pageData?.items ?? [], [pageData]);

  const handleFilterChange = (next: Partial<LeadFilter>) => {
    setFilter((prev) => ({ ...prev, ...next }));
    setPage(1);
    setSelectedIds([]);
  };

  const isFilterActive = useMemo(
    () => JSON.stringify(filter) !== JSON.stringify(DEFAULT_FILTER),
    [filter],
  );

  const resetFilters = useCallback(() => {
    setFilter(DEFAULT_FILTER);
    setPage(1);
    setSelectedIds([]);
  }, []);

  const handlePageChange = (next: number) => {
    setPage(next);
    setSelectedIds([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── التحديد الجماعي ──
  const pageIds = pageItems.map((lead) => lead.id);
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleSelect = (leadId: string) => {
    setSelectedIds((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId],
    );
  };

  const toggleSelectPage = () => {
    setSelectedIds((prev) =>
      allOnPageSelected
        ? prev.filter((id) => !pageIds.includes(id))
        : [...new Set([...prev, ...pageIds])],
    );
  };

  const clearSelection = () => setSelectedIds([]);

  // ── إجراءات فردية ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    const ok = await run(`delete-lead-${target.id}`, () =>
      adminDeleteLeadAction(target.id),
    );
    if (ok) {
      toast("success", "تم حذف الطلب وإشعار العميل");
      setDeleteTarget(null);
      if (detailsLead?.id === target.id) setDetailsLead(null);
      setSelectedIds((prev) => prev.filter((id) => id !== target.id));
      refresh();
    }
  };

  const handleHide = async () => {
    if (!hideTarget) return;
    const target = hideTarget;
    const reason = hideReason.trim();
    const ok = await run(`hide-lead-${target.id}`, () =>
      adminHideLeadAction(target.id, true, reason || undefined),
    );
    if (ok) {
      toast("success", "تم إخفاء الطلب");
      setHideTarget(null);
      setHideReason("");
      // مزامنة الدراور المفتوح فوراً — refresh() يجلب صفحة جديدة فقط.
      setDetailsLead((prev) =>
        prev?.id === target.id
          ? {
              ...prev,
              hidden: true,
              hidden_at: new Date().toISOString(),
              hidden_reason: reason || null,
            }
          : prev,
      );
      setSelectedIds((prev) => prev.filter((id) => id !== target.id));
      refresh();
    }
  };

  const handleUnhide = async (lead: AdminLeadRow) => {
    const ok = await run(`unhide-lead-${lead.id}`, () =>
      adminHideLeadAction(lead.id, false),
    );
    if (ok) {
      toast("success", "تم إظهار الطلب من جديد");
      setDetailsLead((prev) =>
        prev?.id === lead.id
          ? { ...prev, hidden: false, hidden_at: null, hidden_reason: null }
          : prev,
      );
      setSelectedIds((prev) => prev.filter((id) => id !== lead.id));
      refresh();
    }
  };

  // ── إجراءات جماعية ──
  const handleBulk = async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    const action = bulkAction;
    const count = selectedIds.length;
    const ok = await run(`bulk-${action}-leads`, () =>
      adminBulkLeadsAction(selectedIds, action),
    );
    if (ok) {
      toast(
        "success",
        action === "delete"
          ? `تم حذف ${count} طلب وإشعار أصحابها`
          : action === "hide"
            ? `تم إخفاء ${count} طلب`
            : `تم إظهار ${count} طلب من جديد`,
      );
      setBulkAction(null);
      clearSelection();
      refresh();
    }
  };

  // ── تحديد كل النتائج المطابقة عبر الصفحات (بسقف العملية الجماعية) ──
  const handleSelectAllResults = async () => {
    let count = 0;
    const ok = await run("select-all-results", async () => {
      const ids = await fetchAllLeadIdsAction({
        ...filter,
        search: debouncedSearch,
      });
      if (ids.length === 0) throw new Error("لا توجد نتائج مطابقة للتحديد");
      count = ids.length;
      setSelectedIds(ids);
    });
    if (ok) toast("success", `تم تحديد ${toArabicDigits(count)} نتيجة`);
  };

  // ── حذف جماعي للمنتهي (تنظيف التراكم — عبر نفس مسار الحذف الفردي
  // بإشعار العميل، بسقف BULK_LEADS_LIMIT للدفعة) ──
  const [confirmExpired, setConfirmExpired] = useState(false);

  const handleDeleteExpired = async () => {
    const ok = await run("bulk-delete-expired-leads", () =>
      adminDeleteExpiredLeadsAction(),
    );
    if (ok) {
      toast("success", "تم حذف الطلبات المنتهية وإشعار أصحابها");
      setConfirmExpired(false);
      clearSelection();
      refresh();
    }
  };

  // ── ردود الطلب داخل الدروور ──
  const openDetails = async (lead: AdminLeadRow) => {
    setDetailsLead(lead);
    setResponses([]);
    setResponsesLoading(true);
    try {
      setResponses(await fetchLeadResponsesAction(lead.id));
    } catch {
      toast("error", "مقدرناش نحمّل ردود هذا الطلب");
    } finally {
      setResponsesLoading(false);
    }
  };

  return {
    categories,
    facets: facets ?? EMPTY_FACETS,
    filter,
    handleFilterChange,
    resetFilters,
    isFilterActive,
    fetching,
    filteredCount: totalCount,
    pageItems,
    page: safePage,
    pageCount,
    handlePageChange,
    // تحديد جماعي
    selectedIds,
    allOnPageSelected,
    toggleSelect,
    toggleSelectPage,
    clearSelection,
    bulkAction,
    setBulkAction,
    handleBulk,
    confirmExpired,
    setConfirmExpired,
    handleDeleteExpired,
    handleSelectAllResults,
    // إجراءات فردية
    detailsLead,
    openDetails,
    setDetailsLead,
    deleteTarget,
    setDeleteTarget,
    hideTarget,
    setHideTarget,
    hideReason,
    setHideReason,
    handleDelete,
    handleHide,
    handleUnhide,
    // ردود الدروور
    responses,
    responsesLoading,
    // حالة عامة
    loading: pageData === null && fetching,
    error,
    busyKey,
    refresh,
  };
}
