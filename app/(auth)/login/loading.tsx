/**
 * شاشة التحميل الهيكلية لصفحة /login
 * مطابقة لأبعاد بطاقة تسجيل الدخول لمنع أي قفزات بصرية (CLS)
 */
export default function LoginLoading() {
  return (
    <div role="status" aria-label="جاري تحميل صفحة الدخول" className="w-full">
      {/* بطاقة الدخول الهيكلية */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-card text-center">
        {/* الشعار */}
        <div className="mx-auto mb-6 flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-border/70" />

        {/* العنوان */}
        <div className="mx-auto h-8 w-44 animate-pulse rounded-xl bg-border" />
        <div className="mx-auto mt-3 h-4 w-64 max-w-full animate-pulse rounded-md bg-border/70" />

        {/* زر الدخول */}
        <div className="mx-auto mt-8 h-12 w-full max-w-[320px] animate-pulse rounded-xl bg-border/80" />

        {/* الشروط والخصوصية */}
        <div className="mx-auto mt-6 h-3.5 w-48 animate-pulse rounded-md bg-border/50" />
      </div>

      {/* رابط العودة */}
      <div className="mx-auto mt-6 h-4 w-32 animate-pulse rounded-md bg-border/60" />
    </div>
  );
}
