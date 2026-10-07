import type {
  AdminLeadRow,
  AreaRow,
  CategoryRow,
  ContactMessageRow,
  CountRow,
  CraftsmanRow,
  JoinRequestRow,
  PushDiagnosticRow,
  ReportRow,
} from "./admin";

export type RequestStatusFilter = "all" | "pending" | "rejected";
export type ReportStatusFilter = "all" | "pending" | "reviewed" | "dismissed";

export type LeadStatus = "open" | "claimed" | "completed" | "expired" | "cancelled";
export type LeadStatusFilter = "all" | LeadStatus;
export type LeadVisibilityFilter = "all" | "visible" | "hidden";
export type LeadSort = "newest" | "oldest" | "expiring";

export type LeadFilter = {
  search: string;
  category: string; // slug أو "all"
  status: LeadStatusFilter;
  visibility: LeadVisibilityFilter;
  sort: LeadSort;
};

/**
 * تصنيف ثلاثي لأسباب فشل الإشعارات — الغرض فرز ما يستحق تدخّلاً هندسياً:
 * `permission` قرار المستخدم/المتصفح، `capability` حدود البيئة،
 * و`technical` أعطال فعلية في مسارنا (SW/FCM/RPC) وهي وحدها القابلة للإصلاح.
 */
export type PushDiagnosticGroup = "all" | "permission" | "capability" | "technical";

export const PUSH_DIAGNOSTIC_REASONS: Record<
  Exclude<PushDiagnosticGroup, "all">,
  readonly string[]
> = {
  permission: ["blocked", "not_granted"],
  capability: ["unsupported", "unconfigured"],
  technical: ["sw_failed", "messaging_failed", "token_failed", "register_failed"],
};

/** مجموعة السبب، أو `null` لسبب غير معروف (توسعة مستقبلية في الدالة) */
export function pushDiagnosticGroupOf(
  reason: string,
): Exclude<PushDiagnosticGroup, "all"> | null {
  for (const group of ["permission", "capability", "technical"] as const) {
    if (PUSH_DIAGNOSTIC_REASONS[group].includes(reason)) return group;
  }
  return null;
}

export function filterPushDiagnostics(
  rows: PushDiagnosticRow[],
  group: PushDiagnosticGroup,
): PushDiagnosticRow[] {
  if (group === "all") return rows;
  return rows.filter((row) => pushDiagnosticGroupOf(row.reason) === group);
}

export function countPushDiagnostics(
  rows: PushDiagnosticRow[],
): Record<PushDiagnosticGroup, number> {
  const counts: Record<PushDiagnosticGroup, number> = {
    all: rows.length,
    permission: 0,
    capability: 0,
    technical: 0,
  };
  for (const row of rows) {
    const group = pushDiagnosticGroupOf(row.reason);
    if (group) counts[group] += 1;
  }
  return counts;
}

export type CraftsmanFilter = {
  search: string;
  category: string;
  published: "all" | "published" | "hidden";
  verified: "all" | "verified" | "unverified";
};

export type CategoryChartItem = { name: string; count: number };

export type MostContactedItem = { craftsman: CraftsmanRow; contacts: number };

export type OverviewMetrics = {
  publishedCraftsmen: number;
  totalCraftsmen: number;
  pendingRequests: JoinRequestRow[];
  pendingReports: ReportRow[];
  activeCategories: number;
  totalCategories: number;
  activeAreas: number;
  totalAreas: number;
  unreadMessages: number;
  openLeads: number;
  recentCraftsmen: CraftsmanRow[];
  categoryChart: CategoryChartItem[];
  maxCount: number;
  totalCalls: number;
  totalWhatsapp: number;
  totalViews: number;
  mostContacted: MostContactedItem[];
};

