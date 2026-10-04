/**
 * lib/utils/image-loader.ts
 *
 * Custom Next.js image loader — تبادلي بين Supabase وVercel
 *
 * المنطق:
 * - صور Supabase Storage  → Supabase Image Transform (/render/image/public/) — مجاني تماماً
 * - صور خارجية أخرى      → تُعرض بحجمها الأصلي (لا optimization) مع كاش المتصفح فقط
 *
 * ⚠️ ملاحظة مهمة:
 *   عند استخدام loaderFile يُستدعى هذا الـ loader بدلاً من /_next/image — لا قبله ولا بعده.
 *   لذلك إعادة توجيه للـ /_next/image ستُسبب loop. الصور الخارجية (Google avatars) ترجع كما هي.
 *
 * يُستخدم في next.config.mjs:
 *   images: { loaderFile: './lib/utils/image-loader.ts' }
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_STORAGE_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/`;
const SUPABASE_TRANSFORM_PREFIX = `${SUPABASE_URL}/storage/v1/render/image/public/`;

/**
 * هل الرابط من Supabase Storage؟
 */
function isSupabaseStorageUrl(src: string): boolean {
  // نتأكد أن SUPABASE_URL موجود لتجنب false positives
  return Boolean(SUPABASE_URL) && src.startsWith(SUPABASE_STORAGE_PREFIX);
}

/**
 * حوّل رابط Supabase Storage العام إلى رابط Supabase Image Transform
 *
 * من: .../storage/v1/object/public/craftsman-images/craftsmen/abc.webp
 * إلى: .../storage/v1/render/image/public/craftsman-images/craftsmen/abc.webp?width=400&quality=80&format=webp
 */
function toSupabaseTransformUrl(src: string, width: number, quality: number): string {
  // احذف query string موجود على الرابط الأصلي إن وجد
  const [base] = src.split("?");
  const path = base.replace(SUPABASE_STORAGE_PREFIX, "");
  const params = new URLSearchParams({
    width: String(width),
    quality: String(quality),
    resize: "cover",
    format: "webp",
  });
  return `${SUPABASE_TRANSFORM_PREFIX}${path}?${params.toString()}`;
}

/**
 * الـ loader المُصدَّر — يُستدعى من Next.js لكل <Image>
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const q = quality ?? 80;

  if (isSupabaseStorageUrl(src)) {
    // ✅ Supabase Transform — مجاني ومباشر، يُرجع WebP بالحجم المطلوب
    return toSupabaseTransformUrl(src, width, q);
  }

  // 🟡 صور خارجية (Google avatars، إلخ) — نرجع الرابط الأصلي كما هو
  // لأن إعادة توجيهها لـ /_next/image داخل loaderFile سيُسبب loop
  // هذه الصور نادرة في المشروع (فقط أفاتار حساب المستخدم)
  return src;
}
