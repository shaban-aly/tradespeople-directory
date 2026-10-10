import { SafeImage as Image } from "@/components/shared/ui/SafeImage";
import { CraftsmanAvatar } from "@/components/shared/ui/CraftsmanAvatar";
import { VerifiedBadge } from "@/components/shared/ui/VerifiedBadge";
import { ButtonLink } from "@/components/shared/ui/Button";
import { IconExternalLink } from "@/components/shared/icons";
import { ProfileSwitcher } from "@/components/dashboard/ProfileSwitcher";
import { craftsmanHref } from "@/lib/utils/url";
import { toArabicDigits } from "@/lib/utils/format";
import type { CraftsmanBrief, CraftsmanSelfProfile } from "@/lib/db/craftsman-dashboard";

interface LeadsHeaderStripProps {
  profile: CraftsmanSelfProfile;
  craftsmen: CraftsmanBrief[];
  activeCraftsmanId: string;
  counts: Record<string, number>;
  openCount: number;
}

/**
 * شريط معلومات الفني وسياق التخصص في لوحة العروض (Leads Header Strip):
 * - بديل مقتضب وعملي لكارت البروفايل الاستعراضي الكبير (DashboardHeader).
 * - يركز على سياق العمل: اسم الفني، التخصص، رصيد العروض، ومبدل الملفات.
 * - يوفر المساحة الرأسية الثمينة على الموبايل والديسكتوب لتظهر طلبات العمل فوراً.
 */
export function LeadsHeaderStrip({
  profile,
  craftsmen,
  activeCraftsmanId,
  counts,
  openCount,
}: LeadsHeaderStripProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-colors">
      {/* السطر العلوي: الصورة والاسم والشارات ومبدل الملفات */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* الصورة الرمزية المصغرة */}
          {profile.imageUrl ? (
            <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-xl border border-border/80 shadow-2xs">
              <Image
                src={profile.imageUrl}
                alt={profile.name}
                fill
                sizes="(max-width: 640px) 48px, 56px"
                className="object-cover"
              />
            </div>
          ) : (
            <CraftsmanAvatar
              name={profile.name}
              className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-xl shadow-2xs"
              textClassName="text-lg sm:text-xl"
            />
          )}

          {/* تفاصيل الهوية والتخصص */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="font-heading text-base sm:text-lg font-black text-foreground truncate">
                {profile.name}
              </h2>
              {profile.verified && <VerifiedBadge />}
            </div>

            <div className="mt-1 flex items-center gap-2 flex-wrap text-xs">
              {profile.categoryName && (
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 font-bold text-accent border border-accent/20">
                  {profile.categoryName}
                </span>
              )}
              {profile.isPublished ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  منشور
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-600 dark:text-amber-400">
                  قيد المراجعة
                </span>
              )}
            </div>
          </div>
        </div>

        {/* مبدل الملفات إن وجد أكثر من ملف */}
        <div className="shrink-0">
          <ProfileSwitcher
            craftsmen={craftsmen}
            activeCraftsmanId={activeCraftsmanId}
            counts={counts}
          />
        </div>
      </div>

      {/* السطر السفلي: مؤشر حالة العروض السريع + رابط المعاينة المباشرة في الدليل */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
        <p className="text-muted font-medium truncate">
          {openCount > 0 ? (
            <span className="text-accent font-bold">
              {toArabicDigits(openCount)} {openCount === 1 ? "طلب متاح" : "طلبات متاحة"}{" "}
              في تخصصك بالسويس
            </span>
          ) : (
            <span>لا توجد طلبات جديدة حالياً في هذا التخصص</span>
          )}
        </p>

        <ButtonLink
          href={craftsmanHref(profile.slug)}
          variant="ghost"
          size="sm"
          className="shrink-0 gap-1 text-xs text-muted hover:text-foreground"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconExternalLink className="h-3.5 w-3.5" />
          <span>معاينة البروفايل</span>
        </ButtonLink>
      </div>
    </div>
  );
}
