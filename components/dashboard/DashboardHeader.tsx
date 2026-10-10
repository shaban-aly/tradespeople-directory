"use client";

import { type ReactNode } from "react";
import { SafeImage as Image } from "@/components/shared/ui/SafeImage";
import { CraftsmanAvatar } from "@/components/shared/ui/CraftsmanAvatar";
import { VerifiedBadge } from "@/components/shared/ui/VerifiedBadge";
import { ButtonLink } from "@/components/shared/ui/Button";
import {
  IconCamera,
  IconCrop,
  IconExternalLink,
  IconMaximize,
} from "@/components/shared/icons";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { Modal } from "@/components/shared/ui/Modal";
import { ImagePositionEditor } from "@/components/dashboard/ImagePositionEditor";
import { useProfileAvatarEditor } from "@/hooks/dashboard/useProfileAvatarEditor";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/storage/images";
import { craftsmanHref } from "@/lib/utils/url";
import { ShareProfileButton } from "@/components/dashboard/ShareProfileButton";
import type { CraftsmanSelfProfile } from "@/lib/db/craftsman-dashboard";
import {
  IMAGE_ASPECT,
  supabaseBlurUrl,
  withImageAspect,
} from "@/lib/utils/image-transform";

interface DashboardHeaderProps {
  profile: CraftsmanSelfProfile;
  /** عنصر إضافي في نهاية السطر (مبدّل الملفات) — اختياري. */
  action?: ReactNode;
  /** تفعيل أزرار تحرير الصورة الشخصية وفتح مودال القص (لصفحة تعديل الملف المهني) */
  editable?: boolean;
}

/**
 * كارت صورة الفني وهوية العمل الكبير المدمج (Showcase & Photo Card):
 * - صورة كبيرة بارزة بنسبة 4:3 مع خلفية ضبابية سينمائية مطابقة لتصميم التطبيق.
 * - دعم تحرير الصورة وفتح مودال القص وتنسيق الموضع (ImagePositionEditor Modal) في وضع التعديل.
 * - دعم المعاينة والتكبير عبر عارض الصور المعتمد في التطبيق (ImageViewer).
 * - تفاصيل الهوية الكاملة: الاسم، التخصص، المنطقة، حالة النشر.
 * - أزرار المعاينة المباشرة والمشاركة.
 */
