import { CheckCircle2, UserCheck, Radio } from "lucide-react";
import type { LeadResponseCraftsman, LeadStatus } from "@/lib/db/leads";
import { toArabicDigits } from "@/lib/utils/format";

interface LeadSlotsTrackerProps {
  responses: { id: string; craftsman: LeadResponseCraftsman }[];
  maxResponses?: number;
  status: LeadStatus;
}

/**
 * متتبع المقاعد الثلاثة لاستجابات الفنيين
 * يعرض المقاعد المشغولة والشواغر المنتظرة بأسلوب بصري تفاعلي يوضح قاعدة الـ 3 فنيين بلمحة سريعة.
 */
export function LeadSlotsTracker({
  responses,
  maxResponses = 3,
  status,
}: LeadSlotsTrackerProps) {
  const slots = Array.from({ length: maxResponses }, (_, i) => i);

  return (
    <div className="my-3 space-y-1.5">
      <div className="flex items-center justify-between text-xs font-bold text-muted">
        <span className="flex items-center gap-1.5">
          <UserCheck className="h-3.5 w-3.5 text-accent" />
          <span>مقاعد الاستجابة المعتمدة</span>
        </span>
        <span className="font-heading">
          {toArabicDigits(responses.length)} من {toArabicDigits(maxResponses)} مقاعد
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {slots.map((index) => {
          const response = responses[index];
          const isFilled = Boolean(response);
          const isWaiting = !isFilled && status === "open";

          if (isFilled && response) {
            const firstName =
              response.craftsman.name.trim().split(/\s+/)[0] ||
              response.craftsman.name;

            return (
              <div
                key={`slot-${index}`}
                className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-1.5 sm:p-2 transition-colors min-w-0"
                title={`الفني المستجيب: ${response.craftsman.name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={response.craftsman.imageUrl || "/placeholder.png"}
                  alt={response.craftsman.name}
                  className="h-6 w-6 shrink-0 rounded-full border border-emerald-500/40 object-cover"
                />
                <div className="min-w-0 flex-1">
                  {/* على الموبايل: الاسم الأول فقط مع علامة الصح الخضراء لتجنب فيضان النص */}
                  <div className="flex items-center gap-1 sm:hidden min-w-0">
                    <span className="truncate text-xs font-bold text-foreground">
                      {firstName}
                    </span>
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  </div>

                  {/* على الديسكتوب: الاسم كامل وتحته متاح للتواصل مع علامة الصح */}
                  <div className="hidden sm:block min-w-0">
                    <p className="truncate text-xs font-bold text-foreground">
                      {response.craftsman.name}
                    </p>
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      <span>متاح للتواصل</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          if (isWaiting) {
            return (
              <div
                key={`slot-${index}`}
                className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-1.5 sm:p-2 transition-colors min-w-0"
              >
                <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/20 opacity-75" />
                  <Radio className="relative h-3 w-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-foreground">
                    مقعد {toArabicDigits(index + 1)}
                  </p>
                  <span className="block truncate text-xs font-bold text-accent">
                    <span className="sm:hidden">بانتظار فني</span>
                    <span className="hidden sm:inline">بانتظار فني...</span>
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={`slot-${index}`}
              className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-border/60 bg-muted/15 p-1.5 sm:p-2 opacity-60 min-w-0"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/20 text-muted">
                <span className="text-xs font-bold">{toArabicDigits(index + 1)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-muted">شاغر</p>
                <span className="text-xs text-muted/80">لم يُحجز</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
