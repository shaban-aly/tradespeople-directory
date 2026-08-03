"use client";

import { toArabicDigits } from "@/lib/utils/format";

export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (next: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="min-h-12 rounded-xl border border-border px-4 text-base font-bold text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        السابق
      </button>
      <span className="text-base text-muted">
        صفحة {toArabicDigits(page)} من {toArabicDigits(pageCount)}
      </span>
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        className="min-h-12 rounded-xl border border-border px-4 text-base font-bold text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        التالي
      </button>
    </div>
  );
}
