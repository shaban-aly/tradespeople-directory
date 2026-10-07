import Link from "next/link";
import { IconCheck, IconChevronLeft, IconSparkles } from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";
import type { CraftsmanSelfProfile } from "@/lib/db/craftsman-dashboard";

interface ProfileCompletionCardProps {
  profile: CraftsmanSelfProfile;
  hideActionLink?: boolean;
}

/**
 * بطاقة جاهزية واكتمال الملف المهني:
 * - تصميم رأسي مريح لا يسبب أي اقتطاع أو اختفاء للنصوص.
 * - شريط تقدم بعرض كامل بنسبة 100%.
 * - زر واضح وبارز لاستكمال باقي البيانات.
 */
export function ProfileCompletionCard({
  profile,
  hideActionLink = false,
}: ProfileCompletionCardProps) {
  let score = 0;
  const missingTips: string[] = [];

  // 1. الصورة
  if (profile.imageUrl) {
    score += 25;
  } else {
    missingTips.push("أضف صورة شخصية واضحة لزيادة ثقة العملاء");
  }

  // 2. الوصف
  if (profile.description && profile.description.trim().length >= 40) {
    score += 25;
  } else {
    missingTips.push("اكتب نبذة مفصلة عن خبراتك وخدماتك");
  }

  // 3. أرقام الاتصال
  if (profile.phone && profile.whatsapp) {
    score += 25;
  } else {
    missingTips.push("تأكد من كتابة رقم الهاتف والواتساب للتواصل");
  }

  // 4. روابط السوشيال ميديا
  if (profile.socialLinks && profile.socialLinks.length > 0) {
    score += 25;
  } else {
    missingTips.push("أضف روابط أعمالك السابقة على فيسبوك لزيادة الحجوزات");
  }

  const isComplete = score === 100;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3">
      {/* 1. السطر العلوي: النسبة والشارة */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
              isComplete
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-accent/10 text-accent"
            }`}
          >
            {isComplete ? (
              <IconCheck className="h-4 w-4" />
            ) : (
              <IconSparkles className="h-4 w-4" />
            )}
          </div>
          <span className="text-sm font-bold text-foreground truncate">
            {isComplete ? "ملفك مكتمل 100%!" : "جاهزية بروفايلك"}
          </span>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-black ${
            isComplete
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-accent/15 text-accent"
          }`}
        >
          {toArabicDigits(score)}%
        </span>
      </div>

      {/* 2. شريط التقدم بعرض كامل (100% Full Width) */}
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isComplete ? "bg-emerald-500" : "bg-accent"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* 3. النصيحة الإرشادية */}
      <p className="text-xs text-muted leading-relaxed">
        {isComplete
          ? "بياناتك متكاملة ومؤهلة للحصول على أعلى نسبة ظهور وتواصل في السويس."
          : missingTips[0] || "أكمل باقي البيانات لزيادة ثقة الزوار وتصدر نتائج البحث."}
      </p>

      {/* 4. زر الإجراء الواضح (بعرض كامل دون أي اقتطاع) */}
      {!isComplete && !hideActionLink && (
        <div className="pt-1">
          <Link
            href="/dashboard/profile"
            className="w-full h-9 flex items-center justify-center gap-1.5 rounded-xl border border-accent/25 bg-accent/5 hover:bg-accent hover:text-on-accent text-xs font-bold text-accent transition-all active:scale-[0.99]"
          >
            <span>استكمال باقي البيانات</span>
            <IconChevronLeft className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
