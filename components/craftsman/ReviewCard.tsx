import type { ReactNode } from "react";
import { Avatar } from "@/components/shared/ui/Avatar";
import { IconEdit, IconStar, IconTrash } from "@/components/shared/icons";

/**
 * كارت التقييم الموحّد — عرض فقط بلا أي منطق أو حالة.
 *
 * الهيكل ثابت ومعتمد من تصميم «سجل تقييماتي»:
 *   1) صف علوي مفصول بخط: الصورة الرمزية + الاسم (+ التخصص/الشارة)
 *      وفي المقابل النجوم وإجراءات التعديل/الحذف.
 *   2) صف سفلي: نص التعليق وفي المقابل التاريخ.
 *
 * используется في صفحة تفاصيل الصنايعي، في مودال «كل التقييمات»،
 * وفي سجل تقييماتي — بنفس الشكل في الثلاثة.
 */
export interface ReviewCardProps {
  /** اسم صاحب التقييم (العميل في صفحة الصنايعي، الصنايعي في سجل تقييماتي). */
  name: ReactNode;
  /** سطر ثانوي تحت الاسم — تخصص الصنايعي في السجل. */
  subtitle?: ReactNode;
  /**
   * صورة صاحب التقييم/الصنايعي داخل المربع (44px).
   * Supabase وOAuth كلاهما مدعوم، والحرف الأول من `avatarName` هو البديل
   * عند غياب الصورة أو فشل تحميلها.
   */
  avatarUrl?: string | null;
  /** الاسم النصي للصورة: النص البديل + الحرف الأول (لأن `name` قد يكون رابطاً). */
  avatarName?: string;
  rating: number;
  comment?: string | null;
  /** تاريخ التقييم أسفل التعليق في جهة المقابل. */
  createdAt: string;
  /** شارة «تقييمك» بجوار الاسم. */
  showBadge?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  /** يعطّل زر الحذف أثناء تنفيذ الطلب. */
  deleting?: boolean;
  className?: string;
}

export function ReviewCard({
  name,
  subtitle,
  avatarUrl,
  avatarName = "",
  rating,
  comment,
  createdAt,
  showBadge = false,
  onEdit,
  onDelete,
  deleting = false,
  className = "",
}: ReviewCardProps) {
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <div
      className={`rounded-2xl border border-border bg-background/50 p-5 transition-colors hover:border-accent/30 ${className}`}
    >
      {/* الصف العلوي: الهوية في جهة، والنجوم والإجراءات في جهة مقابلها */}
      <div className="flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            url={avatarUrl}
            name={avatarName}
            size={44}
            className="rounded-xl text-lg"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="min-w-0 truncate text-base font-bold text-foreground">
                {name}
              </div>
              {showBadge && (
                <span className="shrink-0 rounded-md bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent">
                  تقييمك
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs break-words text-muted">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <div
            className="flex items-center gap-0.5 text-amber-500"
            role="img"
            aria-label={`${rating} من 5 نجوم`}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <IconStar
                key={i}
                className={`h-4 w-4 ${i < rating ? "fill-current" : "text-border"}`}
              />
            ))}
          </div>

          {hasActions && (
            <div className="flex items-center gap-1.5">
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  title="تعديل تقييمك"
                  aria-label="تعديل تقييمك"
                  className="rounded-lg border border-border p-2 text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  <IconEdit className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={deleting}
                  title="حذف تقييمك"
                  aria-label="حذف تقييمك"
                  className="rounded-lg border border-border p-2 text-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* الصف السفلي: التعليق في جهة، والتاريخ في جهة مقابله */}
      <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        {/* min-w-0 + break-words: يمنع أي تعليق طويل (رابط أو رقم متصل)
            من توسيع الكارت والخروج منه أفقياً. */}
        <p className="min-w-0 text-sm break-words leading-relaxed text-foreground/90">
          {comment ? (
            `«${comment}»`
          ) : (
            <span className="text-xs text-muted">بدون تعليق مكتوب</span>
          )}
        </p>
        <span className="shrink-0 text-xs text-muted">
          {new Date(createdAt).toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}