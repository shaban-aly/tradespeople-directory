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
  stats?: { views: number; calls: number; whatsapp: number };
  recommendationReason?: string;
};

export type BehaviorProfile = {
  contacted: Set<string>;
  dismissed: Set<string>;
  searches: string[];
};

export type RankOptions = {
  count?: number;
  maxPerCategory?: number;
  now?: number;
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

/**
 * هل هناك تفاعل نوعي كافٍ (بحث، اتصال، واتساب، إعجاب، أو أكثر من تصفحين)
 * لتخصيص عنوان القسم لـ «مقترحات مخصصة لك»؟
 */
export function hasPersonalizedHistory(events: BehaviorEvent[]): boolean {
  let views = 0;
  for (const event of events) {
    if (
      event.type === "call" ||
      event.type === "whatsapp" ||
      event.type === "like" ||
      event.type === "search"
    ) {
      return true;
    }
    if (event.type === "view") {
      views++;
      if (views >= 2) return true;
    }
  }
  return false;
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

/** حفظ قائمة المفضلة وتحديث كاش الذاكرة وlocalStorage. */
export function writeFavorites(slugs: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // تجاهل فشل التخزين
  }
  cachedFavorites = slugs;
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

/** تعيين حالة المفضلة لصنايعي صراحةً — بلا أثر سلوكي (يُستخدم للتراجع عند فشل المزامنة). */
export function setFavorite(slug: string, value: boolean): boolean {
  if (typeof window === "undefined") return value;
  const has = readFavorites().includes(slug);
  if (has === value) return value;

  const favorites = readFavorites();
  const next = value
    ? [...favorites, slug]
    : favorites.filter((favorite) => favorite !== slug);
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // تجاهل فشل التخزين
  }
  cachedFavorites = next;
  window.dispatchEvent(new Event(CHANGED_EVENT));
  return value;
}

/** تبديل حالة المفضلة لصنايعي — مع تسجيل إشارة «إعجاب» للتوصية. */
export function toggleFavorite(slug: string): boolean {
  if (typeof window === "undefined") return false;
  const willBeFavorite = !readFavorites().includes(slug);
  setFavorite(slug, willBeFavorite);
  if (willBeFavorite) recordBehaviorEvent({ type: "like", craftsmanSlug: slug, ts: Date.now() });
  return willBeFavorite;
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

const HALF_LIFE_DAYS = 7;
const HALF_LIFE_MS = HALF_LIFE_DAYS * 24 * 60 * 60 * 1000;

/**
 * ترتيب اقتراحات الصنايعية بمعادلة تجمع بين:
 * - تقادم الإشارات الزمني (Time Decay)
 * - ميل المستخدم (التخصصات/المناطق/كلمات البحث)
 * - شهرة الصنايعي الحقيقية (إحصائيات الاتصال والواتساب والزيارات)
 * - معزز التوثيق الذكي وحداثة الإضافة
 * - تنوع التخصصات لمنع احتكار تخصص واحد
 */
export function rankRecommendations(
  pool: RecommendableCraftsman[],
  events: BehaviorEvent[],
  options: RankOptions = {},
): RecommendableCraftsman[] {
  const { count = 8, maxPerCategory = 2, now = Date.now() } = options;
  const profile = buildBehaviorProfile(events);

  const bySlug = new Map(pool.map((craftsman) => [craftsman.slug, craftsman]));
  const categoryAffinity = new Map<string, number>();
  const areaAffinity = new Map<string, number>();

  for (const event of events) {
    if (event.type === "search" || !event.craftsmanSlug) continue;
    const craftsman = bySlug.get(event.craftsmanSlug);
    if (!craftsman) continue;

    // تقادم الإشارات الزمني (Time Decay):
    // نصف عمر 7 أيام للإشارات الفعلية المسجلة بطوابع زمنية حقيقية
    const ageMs = Math.max(0, now - event.ts);
    const isRealTimestamp = event.ts > 1_000_000_000_000;
    const decay = isRealTimestamp
      ? Math.exp(-ageMs / (HALF_LIFE_MS / Math.LN2))
      : 1;

    const weight = (TYPE_WEIGHTS[event.type] ?? 1) * decay;
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
    const categoryScore = categoryAffinity.get(craftsman.category) ?? 0;
    const areaScore = areaAffinity.get(craftsman.area) ?? 0;

    const searchMatchScore = profile.searches.reduce(
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

    const affinity =
      categoryScore * 2 +
      areaScore * 1.5 +
      searchMatchScore;

    const calls = craftsman.stats?.calls ?? 0;
    const whatsapp = craftsman.stats?.whatsapp ?? 0;
    const views = craftsman.stats?.views ?? 0;

    const popularity =
      Math.log1p(calls * 3 + whatsapp * 3 + views) +
      (craftsman.verified ? 0.5 : 0);

    // دفعة للصنايعية الجدد المضافين آخر 30 يوماً
    const addedTime = new Date(craftsman.addedAt).getTime();
    const isRecent =
      !isNaN(addedTime) && now - addedTime <= 30 * 24 * 60 * 60 * 1000;
    const recencyBoost = isRecent ? 0.3 : 0;

    // دفعة ثقة للصنايعي الموثق في تخصص يفضله المستخدم
    const verifiedCategoryBoost =
      craftsman.verified && categoryScore > 0 ? 0.5 : 0;

    const finalScore =
      0.7 * affinity + 0.3 * popularity + recencyBoost + verifiedCategoryBoost;

    // استنتاج سبب التوصية لعرضه للمستخدم
    let recommendationReason: string | undefined;
    if (searchMatchScore > 0) {
      recommendationReason = "يطابق بحثك الأخير";
    } else if (categoryScore > 0 && areaScore > 0) {
      recommendationReason = `يناسب تخصصك ومنطقتك (${craftsman.area})`;
    } else if (categoryScore > 0) {
      recommendationReason = "بناءً على تصفحك لهذا التخصص";
    } else if (areaScore > 0) {
      recommendationReason = `في منطقتك (${craftsman.area})`;
    } else if (craftsman.verified && popularity > 2) {
      recommendationReason = "موثّق والأكثر طلباً بالسويس";
    } else if (isRecent) {
      recommendationReason = "صنايعي جديد مميز في الدليل";
    }

    return {
      craftsman: { ...craftsman, recommendationReason },
      score: finalScore,
    };
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

/**
 * خوارزمية قسم «شاهد أيضاً» الذكي أسفل صفحة التفاصيل — ترتيب مترشحي نفس التخصص:
 * 1) التفاعل الحقيقي: الاتصال والواتساب بوزن 6 مقابل 1 للظهور («الأكثر تواصلاً»).
 * 2) دفعة قوية لمن شاهدهم المشاهدون معاً (co-engagement) — إشارة سلوكية شخصية.
 * 3) الصنايعي الموثّق كسر للتعادل، ثم الأحدث إضافة.
 * ويُستبعد الصنايعي نفسه، ويُقصّ الطول إلى `count`.
 */
export function rankRelatedCraftsmen(
  candidates: RecommendableCraftsman[],
  coViewedSlugs: ReadonlySet<string> | readonly string[],
  options: { count?: number; excludeId?: string } = {},
): RecommendableCraftsman[] {
  const { count = 6, excludeId } = options;
  const coViewed = new Set(coViewedSlugs);

  const scored = candidates
    .filter((craftsman) => craftsman.id !== excludeId)
    .map((craftsman) => {
      const stats = craftsman.stats ?? { views: 0, calls: 0, whatsapp: 0 };
      const popularity = Math.log1p(
        (stats.calls + stats.whatsapp) * 6 + stats.views,
      );
      const coBoost = coViewed.has(craftsman.slug) ? 3 : 0;
      const verifiedBoost = craftsman.verified ? 0.5 : 0;
      const recency =
        new Date(craftsman.addedAt).getTime() / 1_000_000_000_000_000;
      return {
        craftsman,
        score: popularity + coBoost + verifiedBoost + recency,
      };
    });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map(({ craftsman }) => craftsman);
}
