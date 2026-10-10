import { IconClock, IconShieldCheck, IconUsers } from "@/components/shared/icons";

/**
 * شريط توضيح مسار الطلب وضمان الخصوصية (LeadTrustBanner).
 * يقلل العبء الإدراكي ويطمئن العميل حول كيفية التعامل مع رقمه وسرعة الاستجابة.
 */
export function LeadTrustBanner() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-card transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2 text-foreground font-bold text-sm sm:text-base">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <IconShieldCheck className="h-5 w-5" />
          </span>
          <span>كيف تعمل خدمة طلب الصنايعي؟</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-action/15 border border-action/30 px-2.5 py-1 text-xs font-bold text-action">
          خدمة مجانية بالكامل
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/60 p-3 sm:flex-col sm:gap-2 transition-colors">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
            ١
          </span>
          <div>
            <h4 className="text-sm font-bold text-foreground">اكتب مشكلتك</h4>
            <p className="mt-0.5 text-xs text-muted leading-relaxed">
              رقم هاتفك محمي ومشفر؛ لن يظهر للعامة ولن يُعرض في أي صفحة مفتوحة.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/60 p-3 sm:flex-col sm:gap-2 transition-colors">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
            ٢
          </span>
          <div>
            <h4 className="text-sm font-bold text-foreground">تنبيه الفنيين المعتمدين</h4>
            <p className="mt-0.5 text-xs text-muted leading-relaxed">
              نرسل إشعاراً فورياً للمتخصصين المتاحين في منطقتك فقط لمراجعة المشكلة.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/60 p-3 sm:flex-col sm:gap-2 transition-colors">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
            ٣
          </span>
          <div>
            <h4 className="text-sm font-bold text-foreground">تواصل وتسعير مباشر</h4>
            <p className="mt-0.5 text-xs text-muted leading-relaxed">
              أول ٣ فنيين يوافقون يتاح لهم الاتصال بك مباشرة للاتفاق على السعر والمعاينة.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-muted sm:justify-start">
        <span className="inline-flex items-center gap-1.5">
          <IconClock className="h-3.5 w-3.5 text-accent" />
          متوسط وقت استجابة أول فني: ١٥ دقيقة
        </span>
        <span className="inline-flex items-center gap-1.5">
          <IconUsers className="h-3.5 w-3.5 text-accent" />
          أقصى حد للتواصل: ٣ فنيين لمنع الإزعاج
        </span>
      </div>
    </div>
  );
}
