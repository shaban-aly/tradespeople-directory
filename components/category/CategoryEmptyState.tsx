import { IconSearch } from "@/components/shared/icons";

interface CategoryEmptyStateProps {
  searchQuery: string;
  onReset: () => void;
}

export function CategoryEmptyState({
  searchQuery,
  onReset,
}: CategoryEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/50 p-8 sm:p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/10 text-muted">
        <IconSearch className="h-8 w-8" />
      </div>

      <h3 className="mt-4 font-heading text-xl font-bold text-foreground">
        لم نجد تخصصات مطابقة
      </h3>

      <p className="mt-1.5 max-w-md text-sm text-muted leading-relaxed">
        {searchQuery ? (
          <>
            لا توجد نتائج بحث تطابق «<span className="font-semibold text-foreground">{searchQuery}</span>». تأكد من صحة الكلمة أو جرب البحث بمرادف آخر.
          </>
        ) : (
          "لا توجد تخصصات متوافقة مع الفلتر الحالي."
        )}
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-bold text-on-accent transition-all hover:bg-accent/90 active:scale-[0.98]"
      >
        عرض جميع التخصصات
      </button>
    </div>
  );
}
