import type { CraftsmanSort } from "../data/craftsmen";
import { toArabicDigits } from "../utils/format";
import { categoryHref, craftsmanHref, searchHref } from "../utils/url";

export type SearchResultKind = "craftsman" | "category" | "area";

export type SearchSuggestion = {
  kind: SearchResultKind;
  name: string;
  subtitle: string;
  href: string;
  image?: string;
  icon?: string;
  verified?: boolean;
};

export type SearchFilters = {
  category?: string;
  area?: string;
  sort?: CraftsmanSort;
};

export type SearchHighlightPart = {
  text: string;
  isMatch: boolean;
};

function normalizeChar(char: string): string {
  return char
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[\u0621-\u0623\u0625]/g, "\u0627")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0649/g, "\u064A")
    .toLowerCase();
}

/**
 * تقسيم النص إلى أجزاء مع تحديد الجزء المطابق للاستعلام
 * حتى يُلوَّن بلون الأكسن في نتائج البحث.
 */
export function highlightQuery(
  text: string,
  query: string,
): SearchHighlightPart[] {
  const q = normalizeArabic(query);
  if (!q) return [{ text, isMatch: false }];

  const norm: string[] = [];
  const origIndices: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "\uFEFB" || char === "\uFEFC") {
      norm.push("ل", "ا");
      origIndices.push(i, i);
      continue;
    }
    const normalized = normalizeChar(char);
    if (!normalized) continue;
    norm.push(normalized);
    origIndices.push(i);
  }

  const start = norm.join("").indexOf(q);
  if (start === -1) return [{ text, isMatch: false }];
  const end = start + q.length;
  const firstOrig = origIndices[start];
  const lastOrig = origIndices[end - 1];

  const parts: SearchHighlightPart[] = [];
  if (firstOrig > 0) {
    parts.push({ text: text.slice(0, firstOrig), isMatch: false });
  }
  parts.push({ text: text.slice(firstOrig, lastOrig + 1), isMatch: true });
  if (lastOrig + 1 < text.length) {
    parts.push({ text: text.slice(lastOrig + 1), isMatch: false });
  }
  return parts;
}

/** توحيد أشكال الأحرف العربية لتحسين المطابقة (أ/إ/آ/ء ← ا، ة ← ه، ى ← ي). */
export function normalizeArabic(input: string): string {
  return input
    .replace(/[\u064B-\u0652\u0670]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[\u0621-\u0623\u0625]/g, "\u0627")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0649/g, "\u064A")
    .replace(/\uFEFF/g, "")
    .replace(/\uFEFB|\uFEFC/g, "\u0644\u0627")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** هل الاستعلام مطابق لأحد الحقول (مع التطبيع العربي)؟ */
export function matchesQuery(
  query: string,
  ...fields: Array<string | null | undefined>
): boolean {
  const q = normalizeArabic(query);
  if (!q) return false;
  const qWords = q.split(/\s+/).filter(Boolean);
  return fields.some((raw) => {
    const t = normalizeArabic(raw ?? "");
    if (!t) return false;
    if (t.includes(q)) return true;
    return qWords.length > 1 && qWords.every((word) => t.includes(word));
  });
}

/** درجة مطابقة للترتيب: تطابق تام > بداية > جزء > كلمات متفرقة. */
export function matchScore(query: string, text: string): number {
  const q = normalizeArabic(query);
  const t = normalizeArabic(text);
  if (!q || !t) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  const qWords = q.split(/\s+/).filter(Boolean);
  if (qWords.length > 1) {
    const matched = qWords.filter((word) => t.includes(word)).length;
    if (matched > 0) return 10 + Math.round((matched / qWords.length) * 30);
  }
  return 0;
}

/**
 * البيانات المصغّرة اللازمة لبناء الاقتراحات داخل المتصفح (بدون الأوصاف)
 * حتى لا يُستدعى السيرفر لكل ضغطة حرف.
 */
export type SearchData = {
  categories: { slug: string; name: string; icon: string; count: number }[];
  areas: string[];
  craftsmen: {
    name: string;
    slug: string;
    category: string;
    area: string;
    image: string;
    verified: boolean;
  }[];
};

/** بناء اقتراحات البحث من بيانات مصغّرة (يعمل على السيرفر والمتصفح معاً). */
export function buildSuggestions(data: SearchData, rawQuery: string): SearchSuggestion[] {
  const q = normalizeArabic(rawQuery);
  if (q.length < 2) return [];

  const suggestions: SearchSuggestion[] = [];

  const categoryMatches = data.categories
    .map((category) => ({ category, score: matchScore(q, category.name) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);

  for (const { category } of categoryMatches.slice(0, 3)) {
    suggestions.push({
      kind: "category",
      name: category.name,
      subtitle: `${toArabicDigits(category.count)} ${
        category.count === 1 ? "صنايعي" : "صنايعية"
      }`,
      href: categoryHref(category.slug),
      icon: category.icon,
    });
  }

  const areaMatches = data.areas
    .map((area) => ({ area, score: matchScore(q, area) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);

  for (const { area } of areaMatches.slice(0, 3)) {
    suggestions.push({
      kind: "area",
      name: area,
      subtitle: "بحث في المنطقة",
      href: searchHref({ area }),
    });
  }

  const craftsmanMatches = data.craftsmen
    .map((craftsman) => ({
      craftsman,
      score: Math.max(
        matchScore(q, craftsman.name),
        matchScore(q, craftsman.category),
        matchScore(q, craftsman.area),
      ),
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);

  for (const { craftsman } of craftsmanMatches.slice(0, 5)) {
    suggestions.push({
      kind: "craftsman",
      name: craftsman.name,
      subtitle: `${craftsman.category} · ${craftsman.area}`,
      href: craftsmanHref(craftsman.slug),
      image: craftsman.image || undefined,
      verified: craftsman.verified,
    });
  }

  return suggestions;
}
