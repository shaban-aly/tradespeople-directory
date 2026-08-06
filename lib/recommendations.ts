import type { Craftsman } from "@/lib/data/craftsmen";
import { matchesQuery, normalizeArabic } from "@/lib/search";

export type BehaviorEventType =
  | "view"
  | "call"
  | "whatsapp"
  | "search"
  | "like"
  | "dismiss";

export type BehaviorEvent = {
  type: BehaviorEventType;
  craftsmanSlug?: string;
  query?: string;
  ts: number;
};

/** صنايعي مع إحصائياته الحقيقية — حقل الترشيحات. */
export type RecommendableCraftsman = Craftsman & {
  stats: { views: number; calls: number; whatsapp: number };
};

export type BehaviorProfile = {
  contacted: Set<string>;
  dismissed: Set<string>;
  searches: string[];
};

export type RankOptions = {
  count?: number;
  maxPerCategory?: number;
};

const EVENTS_STORAGE_KEY = "sanay:rec:events";
const FAVORITES_STORAGE_KEY = "sanay:rec:favorites";
const CHANGED_EVENT = "sanay:rec:changed";
const MAX_EVENTS = 100;

/** وزن كل إشارة سلوكية — الاتصال أقوى من التصفح، والحفظ الأقوى. */
const TYPE_WEIGHTS: Record<BehaviorEventType, number> = {
  view: 1,
  search: 2,
  call: 3,
  whatsapp: 3,
  like: 5,
  dismiss: 0,
};

const EVENT_TYPES: BehaviorEventType[] = [
  "view",
  "call",
  "whatsapp",
  "search",
  "like",
  "dismiss",
];

function isEvent(value: unknown): value is BehaviorEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Record<string, unknown>;
  return (
    typeof event.ts === "number" &&
    typeof event.type === "string" &&
    EVENT_TYPES.includes(event.type as BehaviorEventType) &&
    (event.craftsmanSlug === undefined ||
      typeof event.craftsmanSlug === "string") &&
    (event.query === undefined || typeof event.query === "string")
  );
}

/** إضافة حدث مع الحفاظ على آخر `MAX_EVENTS` فقط — دالة صافية قابلة للاختبار. */
export function mergeEvents(
  events: BehaviorEvent[],
  event: BehaviorEvent,
): BehaviorEvent[] {
  return [...events, event].slice(-MAX_EVENTS);
}

/** قراءة الأحداث من localStorage مع التحقق من الصحة والحجم. */
export function readBehaviorEvents(): BehaviorEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEvent).slice(-MAX_EVENTS);
  } catch {
    return [];
  }
}

/** تسجيل حدث سلوكي محلياً (مجهول، بلا بيانات شخصية). */
export function recordBehaviorEvent(event: BehaviorEvent): void {
  if (typeof window === "undefined") return;
  try {
    const events = readBehaviorEvents();
    window.localStorage.setItem(
      EVENTS_STORAGE_KEY,
      JSON.stringify(mergeEvents(events, event)),
    );
  } catch {
    // تجاهل فشل التخزين (تصفح خاص أو امتلاء)
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

/** هل هناك سجل سلوكي كافٍ لعرض اقتراحات مخصصة؟ (الإخفاء وحده لا يُحتسب). */
export function hasBehaviorHistory(events: BehaviorEvent[]): boolean {
  return events.some((event) => event.type !== "dismiss");
}

const eventListeners = new Set<() => void>();
const favoriteListeners = new Set<() => void>();
let cachedEvents: BehaviorEvent[] | null = null;
let cachedFavorites: string[] | null = null;

function invalidateEvents(): void {
  cachedEvents = null;
  eventListeners.forEach((listener) => listener());
}

function invalidateFavorites(): void {
  cachedFavorites = null;
  favoriteListeners.forEach((listener) => listener());
}

/** اشتراك في تغييرات الأحداث (نفس التبويب عبر حدث مخصص + التبويبات الأخرى عبر storage). */
export function subscribeBehavior(listener: () => void): () => void {
  eventListeners.add(listener);
  window.addEventListener("storage", invalidateEvents);
  window.addEventListener(CHANGED_EVENT, invalidateEvents);
  return () => {
    eventListeners.delete(listener);
    window.removeEventListener("storage", invalidateEvents);
    window.removeEventListener(CHANGED_EVENT, invalidateEvents);
  };
}

/** لقطة ثابتة المرجع لاستخدامها مع useSyncExternalStore. */
export function readBehaviorEventsCached(): BehaviorEvent[] {
  if (typeof window === "undefined") return [];
  if (cachedEvents === null) cachedEvents = readBehaviorEvents();
  return cachedEvents;
}

/** قراءة قائمة المفضلة من localStorage. */
export function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((slug): slug is string => typeof slug === "string");
  } catch {
    return [];
  }
}

