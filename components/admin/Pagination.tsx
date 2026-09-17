"use client";

import { AdminButton } from "@/components/admin/ui/AdminButton";
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
      <AdminButton
        type="button"
        variant="outline"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        السابق
      </AdminButton>
      <span className="text-base text-muted">
        صفحة {toArabicDigits(page)} من {toArabicDigits(pageCount)}
      </span>
      <AdminButton
        type="button"
        variant="outline"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        التالي
      </AdminButton>
    </div>
  );
}