export function DashboardHeader({
  profile,
  action,
  editable = false,
}: DashboardHeaderProps) {
  const {
    fileInputRef,
    currentAvatarUrl,
    currentAvatarPos,
    selectedNewFile,
    avatarError,
    isPositionEditorOpen,
    showViewer,
    handleFilePicked,
    handleOpenViewer,
    handleCloseViewer,
    openPositionEditor,
    handlePositionSaved,
    handlePositionClosed,
  } = useProfileAvatarEditor(profile);

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
        {/* مبدل الحسابات إن وجد */}
        {action && (
          <div className="mb-3.5 flex items-center justify-end">
            {action}
          </div>
        )}

        {/* عنوان كارت إدارة الصورة في وضع التعديل */}
        {editable && (
          <div className="mb-3.5 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-base sm:text-lg font-black text-foreground">
                صورة الملف المهني
              </h2>
              <p className="text-xs text-muted mt-0.5">
                تظهر في كارت البحث وصفحتك الشخصية في الدليل
              </p>
            </div>
            {currentAvatarUrl && (
              <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent border border-accent/20">
                نسبة 4:3
              </span>
            )}
          </div>
        )}

        {/* مدخل اختيار الملف المخفي لوضع التعديل */}
        {editable && (
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFilePicked(file);
              e.target.value = "";
            }}
          />
        )}

        {/* 1. كارت الصورة الكبير وهوية المعاينة الحية */}
        <div
          role="button"
          tabIndex={currentAvatarUrl ? 0 : -1}
          onClick={() => {
            if (currentAvatarUrl && !editable) handleOpenViewer();
          }}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && currentAvatarUrl && !editable) {
              e.preventDefault();
              handleOpenViewer();
            }
          }}
          className={`group relative flex aspect-4/3 w-full max-w-xl mx-auto items-center justify-center overflow-hidden rounded-2xl bg-neutral-900/90 border border-border/80 shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent isolate ${
            currentAvatarUrl && !editable ? "cursor-pointer" : "cursor-default"
          }`}
          aria-label={
            currentAvatarUrl
              ? `معاينة وتكبير صورة ${profile.name}`
              : "صورة الملف الشخصي"
          }
        >
          {currentAvatarUrl ? (
            <>
              {/* خلفية ضبابية سينمائية عبر Supabase Transformations مطابقة للدليل */}
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

              {/* الصورة الرئيسية بإطار 4:3 مطابق تماماً لنسبة الكروت والمحرر */}
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                <Image
                  src={withImageAspect(currentAvatarUrl, IMAGE_ASPECT.CARD)}
                  alt={profile.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
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

              {/* أزرار التحكم في الصورة: وضع التحرير مقابل وضع العرض العام */}
              {editable ? (
                <div className="absolute bottom-3 inset-x-3 z-2 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-black/75 hover:bg-black/90 px-3 py-1.5 text-xs font-bold text-white shadow-md backdrop-blur-md transition-all active:scale-95"
                      title="رفع صورة جديدة"
                    >
                      <IconCamera className="h-3.5 w-3.5 text-accent" />
                      <span>تغيير</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPositionEditor();
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-black/75 hover:bg-black/90 px-3 py-1.5 text-xs font-bold text-white shadow-md backdrop-blur-md transition-all active:scale-95"
                      title="تنسيق وتوسيط إطار الصورة"
                    >
                      <IconCrop className="h-3.5 w-3.5 text-accent" />
                      <span>تنسيق وموضع</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenViewer();
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-black/75 hover:bg-black/90 px-2.5 py-1.5 text-xs font-bold text-white shadow-md backdrop-blur-md transition-all active:scale-95"
                    title="معاينة وتكبير الصورة بحجم كامل"
                  >
                    <IconMaximize className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="absolute bottom-3 inset-s-3 z-2 flex items-center gap-1.5 rounded-xl bg-black/60 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-md transition-all duration-200 group-hover:bg-black/80">
                  <IconMaximize className="h-4 w-4" />
                  <span>اضغط لتكبير الصورة</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-linear-to-br from-accent/10 via-card to-accent/10 p-4 text-center">
              <CraftsmanAvatar
                name={profile.name}
                className="h-20 w-20 rounded-2xl shadow-card"
                textClassName="text-3xl"
              />
              {editable ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent text-on-accent px-4 py-2 text-xs sm:text-sm font-bold shadow-xs hover:bg-accent/90 active:scale-98"
                  >
                    <IconCamera className="h-4 w-4" />
                    <span>رفع صورة شخصية أو لعملك</span>
                  </button>
                  <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    الصورة مطلوبة لنشر ملفك في الدليل
                  </span>
                </>
              ) : (
                <span className="text-xs font-semibold text-muted">
                  لا توجد صورة للملف الشخصي
                </span>
              )}
            </div>
          )}
        </div>

        {/* رسائل أخطاء رفع الصورة إن وجدت */}
        {avatarError && (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-600"
          >
            {avatarError}
          </div>
        )}

        {/* في وضع التعديل: إرشادات سريعة بدلاً من تكرار الهوية والأزرار المكررة */}
        {editable ? (
          <div className="mt-3.5 rounded-2xl bg-muted/10 p-3 text-center border border-border/40">
            <p className="text-xs font-medium text-muted">
              💡 <strong className="text-foreground font-bold">نصيحة:</strong> الصور الواضحة لأعمالك تزيد من ثقة العملاء وتواصلهم بنسبة 80%
            </p>
          </div>
        ) : (
          /* في وضع العرض المستقل فقط (إن تم استدعاؤه بدون ترويسة رئيسية) */
          <div className="mt-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <h2 className="font-heading text-xl sm:text-2xl font-black text-foreground">
                {profile.name}
              </h2>
              {profile.verified && <VerifiedBadge />}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
              {profile.categoryName && (
                <span className="rounded-full bg-accent/10 px-3 py-0.5 font-bold text-accent border border-accent/20">
                  {profile.categoryName}
                </span>
              )}
              {profile.isPublished ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-0.5 font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  منشور للجمهور
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-0.5 font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  قيد المراجعة
                </span>
              )}
            </div>

            <div className="mt-4 flex w-full max-w-xl mx-auto items-center gap-2">
              <ButtonLink
                href={craftsmanHref(profile.slug)}
                variant="primary"
                className="flex-1 h-11 justify-center gap-2 text-sm font-bold shadow-xs"
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconExternalLink className="h-4 w-4" />
                <span>معاينة صفحتي في الدليل</span>
              </ButtonLink>
              <div className="shrink-0">
                <ShareProfileButton slug={profile.slug} name={profile.name} iconOnly />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. مودال تعديل وقص وتنسيق موضع الصورة المعتمد (Modal Component) */}
      {editable && (
        <Modal
          open={isPositionEditorOpen}
          onClose={handlePositionClosed}
          title={selectedNewFile ? "تنسيق وضبط الصورة الجديدة" : "تنسيق وموضع الصورة"}
          description="اسحب لتحريك الصورة واستخدم شريط التكبير لضبط إطار الكارت 4:3 المعتمد في الدليل"
          size="xl"
        >
          <ImagePositionEditor
            craftsmanId={profile.id}
            slug={profile.slug}
            imageFile={selectedNewFile}
            imageUrl={currentAvatarUrl}
            initialPosition={currentAvatarPos}
            onSaved={handlePositionSaved}
            onClose={handlePositionClosed}
          />
        </Modal>
      )}

      {/* 5. عارض الصور المعتمد والموحد في التطبيق (ImageViewer) */}
      {currentAvatarUrl && (
        <ImageViewer
          open={showViewer}
          onClose={handleCloseViewer}
          src={currentAvatarUrl}
          title={profile.name}
        />
      )}
    </>
  );
}
