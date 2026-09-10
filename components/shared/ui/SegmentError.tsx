"use client";

export function SegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card sm:p-10">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-3xl">
          ⚠️
        </div>
        <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
          حصل خطأ غير متوقع
        </h2>
        <p className="mx-auto mt-2 max-w-md text-base text-muted leading-relaxed">
          حدّثت الصفحة أو ارجع للرئيسية، أو جرّب الضغط على الزر أدناه.
        </p>
        {error.message && (
          <p className="mx-auto mt-3 max-w-md text-xs text-muted" dir="ltr">
            {error.message}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 justify-center items-center sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="min-h-12 w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-action px-6 text-base font-bold text-on-action shadow-sm transition-colors hover:bg-action/90"
          >
            إعادة التحميل
          </button>
        </div>
      </div>
    </div>
  );
}