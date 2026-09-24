import Image from "next/image";
import { CraftsmanAvatar } from "@/components/shared/ui/CraftsmanAvatar";
import { VerifiedBadge } from "@/components/shared/ui/VerifiedBadge";
import { ButtonLink } from "@/components/shared/ui/Button";
import { IconExternalLink, IconPin } from "@/components/shared/icons";
import { craftsmanHref } from "@/lib/utils/url";
import { ShareProfileButton } from "@/components/dashboard/ShareProfileButton";
import type { CraftsmanSelfProfile } from "@/lib/db/craftsman-dashboard";

interface DashboardHeaderProps {
  profile: CraftsmanSelfProfile;
}

export function DashboardHeader({ profile }: DashboardHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-card transition-all">
      {/* Decorative subtle ambient glow */}
      <div
        className="pointer-events-none absolute -top-12 -left-12 h-36 w-36 rounded-full bg-accent/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-action/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* بيانات الفني الأساسية */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          {/* الصورة أو الأفاتار مع مؤشر الحالة النابض */}
          <div className="relative shrink-0">
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-2xl border-2 border-border/80 shadow-md ring-2 ring-accent/15">
              {profile.imageUrl ? (
                <Image
                  src={profile.imageUrl}
                  alt={profile.name}
                  fill
                  sizes="(max-width: 640px) 64px, 80px"
                  className="object-cover"
                  style={{
                    objectPosition: `${profile.avatarPosition?.x ?? 50}% ${profile.avatarPosition?.y ?? 50}%`,
                    transform:
                      (profile.avatarPosition?.zoom ?? 1) > 1
                        ? `scale(${profile.avatarPosition?.zoom})`
                        : undefined,
                    transformOrigin: `${profile.avatarPosition?.x ?? 50}% ${profile.avatarPosition?.y ?? 50}%`,
                  }}
                />
              ) : (
                <CraftsmanAvatar
                  name={profile.name}
                  className="h-full w-full rounded-2xl text-xl sm:text-2xl"
                />
              )}
            </div>

            {/* نقطة الحالة النابضة */}
            {profile.isPublished && (
              <span
                className="absolute -bottom-1 -left-1 flex h-4 w-4"
                title="حسابك منشور ونشط للزوار"
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-card bg-emerald-500" />
              </span>
            )}
          </div>

          {/* الاسم والتخصص والمنطقة */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="truncate font-heading text-lg sm:text-2xl font-extrabold text-foreground">
                {profile.name}
              </h1>
              {profile.verified && <VerifiedBadge />}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted">
              {profile.categoryName && (
                <span className="rounded-lg bg-accent/10 px-2.5 py-0.5 font-bold text-accent">
                  {profile.categoryName}
                </span>
              )}
              {profile.areaName && (
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <IconPin className="h-3.5 w-3.5 text-muted" />
                  {profile.areaName}
                </span>
              )}
            </div>

            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <span className="text-muted">حالة الظهور:</span>
              {profile.isPublished ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  منشور للجمهور
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  قيد المراجعة
                </span>
              )}
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات السريعة (Action Hub) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 sm:pt-0">
          <ShareProfileButton slug={profile.slug} name={profile.name} />
          <ButtonLink
            href={craftsmanHref(profile.slug)}
            variant="action"
            className="min-h-11 sm:min-h-12 text-xs sm:text-sm font-bold justify-center gap-2 w-full sm:w-auto shadow-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>معاينة صفحتي للزوار</span>
            <IconExternalLink className="h-4 w-4 shrink-0" />
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