/** تبديل حالة المفضلة لصنايعي — مع تسجيل إشارة «إعجاب» للتوصية. */
export function toggleFavorite(slug: string): boolean {
  if (typeof window === "undefined") return false;
  const favorites = readFavorites();
  const has = favorites.includes(slug);
  const next = has
    ? favorites.filter((favorite) => favorite !== slug)
    : [...favorites, slug];
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // تجاهل فشل التخزين
  }
  if (!has) recordBehaviorEvent({ type: "like", craftsmanSlug: slug, ts: Date.now() });
  window.dispatchEvent(new Event(CHANGED_EVENT));
  return !has;
}

/** اشتراك في تغييرات المفضلة. */
export function subscribeFavorites(listener: () => void): () => void {
  favoriteListeners.add(listener);
  window.addEventListener("storage", invalidateFavorites);
  window.addEventListener(CHANGED_EVENT, invalidateFavorites);
  return () => {
    favoriteListeners.delete(listener);
    window.removeEventListener("storage", invalidateFavorites);
    window.removeEventListener(CHANGED_EVENT, invalidateFavorites);
  };
}

/** لقطة ثابتة المرجع لقائمة المفضلة. */
export function readFavoritesCached(): string[] {
  if (typeof window === "undefined") return [];
  if (cachedFavorites === null) cachedFavorites = readFavorites();
  return cachedFavorites;
}

/** تجميع الميول من الأحداث: المتصل بهم/المستبعدون/عمليات البحث. */
export function buildBehaviorProfile(events: BehaviorEvent[]): BehaviorProfile {
  const contacted = new Set<string>();
  const dismissed = new Set<string>();
  const searches: string[] = [];

  for (const event of events) {
    if (event.type === "search") {
      if (event.query) {
        const normalized = normalizeArabic(event.query);
        if (normalized) searches.push(normalized);
      }
      continue;
    }
    if (!event.craftsmanSlug) continue;
    if (event.type === "call" || event.type === "whatsapp") {
      contacted.add(event.craftsmanSlug);
    }
    if (event.type === "dismiss") dismissed.add(event.craftsmanSlug);
  }

  return { contacted, dismissed, searches };
}

/**
 * ترتيب اقتراحات الصنايعية بمعادلة تجمع بين:
 * ميل المستخدم (التخصصات/المناطق اللي تفاعل معها) + شهرة الصنايعي (إحصائيات حقيقية) + تنوّع التخصصات.
 * بلا أي أحداث يعود ترتيب الشهرة — نفس «الأكثر طلباً».
 */
export function rankRecommendations(
  pool: RecommendableCraftsman[],
  events: BehaviorEvent[],
  options: RankOptions = {},
): RecommendableCraftsman[] {
  const { count = 8, maxPerCategory = 2 } = options;
  const profile = buildBehaviorProfile(events);

  const bySlug = new Map(pool.map((craftsman) => [craftsman.slug, craftsman]));
  const categoryAffinity = new Map<string, number>();
  const areaAffinity = new Map<string, number>();

  for (const event of events) {
    if (event.type === "search" || !event.craftsmanSlug) continue;
    const craftsman = bySlug.get(event.craftsmanSlug);
    if (!craftsman) continue;
    const weight = TYPE_WEIGHTS[event.type] ?? 1;
    categoryAffinity.set(
      craftsman.category,
      (categoryAffinity.get(craftsman.category) ?? 0) + weight,
    );
    areaAffinity.set(
      craftsman.area,
      (areaAffinity.get(craftsman.area) ?? 0) + weight,
    );
  }

  const candidates = pool.filter(
    (craftsman) =>
      !profile.contacted.has(craftsman.slug) &&
      !profile.dismissed.has(craftsman.slug),
  );

  const scored = candidates.map((craftsman) => {
    const affinity =
      (categoryAffinity.get(craftsman.category) ?? 0) * 2 +
      (areaAffinity.get(craftsman.area) ?? 0) * 1.5 +
      profile.searches.reduce(
        (sum, query) =>
          sum +
          (matchesQuery(
            query,
            craftsman.name,
            craftsman.category,
            craftsman.area,
            craftsman.description,
          )
            ? 2
            : 0),
        0,
      );
    const popularity =
      Math.log1p(
        craftsman.stats.calls * 3 +
          craftsman.stats.whatsapp * 3 +
          craftsman.stats.views,
      ) + (craftsman.verified ? 0.5 : 0);
    // الميول الشخصي خطي (يستجيب حتى لإشارة واحدة) والسمعة مضغوطة log
    return { craftsman, score: 0.7 * affinity + 0.3 * popularity };
  });

  scored.sort((a, b) => b.score - a.score);

  const result: RecommendableCraftsman[] = [];
  const perCategory = new Map<string, number>();
  for (const { craftsman } of scored) {
    if (result.length >= count) break;
    const seen = perCategory.get(craftsman.category) ?? 0;
    if (seen >= maxPerCategory) continue;
    perCategory.set(craftsman.category, seen + 1);
    result.push(craftsman);
  }
  return result;
}