export function buildCategoryCounts(counts: CountRow[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of counts) {
    const key = row.category?.slug ?? "unknown";
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

export function buildAreaCounts(counts: CountRow[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of counts) {
    const key = row.area?.name ?? "unknown";
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

export function filterRequests(
  requests: JoinRequestRow[],
  statusFilter: RequestStatusFilter,
): JoinRequestRow[] {
  return requests.filter(
    (request) => statusFilter === "all" || request.status === statusFilter,
  );
}

export function filterReports(
  reports: ReportRow[],
  statusFilter: ReportStatusFilter,
): ReportRow[] {
  return reports.filter(
    (report) => statusFilter === "all" || report.status === statusFilter,
  );
}

export function filterCraftsmen(
  craftsmen: CraftsmanRow[],
  filter: CraftsmanFilter,
): CraftsmanRow[] {
  const query = filter.search.trim().toLowerCase();
  return craftsmen.filter((craftsman) => {
    if (
      query &&
      !craftsman.name.toLowerCase().includes(query) &&
      !craftsman.phone.toLowerCase().includes(query)
    ) {
      return false;
    }
    if (filter.category !== "all" && craftsman.category?.slug !== filter.category) {
      return false;
    }
    if (
      filter.published !== "all" &&
      craftsman.is_published !== (filter.published === "published")
    ) {
      return false;
    }
    if (
      filter.verified !== "all" &&
      craftsman.verified !== (filter.verified === "verified")
    ) {
      return false;
    }
    return true;
  });
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): { page: number; pageCount: number; pageItems: T[] } {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageItems = items.slice((safePage - 1) * pageSize, safePage * pageSize);
  return { page: safePage, pageCount, pageItems };
}

const LEAD_STATUS_VALUES: readonly string[] = [
  "all",
  "open",
  "claimed",
  "completed",
  "expired",
  "cancelled",
];
const LEAD_VISIBILITY_VALUES: readonly string[] = ["all", "visible", "hidden"];
const LEAD_SORT_VALUES: readonly string[] = ["newest", "oldest", "expiring"];

/** قراءة فلتر الليدز من query string — أي قيمة غريبة تُسقط للافتراضي. */
export function parseLeadFilterParams(params: Pick<URLSearchParams, "get">): {
  filter: LeadFilter;
  page: number;
} {
  const pick = (key: string, allowed: readonly string[], fallback: string) => {
    const value = params.get(key);
    return value !== null && allowed.includes(value) ? value : fallback;
  };
  const category = (params.get("category") ?? "").trim().slice(0, 100);
  const rawPage = Number.parseInt(params.get("page") ?? "", 10);
  return {
    filter: {
      search: (params.get("q") ?? "").slice(0, 200),
      category: category || "all",
      status: pick("status", LEAD_STATUS_VALUES, "all") as LeadStatusFilter,
      visibility: pick(
        "visibility",
        LEAD_VISIBILITY_VALUES,
        "all",
      ) as LeadVisibilityFilter,
      sort: pick("sort", LEAD_SORT_VALUES, "newest") as LeadSort,
    },
    page:
      Number.isFinite(rawPage) && rawPage > 0 ? Math.min(Math.floor(rawPage), 1000) : 1,
  };
}

/** تسلسل الفلتر لـ query string — القيم الافتراضية تُحذف لروابط نظيفة قابلة للمشاركة. */
export function serializeLeadFilterParams(filter: LeadFilter, page: number): string {
  const qs = new URLSearchParams();
  if (filter.search.trim()) qs.set("q", filter.search.trim());
  if (filter.category !== "all") qs.set("category", filter.category);
  if (filter.status !== "all") qs.set("status", filter.status);
  if (filter.visibility !== "all") qs.set("visibility", filter.visibility);
  if (filter.sort !== "newest") qs.set("sort", filter.sort);
  if (page > 1) qs.set("page", String(page));
  return qs.toString();
}

/** فلترة وبحث وفرز عروض العملاء (admin) — توحي بالسلوك مع filterCraftsmen. */
export function filterLeads(
  leads: AdminLeadRow[],
  filter: LeadFilter,
): AdminLeadRow[] {
  const query = filter.search.trim().toLowerCase();
  const result = leads.filter((lead) => {
    if (
      query &&
      !lead.customer_phone.includes(query) &&
      !lead.description.toLowerCase().includes(query) &&
      !(lead.category?.name ?? "").toLowerCase().includes(query)
    ) {
      return false;
    }
    if (filter.category !== "all" && lead.category?.slug !== filter.category) {
      return false;
    }
    if (filter.status !== "all" && lead.status !== filter.status) {
      return false;
    }
    if (filter.visibility === "visible" && lead.hidden) return false;
    if (filter.visibility === "hidden" && !lead.hidden) return false;
    return true;
  });

  if (filter.sort === "oldest") {
    result.sort((a, b) => a.created_at.localeCompare(b.created_at));
  } else if (filter.sort === "expiring") {
    result.sort((a, b) => a.expires_at.localeCompare(b.expires_at));
  } else {
    result.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  return result;
}

export type LeadFacetCounts = {
  /** عدد الصفوف بعد باقي الفلاتر عدا الحالة (لتاب "الكل" في صف الحالة). */
  statusAll: number;
  status: Record<LeadStatus, number>;
  /** بعد باقي الفلاتر عدا الرؤية (لمenu "الكل" في فلتر الرؤية). */
  visibilityAll: number;
  visible: number;
  hidden: number;
};

/**
 * عدّادات facet لكل تبويب/خيار: كل بُعد يُحسب بعد تطبيق باقي الأبعاد
 * عدا نفسه — حتى يرى المشرف ما سيحصل له لو ضغط على الخيار.
 */
export function countLeadFacets(
  leads: AdminLeadRow[],
  filter: LeadFilter,
): LeadFacetCounts {
  const statusBase = filterLeads(leads, { ...filter, status: "all" });
  const visibilityBase = filterLeads(leads, { ...filter, visibility: "all" });

  const status: Record<LeadStatus, number> = {
    open: 0,
    claimed: 0,
    completed: 0,
    expired: 0,
    cancelled: 0,
  };
  for (const lead of statusBase) {
    if (lead.status in status) status[lead.status as LeadStatus] += 1;
  }

  let visible = 0;
  let hidden = 0;
  for (const lead of visibilityBase) {
    if (lead.hidden) hidden += 1;
    else visible += 1;
  }

  return {
    statusAll: statusBase.length,
    status,
    visibilityAll: visibilityBase.length,
    visible,
    hidden,
  };
}

export function filterMessages(
  messages: ContactMessageRow[],
  readFilter: "all" | "unread",
): ContactMessageRow[] {
  return messages.filter((message) => readFilter === "all" || !message.is_read);
}

export function buildOverviewMetrics(input: {
  craftsmen: CraftsmanRow[];
  categories: CategoryRow[];
  areas: AreaRow[];
  requests: JoinRequestRow[];
  reports: ReportRow[];
  messages: ContactMessageRow[];
}): OverviewMetrics {
  const { craftsmen, categories, areas, requests, reports, messages } = input;

  const categoryChart = categories
    .filter((item) => item.is_active)
    .map((category) => ({
      name: category.name,
      count: craftsmen.filter(
        (craftsman) => craftsman.category?.slug === category.slug,
      ).length,
    }))
    .sort((a, b) => b.count - a.count);
  const maxCount = Math.max(1, ...categoryChart.map((item) => item.count));

  const totalCalls = craftsmen.reduce(
    (sum, item) => sum + (item.stats?.calls ?? 0),
    0,
  );
  const totalWhatsapp = craftsmen.reduce(
    (sum, item) => sum + (item.stats?.whatsapp ?? 0),
    0,
  );
  const totalViews = craftsmen.reduce(
    (sum, item) => sum + (item.stats?.views ?? 0),
    0,
  );

  const mostContacted = [...craftsmen]
    .map((item) => ({
      craftsman: item,
      contacts: (item.stats?.calls ?? 0) + (item.stats?.whatsapp ?? 0),
    }))
    .filter((item) => item.contacts > 0)
    .sort((a, b) => b.contacts - a.contacts)
    .slice(0, 5);

  return {
    publishedCraftsmen: craftsmen.filter((item) => item.is_published).length,
    totalCraftsmen: craftsmen.length,
    pendingRequests: requests.filter((item) => item.status === "pending"),
    pendingReports: reports.filter((item) => item.status === "pending"),
    activeCategories: categories.filter((item) => item.is_active).length,
    totalCategories: categories.length,
    activeAreas: areas.filter((item) => item.is_active).length,
    totalAreas: areas.length,
    unreadMessages: messages.filter((item) => !item.is_read).length,
    openLeads: 0,
    recentCraftsmen: craftsmen.slice(0, 5),
    categoryChart,
    maxCount,
    totalCalls,
    totalWhatsapp,
    totalViews,
    mostContacted,
  };
}
