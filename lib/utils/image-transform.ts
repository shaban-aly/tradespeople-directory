/**
 * lib/utils/image-transform.ts
 *
 * المصدر الوحيدلبناء روابط صور Supabase المحوّلة (Supabase Image Transformations)
 * ومقاسات التحميل (`sizes`) لكل حاوية صورة في الواجهة.
 *
 * لماذا هذا الملف؟
 * - لا تكرار في بناء الـ URL: كل كومبوننت يستدعي دالة من هنا.
 * - الصور الأصلية في Storage لا تُلمس إطلاقاً — التحويل يحدث عند الطلب فقط
 *   عبر `/storage/v1/render/image/public/...`، فالأصل يبقى كما هو.
 * - الـ loader في `lib/utils/image-loader.ts` يستقبل من Next.js العرض فقط
 *   (`width`) ولا يستقبل `height`، لذلك نمرّر نسبة أبعاد الحاوية كـ "تلميح"
 *   داخل الـ `src` عبر `withImageAspect`، فيحسب الـ loader الارتفاع ويطلب
 *   `resize=cover` — أي قصّ على السيرفر بدل تحميل الصورة كاملة وقصّها في المتصفح.
 *
 * مثال على الناتج:
 *   الأصل:   .../storage/v1/object/public/craftsman-images/craftsmen/<id>/<file>.webp
 *   المحول:  .../storage/v1/render/image/public/craftsman-images/craftsmen/<id>/<file>.webp
 *              ?width=320&height=240&resize=cover&quality=80&format=webp
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const OBJECT_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/`;
const RENDER_PREFIX = `${SUPABASE_URL}/storage/v1/render/image/public/`;

/** الجودة الموحّدة لكل صور الدليل — 80 توازن بين الوضوح والحجم (النطاق المقترح 75–85) */
export const IMAGE_QUALITY = 80;

/**
 * بارامتر "تلميح" نسبة الأبعاد (width / height) لحاوية الصورة.
 * يقرأه الـ loader فقط ويُزيله قبل إرسال الطلب لـ Supabase، فلا يصل有任何
 * بارامتر غريب لملف صورة.
 */
export const ASPECT_HINT_PARAM = "__ar";

/** نِسب الأبعاد المستخدمة فعلياً في الواجهة */
export const IMAGE_ASPECT = {
  /** كروت الصنايعية + صورة البروفايل + معاينة الطلب: 4:3 */
  CARD: 4 / 3,
  /** الأفاتارات المصغّرة (جداول، قائمة جانبية، نتائج البحث): 1:1 */
  SQUARE: 1,
} as const;

/**
 * مقاسات `next/image` لكل نوع حاوية — تطابق أبعاد الكارت على كل مقاس شاشة
 * بدل رقم واحد ضخم لكل الحالات.
 *
 * كارت الصنايعية = عرض الكارت × 4/3، والكروت كلها داخل `max-w-5xl px-4`:
 * - جريد (CraftsmanGrid): عمودان < 640px، 3 أعمدة ≤ 1023px، 4 أعمدة بعد ذلك.
 * - كاروسيل (الرئيسية/المقترحات): `w-[72vw] max-w-65` أي 72vw بحد أقصى 260px،
 *   ثم عمودان 768–1023px، ثم 4 أعمدة بعد 1024px.
 */
export const IMAGE_SIZES = {
  /** كارت الصنايعية داخل الجريد (2/3/4 أعمدة) */
  CARD: "(max-width: 639px) 44vw, (max-width: 1023px) 31vw, (max-width: 1279px) 24vw, 240px",
  /** كارت الصنايعية داخل الكاروسيل الأفقي */
  CARD_CAROUSEL:
    "(max-width: 639px) 72vw, (max-width: 767px) 240px, (max-width: 1023px) 48vw, (max-width: 1279px) 24vw, 240px",
  /** صورة البروفايل (4:3 داخل حاوية `h-64 sm:h-80`) */
  HERO: "(max-width: 639px) 342px, 428px",
} as const;

export type ResizeMode = "cover" | "contain" | "fill";

export interface TransformOptions {
  width: number;
  /** بدون height نطلب تصغيراً بالعرض فقط مع الحفاظ على النسبة الأصلية */
  height?: number;
  resize?: ResizeMode;
  quality?: number;
  /** `origin` = اترك الصيغة كما هي (للصور خارج Supabase أو عند الحاجة للأصل) */
  format?: "webp" | "origin";
}

