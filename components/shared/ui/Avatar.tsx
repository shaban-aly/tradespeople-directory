"use client";

import { useState } from "react";
import imageLoader from "@/lib/utils/image-loader";
import { IMAGE_ASPECT, withImageAspect } from "@/lib/utils/image-transform";

interface AvatarProps {
  /** رابط الصورة (Supabase Storage أو أفاتار OAuth) — NULL ⇒ الحرف الأول. */
  url: string | null | undefined;
  /** الاسم: مصدر النص البديل والحرف الأول. */
  name: string;
  /** ضلع المربع بالبكسل (الطلب يُجلب بضعف المقاس لشاشات retina). */
  size?: number;
  /** أنماط الحاوية — الشكل (`rounded-xl` / `rounded-full`) من المستدعي. */
  className?: string;
}

/**
 * أفاتار مستخدم/صنايعي بمقاس ثابت.
 *
 * لماذا `<img>` عادي بدل `next/image`؟
 * 1) أفاتارات `lh3.googleusercontent.com` تُقاس بالـ URL نفسه (`=sNNN-c`)، و
 *    `next/image` يولّد srcset بكل المقاسات ⇒ عناوين كثيرة مختلفة لنفس الصورة،
 *    فتضيع فائدة الكاش ويردّ Google **429 Too Many Requests**.
 * 2) `referrerPolicy="no-referrer"` مطلوب لنفس الـ CDN، وهو ما يفعله
 *    `components/admin/users/UserAvatar.tsx` الذي يعمل بلا 429.
 *
 * ولماذا لا `SafeImage`؟ لأن بديله عند الفشل أيقونة الموقع — في مكان صورة شخص
 * المطلوب الحرف الأول لا شعار الدليل.
 *
 * بناء الرابط يمرّ بـ`imageLoader` نفسه (مصدر واحد): Supabase ⇒ transform،
 * Google ⇒ `=sNNN-c`، وغيرهما ⇒ كما هو.
 */
/**
 * سلال مقاسات الأفاتار.
 *
 * كل مقاس مختلف = رابط مختلف عند Google (`=sNNN-c`) ⇒ طلب جديد بلا كاش.
 * تثبيت الطلب على سلة واحدة يجعل نفس المستخدم في الهيدر وقائمة التقييمات
 * وسجل النشاط يشترك في **رابط واحد**، وهو ما يخفّض فرص الـ429.
 */
const AVATAR_BUCKETS = [48, 96, 128, 192, 256] as const;

function bucketFor(px: number): number {
  return AVATAR_BUCKETS.find((bucket) => bucket >= px) ?? 256;
}

export function Avatar({ url, name, size = 44, className = "" }: AvatarProps) {
  // نخزّن الرابط الفاشل لا مجرد boolean: تغيّر الرابط يعيد المحاولة تلقائياً
  // بلا useEffect ولا حالة قديمة عالقة.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const initial = name.trim().charAt(0);
  const hasImage = Boolean(url) && failedUrl !== url;

  if (!hasImage || !url) {
    return (
      <div
        className={`flex shrink-0 select-none items-center justify-center bg-accent/10 font-heading font-bold text-accent ${className}`}
        style={{ width: size, height: size }}
        role="img"
        aria-label={name}
      >
        {initial}
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageLoader({
          src: withImageAspect(url, IMAGE_ASPECT.SQUARE),
          width: bucketFor(size * 2),
        })}
        alt={name}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover"
        onError={() => setFailedUrl(url)}
      />
    </div>
  );
}
