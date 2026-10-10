import { IconCheck } from "@/components/shared/icons";
import { Button, ButtonLink } from "@/components/shared/ui/Button";

type JoinSuccessStateProps = {
  craftsmanName?: string;
  categoryName?: string;
  area?: string;
  onReset: () => void;
};

export function JoinSuccessState({
  craftsmanName,
  categoryName,
  area,
  onReset,
}: JoinSuccessStateProps) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-6 text-center shadow-card sm:p-8">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-action/10 text-action ring-8 ring-action/5">
        <IconCheck className="h-8 w-8" />
      </div>

      <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
        تم استلام طلب انضمامك بنجاح!
      </h2>
      <p className="mx-auto mt-2.5 max-w-md text-base leading-relaxed text-muted">
        شكراً لانضمامك لدليل صنايعية السويس. طلبك الآن قيد المراجعة والاعتماد السريع.
      </p>

      {/* ملخص الطلب المُرسل */}
      {(craftsmanName || categoryName || area) && (
        <div className="my-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-border bg-background/50 px-4 py-2.5 text-xs text-muted">
          {craftsmanName && (
            <span>
              الاسم: <strong className="text-foreground">{craftsmanName}</strong>
            </span>
          )}
          {categoryName && (
            <>
              <span className="text-border">•</span>
              <span>
                التخصص: <strong className="text-foreground">{categoryName}</strong>
              </span>
            </>
          )}
          {area && (
            <>
              <span className="text-border">•</span>
              <span>
                المنطقة: <strong className="text-foreground">{area}</strong>
              </span>
            </>
          )}
        </div>
      )}

      {/* خريطة الخطوات القادمة */}
      <div className="my-6 rounded-2xl border border-border bg-background/60 p-4 text-start sm:p-5">
        <h3 className="mb-3 font-heading text-sm font-bold text-foreground">
          ماذا سيحدث بعد ذلك؟
        </h3>
        <ol className="space-y-3 text-xs sm:text-sm text-muted">
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
              1
            </span>
            <span>
              <strong className="text-foreground">مراجعة المشرف:</strong> التحقق من
              صحة الهاتف والتخصص والمنطقة لضمان مصداقية وجودة الدليل.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
              2
            </span>
            <span>
              <strong className="text-foreground">النشر والتوثيق:</strong> بمجرد الاعتماد،
              يظهر ملفك في نتائج البحث وقوائم الحرف فوراً لآلاف العملاء.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
              3
            </span>
            <span>
              <strong className="text-foreground">إدارة الملف:</strong> حسابك أصبح مرتبطاً
              بهذا الملف، وستتمكن من تحديث أرقامك وصورك في أي وقت.
            </span>
          </li>
        </ol>
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
        <ButtonLink href="/categories" variant="primary" className="w-full sm:w-auto">
          تصفح دليل الفنيين
        </ButtonLink>
        <ButtonLink href="/" variant="ghost" className="w-full sm:w-auto">
          الصفحة الرئيسية
        </ButtonLink>
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="w-full sm:w-auto"
        >
          إضافة صنايعي آخر
        </Button>
      </div>
    </div>
  );
}
