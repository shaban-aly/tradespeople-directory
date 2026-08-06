import type {
  AreaRow,
  CategoryRow,
  ContactMessageRow,
  CountRow,
  CraftsmanRow,
  JoinRequestRow,
} from "./admin";

export type RequestTypeTab = "all" | "register" | "report";
export type RequestStatusFilter = "all" | "pending" | "approved" | "rejected";

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
  activeCategories: number;
  totalCategories: number;
  activeAreas: number;
  totalAreas: number;
  unreadMessages: number;
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
  typeTab: RequestTypeTab,
  statusFilter: RequestStatusFilter,
): JoinRequestRow[] {
  return requests.filter(
    (request) =>
      (typeTab === "all" || request.type === typeTab) &&
      (statusFilter === "all" || request.status === statusFilter),
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
  messages: ContactMessageRow[];
}): OverviewMetrics {
  const { craftsmen, categories, areas, requests, messages } = input;

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
    activeCategories: categories.filter((item) => item.is_active).length,
    totalCategories: categories.length,
    activeAreas: areas.filter((item) => item.is_active).length,
    totalAreas: areas.length,
    unreadMessages: messages.filter((item) => !item.is_read).length,
    recentCraftsmen: craftsmen.slice(0, 5),
    categoryChart,
    maxCount,
    totalCalls,
    totalWhatsapp,
    totalViews,
    mostContacted,
  };
}
