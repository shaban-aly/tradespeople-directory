import Link from "next/link";
import { IconCheck, IconSparkles } from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";
import type { CraftsmanSelfProfile } from "@/lib/db/craftsman-dashboard";

interface ProfileCompletionCardProps {
  profile: CraftsmanSelfProfile;
  hideActionLink?: boolean;
}

export function ProfileCompletionCard({ profile, hideActionLink = false }: ProfileCompletionCardProps) {
  let score = 0;
  const missingTips: string[] = [];

  // 1. الصورة
  if (profile.imageUrl) {
    score += 25;
  } else {
    missingTips.push("أضف صورة شخصية واضحة لزيادة الثقة");
  }

  // 2. الوصف
  if (profile.description && profile.description.trim().length >= 40) {
    score += 25;
  } else {
    missingTips.push("اكتب وصفاً مفصلاً لخبراتك وأعمالك");
  }

  // 3. أرقام الاتصال
  if (profile.phone && profile.whatsapp) {
    score += 25;
  } else {
    missingTips.push("تأكد من كتابة رقم الهاتف والواتساب");
  }

  // 4. روابط السوشيال ميديا
  if (profile.socialLinks && profile.socialLinks.length > 0) {
    score += 25;
  } else {
    missingTips.push("أضف روابط فيسبوك أو انستغرام لأعمالك السابقة");
  }

  const isComplete = score === 100;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-l from-accent/5 via-card to-card p-4 sm:p-5 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isComplete
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-accent/10 text-accent"
            }`}
          >
            {isComplete ? (
              <IconCheck className="h-5 w-5" />
            ) : (
              <IconSparkles className="h-5 w-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-heading text-sm sm:text-base font-bold text-foreground">
                {isComplete
                  ? "ملفك الشخصي مكتمل بنسبة 100%!"
                  : `جاهزية بروفايلك: ${toArabicDigits(score)}%`}
              </h4>
              {isComplete && (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  ممتاز
                </span>
              )}
            </div>

            <p className="mt-0.5 text-xs text-muted">
              {isComplete
                ? "بياناتك متكاملة ومؤهلة للحصول على أعلى نسبة تواصل وظهور في دليل السويس."
                : missingTips[0] || "أكمل باقي البيانات لزيادة ثقة الزوار وتصدر نتائج البحث."}
            </p>
          </div>
        </div>

        {/* Progress Bar & Action */}
        <div className="flex items-center gap-3 w-full sm:w-auto pt-1 sm:pt-0">
          <div className="w-24 sm:w-32 h-2.5 rounded-full bg-border/70 overflow-hidden shrink-0">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isComplete ? "bg-emerald-500" : "bg-accent"
              }`}
              style={{ width: `${score}%` }}
            />
          </div>

          {!isComplete && !hideActionLink && (
            <Link
              href="/dashboard/profile"
              className="text-xs font-bold text-accent hover:underline shrink-0"
            >
              إكمال البيانات ←
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
