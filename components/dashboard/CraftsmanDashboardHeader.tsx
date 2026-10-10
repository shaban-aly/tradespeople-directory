"use client";

import { useState } from "react";
import { SafeImage as Image } from "@/components/shared/ui/SafeImage";
import { CraftsmanAvatar } from "@/components/shared/ui/CraftsmanAvatar";
import { VerifiedBadge } from "@/components/shared/ui/VerifiedBadge";
import { ButtonLink } from "@/components/shared/ui/Button";
import { IconExternalLink, IconMaximize } from "@/components/shared/icons";
import { ProfileSwitcher } from "@/components/dashboard/ProfileSwitcher";
import { ShareProfileButton } from "@/components/dashboard/ShareProfileButton";
import { DashboardSubnav } from "@/components/dashboard/DashboardSubnav";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { craftsmanHref } from "@/lib/utils/url";
import { IMAGE_ASPECT, withImageAspect } from "@/lib/utils/image-transform";
import type { CraftsmanBrief, CraftsmanSelfProfile } from "@/lib/db/craftsman-dashboard";

export interface CraftsmanDashboardHeaderProps {
  profile: CraftsmanSelfProfile;
  craftsmen?: CraftsmanBrief[];
  activeCraftsmanId?: string;
  counts?: Record<string, number>;
  openLeadsCount?: number;
  className?: string;
}

/**
 * ترويسة لوحة تحكم الفني الموحدة (Craftsman Dashboard Header):
 * - هوية وسياق الفني: الصورة الشخصية (مع تكبير سريع)، الاسم، شارة التوثيق، التخصص، والمنطقة.
 * - مؤشر حالة النشر في الدليل (منشور للجمهور بنبضة خضراء / قيد المراجعة).
 * - مبدل الملفات (ProfileSwitcher) للحسابات المتعددة لتسهيل التبديل من أي صفحة.
 * - أزرار الإجراء السريع: معاينة الصفحة المباشرة في الدليل + زر المشاركة.
 * - شريط التبويبات الموحد المدمج (DashboardSubnav) بدون ازدواجية الإطارات.
 */
export function CraftsmanDashboardHeader({
  profile,
  craftsmen,
  activeCraftsmanId,
  counts,
  openLeadsCount,
  className = "",
}: CraftsmanDashboardHeaderProps) {
  const [showViewer, setShowViewer] = useState(false);

  return (
    <header
      className={`rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-colors flex flex-col gap-4 ${className}`}
    >
      {/* صف الهوية العلوي ومبدل الملفات والإجراءات */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* معلومات الفني (الصورة + الاسم + الشارات) */}
        <div className="flex items-center gap-3.5 min-w-0">
          {/* الصورة الرمزية مع إمكانية التكبير */}
          {profile.imageUrl ? (
            <button
              type="button"
              onClick={() => setShowViewer(true)}
              className="group relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-2xl border border-border/80 shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              title="اضغط لمعاينة وتكبير الصورة"
              aria-label={`معاينة صورة ${profile.name}`}
            >
              <Image
                src={withImageAspect(profile.imageUrl, IMAGE_ASPECT.SQUARE)}
                alt={profile.name}
                fill
                sizes="(max-width: 640px) 56px, 64px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                style={{
                  objectPosition: `${profile.avatarPosition?.x ?? 50}% ${profile.avatarPosition?.y ?? 50}%`,
                  transform:
                    (profile.avatarPosition?.zoom ?? 1) > 1
                      ? `scale(${profile.avatarPosition?.zoom})`
                      : undefined,
                  transformOrigin: `${profile.avatarPosition?.x ?? 50}% ${profile.avatarPosition?.y ?? 50}%`,
                }}
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <IconMaximize className="h-4 w-4 text-white drop-shadow" />
              </div>
            </button>
          ) : (
            <CraftsmanAvatar
              name={profile.name}
              className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-2xl shadow-2xs"
              textClassName="text-xl sm:text-2xl"
            />
          )}

          {/* تفاصيل الهوية */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-lg sm:text-xl font-black text-foreground truncate">
                {profile.name}
              </h1>
              {profile.verified && <VerifiedBadge />}
            </div>

            <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs">
              {profile.categoryName && (
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 font-bold text-accent border border-accent/20">
                  {profile.categoryName}
                </span>
              )}
              {profile.areaName && (
                <span className="rounded-full bg-muted/15 px-2.5 py-0.5 font-medium text-muted">
                  {profile.areaName}
                </span>
              )}
              {profile.isPublished ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  منشور للجمهور
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  قيد المراجعة
                </span>
              )}
            </div>
          </div>
        </div>

        {/* أدوات التحكم: مبدل الملفات + زر المعاينة والمشاركة في صف أفقي متناسق */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-border/40">
          {craftsmen && activeCraftsmanId && counts && (
            <div className="flex-1 sm:flex-initial min-w-0">
              <ProfileSwitcher
                craftsmen={craftsmen}
                activeCraftsmanId={activeCraftsmanId}
                counts={counts}
              />
            </div>
          )}

          <ButtonLink
            href={craftsmanHref(profile.slug)}
            variant="outline"
            size="sm"
            className="shrink-0 min-h-10 text-xs sm:text-sm font-bold gap-1.5 px-3 text-foreground hover:bg-muted/15"
            target="_blank"
            rel="noopener noreferrer"
            title="معاينة صفحتك في دليل الصنايعية كما يراها الزبائن"
          >
            <IconExternalLink className="h-3.5 w-3.5 text-accent" />
            <span className="hidden sm:inline">معاينة بالدليل</span>
            <span className="sm:hidden">معاينة</span>
          </ButtonLink>

          <div className="shrink-0">
            <ShareProfileButton slug={profile.slug} name={profile.name} iconOnly />
          </div>
        </div>
      </div>

      {/* خط فاصل أنيق */}
      <div className="border-t border-border/60 pt-1">
        {/* شريط التبويبات المدمج */}
        <DashboardSubnav openLeadsCount={openLeadsCount} embedded={true} />
      </div>

      {/* نافذة تكبير الصورة عند الضغط عليها */}
      {profile.imageUrl && (
        <ImageViewer
          open={showViewer}
          onClose={() => setShowViewer(false)}
          src={profile.imageUrl}
          title={profile.name}
        />
      )}
    </header>
  );
}
