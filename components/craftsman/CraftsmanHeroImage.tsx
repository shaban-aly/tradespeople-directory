"use client";

import { useCallback, startTransition } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CraftsmanAvatar } from "@/components/shared/ui/CraftsmanAvatar";
import { ImageViewer } from "@/components/shared/ui/ImageViewer";
import { IconMaximize } from "@/components/shared/icons";

import type { AvatarPosition } from "@/lib/data/craftsmen";

interface CraftsmanHeroImageProps {
  image?: string | null;
  name: string;
  avatarPosition?: AvatarPosition | null;
}

export function CraftsmanHeroImage({ image, name, avatarPosition }: CraftsmanHeroImageProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const isOpen = Boolean(image) && searchParams?.get("image") === "view";

  const openViewer = useCallback(() => {
    if (!image) return;
    const current = new URLSearchParams(searchParams ? searchParams.toString() : "");
    current.set("image", "view");
    const search = current.toString();
    const query = search ? `?${search}` : "";
    startTransition(() => {
      router.push(`${pathname}${query}`, { scroll: false });
    });
  }, [image, pathname, router, searchParams]);

  const closeViewer = useCallback(() => {
    const current = new URLSearchParams(searchParams ? searchParams.toString() : "");
    current.delete("image");
    const search = current.toString();
    const query = search ? `?${search}` : "";
    startTransition(() => {
      router.push(`${pathname}${query}`, { scroll: false });
    });
  }, [pathname, router, searchParams]);

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
        onClick={openViewer}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openViewer();
          }
        }}
        aria-label={`معاينة وتكبير صورة ${name}`}
        className="group relative flex h-64 w-full cursor-pointer items-center justify-center overflow-hidden bg-neutral-900/90 sm:h-80 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
      >
        {/* خلفية ضبابية سينمائية محيطة بألوان الصورة الأصلية (Ambient Backdrop) */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <Image
            src={image}
            alt=""
            fill
            sizes="100vw"
            className="scale-125 object-cover opacity-40 blur-2xl filter"
          />
          <div className="absolute inset-0 bg-black/25 backdrop-blur-xs" />
        </div>

        {/* الصورة الرئيسية بإطار 4:3 مطابق تماماً لنسبة الكروت والمحرر */}
        <div className="relative flex h-full aspect-4/3 items-center justify-center overflow-hidden shadow-2xl">
          <Image
            src={image}
            alt={name}
            fill
            priority
            sizes="(min-width: 640px) 480px, 100vw"
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
        <div className="absolute bottom-3 start-3 z-10 flex items-center gap-1.5 rounded-xl bg-black/60 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-md transition-all duration-200 group-hover:bg-black/80 sm:text-sm">
          <IconMaximize className="h-4 w-4" />
          <span>اضغط لتكبير الصورة</span>
        </div>
      </div>

      <ImageViewer
        open={isOpen}
        onClose={closeViewer}
        src={image}
        title={name}
      />
    </>
  );
}
