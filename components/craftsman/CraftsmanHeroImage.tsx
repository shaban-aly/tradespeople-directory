"use client";

import { useState } from "react";
import { SafeImage as Image } from "@/components/shared/ui/SafeImage";
import { CraftsmanAvatar } from "@/components/shared/ui/CraftsmanAvatar";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { IconMaximize } from "@/components/shared/icons";

import type { AvatarPosition } from "@/lib/data/craftsmen";
import {
  IMAGE_ASPECT,
  IMAGE_SIZES,
  supabaseBlurUrl,
  withImageAspect,
} from "@/lib/utils/image-transform";

interface CraftsmanHeroImageProps {
  image?: string | null;
  name: string;
  avatarPosition?: AvatarPosition | null;
}

export function CraftsmanHeroImage({
  image,
  name,
  avatarPosition,
}: CraftsmanHeroImageProps) {
  // حالة المشاهد محلية بالـ state لا مرتبطة بالـ URL — الصفحة ستاتيك
  // (generateStaticParams)، وربط الفتح بـ ?image=view يجعل Next.js يعيد
  // تثبيت الـ query القديمة من الـ route cache عند router.replace على مسار
  // نظيف، فيبقى المشاهد مفتوحاً بعد الإغلاق.
  const [isOpen, setIsOpen] = useState(false);

  if (!image) {
    return (
      <div className="flex h-44 items-center justify-center bg-linear-to-br from-accent/10 via-card to-accent/10 sm:h-52">
        <CraftsmanAvatar
          name={name}
          className="h-24 w-24 rounded-2xl shadow-card sm:h-28 sm:w-28"
          textClassName="text-4xl sm:text-5xl"
        />
      </div>
    );
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        aria-label={`معاينة وتكبير صورة ${name}`}
        className="group relative flex h-64 w-full cursor-pointer items-center justify-center overflow-hidden bg-neutral-900/90 sm:h-80 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
      >
        {/* خلفية ضبابية سينمائية — نسخة مصغّرة جداً (32px) عبر Supabase Transformations
            حتى لا ننزّل الصورة الأصلية لمجرد طمسها، مع رابط احتياطي لروابط
            غير Supabase (blob أو روابط خارجية). */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={supabaseBlurUrl(image) ?? image}
            alt=""
            className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl filter"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-black/25 backdrop-blur-xs" />
        </div>

        {/* الصورة الرئيسية بإطار 4:3 مطابق تماماً لنسبة الكروت والمحرر */}
        <div className="relative flex h-full aspect-4/3 items-center justify-center overflow-hidden shadow-2xl">
          <Image
            src={withImageAspect(image, IMAGE_ASPECT.CARD)}
            alt={name}
            fill
            priority
            sizes={IMAGE_SIZES.HERO}
            className="object-cover transition-transform duration-300 group-hover:scale-102"
            style={{
              objectPosition: `${avatarPosition?.x ?? 50}% ${avatarPosition?.y ?? 50}%`,
              transform:
                (avatarPosition?.zoom ?? 1) > 1
                  ? `scale(${avatarPosition?.zoom})`
                  : undefined,
              transformOrigin: `${avatarPosition?.x ?? 50}% ${avatarPosition?.y ?? 50}%`,
            }}
          />
          <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
        </div>

        {/* شارة التكبير بالحجم الكامل */}
        <div className="absolute bottom-3 inset-s-3 z-10 flex items-center gap-1.5 rounded-xl bg-black/60 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-md transition-all duration-200 group-hover:bg-black/80 sm:text-sm">
          <IconMaximize className="h-4 w-4" />
          <span>اضغط لتكبير الصورة</span>
        </div>
      </div>

      <ImageViewer
        open={isOpen}
        onClose={() => setIsOpen(false)}
        src={image}
        title={name}
      />
    </>
  );
}