/** هل الرابط صورة من Supabase Storage (bucket عام)؟ */
export function isSupabaseImageUrl(
  src: string | null | undefined,
): src is string {
  return Boolean(SUPABASE_URL) && typeof src === "string" && src.startsWith(OBJECT_PREFIX);
}

/** استخراج مسار الملف داخل الـ bucket من رابط object العام */
export function supabaseImagePath(
  src: string | null | undefined,
): string | null {
  if (!isSupabaseImageUrl(src)) return null;
  const path = src.slice(OBJECT_PREFIX.length).split("?")[0];
  return path || null;
}

/**
 * تطبيع مسار الملف قبل إرساله لـ endpoint التحويل:
 * أسماء الملفات المرفوعة قد تحتوي مسافات أو حروفاً غير لاتينية، ونفس الرابط
 * قد يكون مُرمّزاً مسبقاً — `encodeURI(decodeURI(seg))` يضمن ترميزاً واحداً فقط.
 */
function normalizeImagePath(path: string): string {
  return path
    .split("/")
    .map((segment) => {
      try {
        return encodeURI(decodeURI(segment));
      } catch {
        return segment;
      }
    })
    .join("/");
}

/**
 * بناء رابط الصورة المحوّلة من رابط Supabase Storage الأصلي.
 * يعيد `null` إذا لم يكن الرابط من Supabase (لا نفترض ولا نغيّر المسارات).
 */
export function supabaseTransformUrl(
  src: string | null | undefined,
  options: TransformOptions,
): string | null {
  const path = supabaseImagePath(src);
  if (!path) return null;

  const width = Math.max(1, Math.round(options.width));
  const params = new URLSearchParams();
  params.set("width", String(width));

  if (options.height && options.height > 0) {
    const height = Math.max(1, Math.round(options.height));
    params.set("height", String(height));
    // `cover` يقصّ على السيرفر ليملأ الحاوية تماماً => بايتات أقل + لا قصّ في المتصفح.
    params.set("resize", options.resize ?? "cover");
  }

  params.set("quality", String(options.quality ?? IMAGE_QUALITY));
  if (options.format !== "origin") params.set("format", "webp");

  return `${RENDER_PREFIX}${normalizeImagePath(path)}?${params.toString()}`;
}

/**
 * رابط مصغّر جداً (بضع عشرات من البكسل) يُستخدم كخلفية ضبابية/زخرفية.
 * الغرض: لا نحمّل الصورة الأصلية لمجرد طمسها خلف الصورة الحقيقية.
 */
export function supabaseBlurUrl(
  src: string | null | undefined,
  width = 32,
): string | null {
  return supabaseTransformUrl(src, { width, quality: 30 });
}

/** هل الرابط من Google (أفاتار مستخدم)؟ */
export function isGoogleImageUrl(src: string | null | undefined): boolean {
  if (typeof src !== "string") return false;
  return src.includes("googleusercontent.com") || src.includes("ggpht.com");
}

/**
 * إضافة تلميح نسبة الأبعاد إلى `src` ليصل إلى الـ loader.
 * لا تفعل شيئاً لغير صور Supabase (روابط محلية، blob، أفاتارات Google).
 */
export function withImageAspect(
  src: string | null | undefined,
  aspect: number,
): string {
  if (!src || !isSupabaseImageUrl(src) || !Number.isFinite(aspect) || aspect <= 0) {
    return src ?? "";
  }
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}${ASPECT_HINT_PARAM}=${aspect}`;
}

/**
 * فصل تلميح نسبة الأبعاد عن الرابط: تعيد الرابط النظيف + النسبة (إن وُجدت).
 * الرابط النظيف هو ما يُرسل فعلياً إلى Supabase.
 */
export function splitImageAspectHint(src: string): {
  cleanSrc: string;
  aspect: number | null;
} {
  const queryIndex = src.indexOf("?");
  if (queryIndex === -1) return { cleanSrc: src, aspect: null };

  const base = src.slice(0, queryIndex);
  const params = new URLSearchParams(src.slice(queryIndex + 1));
  const raw = params.get(ASPECT_HINT_PARAM);
  params.delete(ASPECT_HINT_PARAM);

  const parsed = raw === null ? Number.NaN : Number(raw);
  const aspect = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  const query = params.toString();
  return { cleanSrc: query ? `${base}?${query}` : base, aspect };
}