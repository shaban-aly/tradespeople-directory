/**
 * lib/utils/image-loader.ts
 *
 * Custom Next.js image loader — تبادلي بين Supabase وVercel
 *
 * المنطق:
 * - صور Supabase Storage  → Supabase Image Transform (/render/image/public/) — مجاني تماماً
 * - صور Google Avatars    → تصغير عبر معامل `=sNNN-c` الخاص بـ Google
 * - أي صورة أخرى         → تُعرض بحجمها الأصلي (لا optimization)
 *
 * ⚠️ ملاحظة مهمة:
 *   عند استخدام loaderFile يُستدعى هذا الـ loader بدلاً من /_next/image — لا قبله ولا بعده.
 *   لذلك إعادة توجيه للـ /_next/image ستُسبب loop.
 *
 * كل منطق بناء روابط التحويل موجود في `lib/utils/image-transform.ts` (مصدر واحد
 * مشترك مع الكومبوننتس) — هذا الملف طبقة رقيقة فوقه.
 *
 * يُستخدم في next.config.mjs:
 *   images: { loaderFile: './lib/utils/image-loader.ts' }
 */

import {
  IMAGE_QUALITY,
  isGoogleImageUrl,
  isSupabaseImageUrl,
  splitImageAspectHint,
  supabaseTransformUrl,
} from "./image-transform";

/**
 * تصغير صور Google Avatars مباشرةً عبر URL parameter
 *
 * Google Avatars تدعم =sNNN-c لتحديد الحجم بالـ pixel.
 * نستخدم هذا بدلاً من تمريرها لـ /_next/image لتفادي استهلاك Vercel.
 *
 * من: .../a/ACg8oc...=s96-c
 * إلى: .../a/ACg8oc...=s200-c
 */
export function resizeGoogleAvatar(url: string, size: number): string {
  if (!url) return url;

  // نتأكد أن الرابط من Google قبل التعديل — إذا لم يكن Google نرجعه كما هو
  if (!isGoogleImageUrl(url)) return url;

  // نمط =sNNN-c الشائع في googleusercontent
  if (url.includes("=s") && url.includes("-c")) {
    return url.replace(/=s\d+-c/, `=s${size}-c`);
  }
  // نمط ?sz=NNN بديل
  if (url.includes("?sz=")) {
    return url.replace(/\?sz=\d+/, `?sz=${size}`);
  }
  // إذا لم يوجد parameter معروف — أضف =sNNN-c
  const [base] = url.split("?");
  return `${base}=s${size}-c`;
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
  // النسبة تصل مع الـ src عبر withImageAspect — لأنها لا تُمرَّر في واجهة الـ loader.
  const { cleanSrc, aspect } = splitImageAspectHint(src);

  if (isSupabaseImageUrl(cleanSrc)) {
    // الارتفاع = العرض ÷ نسبة الحاوية => `resize=cover` حقيقي على السيرفر.
    // بلا نسبة نطلب تصغيراً بالعرض فقط محتفظاً بنسبة الصورة الأصلية.
    const height = aspect ? Math.max(1, Math.round(width / aspect)) : undefined;
    return (
      supabaseTransformUrl(cleanSrc, {
        width,
        height,
        quality: quality ?? IMAGE_QUALITY,
      }) ?? cleanSrc
    );
  }

  if (isGoogleImageUrl(cleanSrc)) {
    // العرض القادم من srcset مضروب أصلاً في كثافة البكسل — نمرّره كما هو.
    return resizeGoogleAvatar(cleanSrc, width);
  }

  // صور خارجية أخرى — نرجع الرابط النظيف كما هو
  // لأن إعادة توجيهها لـ /_next/image داخل loaderFile سيُسبب loop.
  return cleanSrc;
}