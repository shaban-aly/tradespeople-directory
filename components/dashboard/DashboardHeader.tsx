import Image from "next/image";
import { CraftsmanAvatar } from "@/components/shared/ui/CraftsmanAvatar";
import { VerifiedBadge } from "@/components/shared/ui/VerifiedBadge";
import { ButtonLink } from "@/components/shared/ui/Button";
import { IconExternalLink, IconPin } from "@/components/shared/icons";
import { craftsmanHref } from "@/lib/utils/url";
import type { CraftsmanSelfProfile } from "@/lib/db/craftsman-dashboard";

interface DashboardHeaderProps {
  profile: CraftsmanSelfProfile;
}

export function DashboardHeader({ profile }: DashboardHeaderProps) {
  return (
    <header className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* بيانات الفني الأساسية */}
        <div className="flex items-center gap-3.5">
          {/* الصورة أو الأفاتار */}
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border sm:h-20 sm:w-20">
            {profile.imageUrl ? (
              <Image
                src={profile.imageUrl}
                alt={profile.name}
                fill
                sizes="(max-width: 640px) 64px, 80px"
                className="object-cover"
              />
            ) : (
              <CraftsmanAvatar name={profile.name} className="h-full w-full rounded-2xl text-xl" />
            )}
          </div>

          {/* الاسم والتخصص والمنطقة */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="truncate font-heading text-xl font-bold text-foreground sm:text-2xl">
                {profile.name}
              </h1>
              {profile.verified && <VerifiedBadge />}
            </div>

            <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-muted">
              {profile.categoryName && (
                <span className="rounded-md bg-accent/10 px-2 py-0.5 font-medium text-accent">
                  {profile.categoryName}
                </span>
              )}
              {profile.areaName && (
                <span className="inline-flex items-center gap-1">
                  <IconPin className="h-3.5 w-3.5" />
                  {profile.areaName}
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-muted">
              حالة الظهور في الدليل:{" "}
              {profile.isPublished ? (
                <span className="font-semibold text-action">
                  <span className="me-1 inline-block h-2 w-2 rounded-full bg-action align-middle" />
                  منشور للجمهور
                </span>
              ) : (
                <span className="font-semibold text-amber-600">
                  <span className="me-1 inline-block h-2 w-2 rounded-full bg-amber-500 align-middle" />
                  غير منشور حالياً
                </span>
              )}
            </p>
          </div>
        </div>

        {/* زر معاينة الصفحة العامة للمستخدمين */}
        <div className="pt-2 sm:pt-0">
          <ButtonLink
            href={craftsmanHref(profile.slug)}
            variant="outline"
            className="w-full sm:w-auto min-h-12 text-sm font-semibold justify-center"
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
