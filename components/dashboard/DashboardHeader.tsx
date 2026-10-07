"use client";

import { useState, type ReactNode } from "react";
import { SafeImage as Image } from "@/components/shared/ui/SafeImage";
import { CraftsmanAvatar } from "@/components/shared/ui/CraftsmanAvatar";
import { VerifiedBadge } from "@/components/shared/ui/VerifiedBadge";
import { ButtonLink } from "@/components/shared/ui/Button";
import { IconExternalLink, IconMaximize } from "@/components/shared/icons";
import { ImageViewer } from "@/components/shared/ImageViewer";
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
}

/**
 * كارت صورة الفني وهوية العمل الكبير (Showcase Card):
 * - صورة كبيرة بارزة مع خلفية ضبابية سينمائية مطابقة لتصميم التطبيق.
 * - دعم المعاينة والتكبير عبر عارض الصور المعتمد في التطبيق (ImageViewer).
 * - تفاصيل الهوية الكاملة: الاسم، التخصص، المنطقة، حالة النشر.
 * - أزرار المعاينة المباشرة والمشاركة.
 */
export function DashboardHeader({ profile, action }: DashboardHeaderProps) {
  const [showLightbox, setShowLightbox] = useState(false);

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
        {/* مبدل الحسابات إن وجد */}
        {action && (
          <div className="mb-3.5 flex items-center justify-end">
            {action}
          </div>
        )}

        {/* 1. كارت الصورة الكبير مع ميزة المعاينة والتكبير بخلفية سينمائية مطابقة للتطبيق */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (profile.imageUrl) setShowLightbox(true);
          }}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && profile.imageUrl) {
              e.preventDefault();
              setShowLightbox(true);
            }
          }}
          className={`group relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-2xl bg-neutral-900/90 border border-border/80 shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent ${
            profile.imageUrl ? "cursor-pointer" : "cursor-default"
          }`}
          aria-label={
            profile.imageUrl
              ? `معاينة وتكبير صورة ${profile.name}`
              : "صورة الملف الشخصي"
          }
        >
          {profile.imageUrl ? (
            <>
              {/* خلفية ضبابية سينمائية عبر Supabase Transformations مطابقة للدليل */}
              <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={supabaseBlurUrl(profile.imageUrl) ?? profile.imageUrl}
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
                  src={withImageAspect(profile.imageUrl, IMAGE_ASPECT.CARD)}
                  alt={profile.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover transition-transform duration-300 group-hover:scale-102"
                  style={{
                    objectPosition: `${profile.avatarPosition?.x ?? 50}% ${profile.avatarPosition?.y ?? 50}%`,
                    transform:
                      (profile.avatarPosition?.zoom ?? 1) > 1
                        ? `scale(${profile.avatarPosition?.zoom})`
                        : undefined,
                    transformOrigin: `${profile.avatarPosition?.x ?? 50}% ${profile.avatarPosition?.y ?? 50}%`,
                  }}
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
              </div>

              {/* شارة التكبير بالحجم الكامل مطابقة للدليل */}
              <div className="absolute bottom-3 inset-s-3 z-10 flex items-center gap-1.5 rounded-xl bg-black/60 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-md transition-all duration-200 group-hover:bg-black/80">
                <IconMaximize className="h-4 w-4" />
                <span>اضغط لتكبير الصورة</span>
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-accent/10 via-card to-accent/10">
              <CraftsmanAvatar
                name={profile.name}
                className="h-24 w-24 rounded-2xl shadow-card"
                textClassName="text-4xl"
              />
            </div>
          )}
        </div>

        {/* 2. بيانات الفني وحالة النشر */}
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

          {/* 3. زر الإجراء الرئيسي العريض وزر المشاركة */}
          <div className="mt-4 flex w-full items-center gap-2">
            <ButtonLink
              href={craftsmanHref(profile.slug)}
              variant="action"
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
      </div>

      {/* 4. عارض الصور المعتمد والموحد في التطبيق (ImageViewer) */}
      <ImageViewer
        open={showLightbox}
        onClose={() => setShowLightbox(false)}
        src={profile.imageUrl}
        title={profile.name}
      />
    </>
  );
}
