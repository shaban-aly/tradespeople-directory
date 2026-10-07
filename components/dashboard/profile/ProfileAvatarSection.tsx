"use client";

import type { RefObject } from "react";
import { SafeImage as Image } from "@/components/shared/ui/SafeImage";
import { CraftsmanAvatar } from "@/components/shared/ui/CraftsmanAvatar";
import { ImagePositionEditor } from "@/components/dashboard/ImagePositionEditor";
import {
  IconCamera,
  IconCrop,
  IconMaximize,
} from "@/components/shared/icons";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/storage/images";
import type { AvatarPosition } from "@/lib/data/craftsmen";
import type { CraftsmanSelfProfile } from "@/lib/db/craftsman-dashboard";
import {
  IMAGE_ASPECT,
  supabaseBlurUrl,
  withImageAspect,
} from "@/lib/utils/image-transform";

interface ProfileAvatarSectionProps {
  profile: CraftsmanSelfProfile;
  name: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  currentAvatarUrl: string | null;
  currentAvatarPos: AvatarPosition | null;
  selectedNewFile: File | null;
  avatarError: string | null;
  isPositionEditorOpen: boolean;
  onFilePicked: (file: File) => void;
  onOpenViewer: () => void;
  onTogglePositionEditor: () => void;
  onPositionSaved: (result: { imageUrl: string | null; position: AvatarPosition }) => void;
  onPositionClosed: () => void;
}

export function ProfileAvatarSection({
  profile,
  name,
  fileInputRef,
  currentAvatarUrl,
  currentAvatarPos,
  selectedNewFile,
  avatarError,
  isPositionEditorOpen,
  onFilePicked,
  onOpenViewer,
  onTogglePositionEditor,
  onPositionSaved,
  onPositionClosed,
}: ProfileAvatarSectionProps) {
  const isEditing = isPositionEditorOpen && Boolean(selectedNewFile || currentAvatarUrl);

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs">
      {/* رأس الكارت التفاعلي — يتغير عنوانه بحسب الوضع */}
      <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
            {isEditing ? <IconCrop className="h-4 w-4" /> : <IconCamera className="h-4 w-4" />}
          </span>
          <h2 className="font-heading text-base sm:text-lg font-bold text-foreground">
            {isEditing
              ? selectedNewFile
                ? "تنسيق وضبط الصورة الجديدة"
                : "تنسيق وموضع الصورة"
              : "الصورة الشخصية وصورة العمل"}
          </h2>
        </div>
        <span className="text-xs text-muted font-medium">
          {isEditing
            ? "اسحب للتحريك واستخدم شريط التكبير"
            : "نسبة العرض 4:3 مطابقة للدليل"}
        </span>
      </div>

      {avatarError && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-600"
        >
          {avatarError}
        </div>
      )}

      {/* مدخل اختيار الملف المخفي */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFilePicked(file);
          e.target.value = "";
        }}
      />

      {isEditing ? (
        /* الوضع الثاني: المحرر المدمج في نفس الكارت */
        <ImagePositionEditor
          craftsmanId={profile.id}
          slug={profile.slug}
          imageFile={selectedNewFile}
          imageUrl={currentAvatarUrl}
          initialPosition={currentAvatarPos}
          onSaved={onPositionSaved}
          onClose={onPositionClosed}
        />
      ) : (
        /* الوضع الأول: وضع العرض الطبيعي بإطار 4:3 مطابق تماماً لكروت الموقع والدليل */
        <div className="flex flex-col gap-4">
          <div
            role="button"
            tabIndex={currentAvatarUrl ? 0 : -1}
            onClick={() => {
              if (currentAvatarUrl) onOpenViewer();
            }}
            onKeyDown={(e) => {
              if (currentAvatarUrl && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onOpenViewer();
              }
            }}
            aria-label={currentAvatarUrl ? "معاينة وتكبير الصورة بحجم كامل" : "صورة الملف الشخصي"}
            className={`group relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-2xl bg-neutral-900/90 border border-border/80 shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent ${
              currentAvatarUrl ? "cursor-pointer" : "cursor-default"
            }`}
          >
            {currentAvatarUrl ? (
              <>
                {/* خلفية ضبابية سينمائية عبر Supabase Transformations */}
                <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={supabaseBlurUrl(currentAvatarUrl) ?? currentAvatarUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl filter"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-black/25 backdrop-blur-xs" />
                </div>

                {/* الصورة الرئيسية بإطار 4:3 مطابق للموقع والدليل مع الإحداثيات والتقريب */}
                <div className="relative flex h-full aspect-4/3 items-center justify-center overflow-hidden shadow-2xl">
                  <Image
                    src={withImageAspect(currentAvatarUrl, IMAGE_ASPECT.CARD)}
                    alt={name || profile.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    className="object-cover transition-transform duration-300 group-hover:scale-102"
                    style={{
                      objectPosition: `${currentAvatarPos?.x ?? 50}% ${currentAvatarPos?.y ?? 50}%`,
                      transform:
                        (currentAvatarPos?.zoom ?? 1) > 1
                          ? `scale(${currentAvatarPos?.zoom})`
                          : undefined,
                      transformOrigin: `${currentAvatarPos?.x ?? 50}% ${currentAvatarPos?.y ?? 50}%`,
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
                </div>

                {/* شارة التكبير السفلية بالحجم الكامل */}
                <div className="absolute bottom-3 inset-s-3 z-10 flex items-center gap-1.5 rounded-xl bg-black/60 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-md transition-all duration-200 group-hover:bg-black/80">
                  <IconMaximize className="h-4 w-4" />
                  <span>اضغط لمعاينة الصورة مكبرة</span>
                </div>
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-linear-to-br from-accent/10 via-card to-accent/10 p-6 text-center">
                <CraftsmanAvatar
                  name={name || profile.name}
                  className="h-20 w-20 rounded-2xl shadow-card"
                  textClassName="text-3xl"
                />
                <p className="text-xs sm:text-sm font-semibold text-muted">
                  لم تقم برفع صورة شخصية أو صورة لعملك بعد
                </p>
              </div>
            )}
          </div>

          {/* شريط الإجراءات أسفل الصورة مباشرة */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <p className="text-xs text-muted max-w-sm leading-relaxed">
              صورة واضحة في ورشتك أو لموقع العمل تزيد من اتصالات العملاء بنسبة 40% وتمنح بروفايلك مصداقية أعلى.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-2 text-xs sm:text-sm font-bold text-foreground transition-all hover:bg-card hover:border-accent active:scale-98"
              >
                <IconCamera className="h-4 w-4 text-accent" />
                <span>{currentAvatarUrl ? "تغيير الصورة" : "رفع صورة"}</span>
              </button>

              {currentAvatarUrl && (
                <button
                  type="button"
                  onClick={onTogglePositionEditor}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent/10 border border-accent/30 px-3.5 py-2 text-xs sm:text-sm font-bold text-accent transition-all hover:bg-accent/20 active:scale-98"
                  title="تنسيق وتوسيط إطار الصورة"
                >
                  <IconCrop className="h-4 w-4" />
                  <span>تنسيق وموضع الصورة</span>
                </button>
              )}

              {currentAvatarUrl && (
                <button
                  type="button"
                  onClick={onOpenViewer}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border/80 px-3 py-2 text-xs sm:text-sm font-medium text-muted hover:bg-card hover:text-foreground active:scale-98"
                  title="معاينة وتكبير الصورة بحجم كامل"
                >
                  <IconMaximize className="h-4 w-4" />
                  <span>معاينة مكبرة</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
