"use client";

import { useState } from "react";
import { useActiveCraftsman } from "@/hooks/craftsman/useActiveCraftsman";
import { Button } from "@/components/shared/ui/Button";
import { toArabicDigits } from "@/lib/utils/format";

export type OtherProfileOpen = {
  id: string;
  categoryName: string;
  openCount: number;
};

/**
 * تنبيه بعروض الملفات الأخرى المفتوحة أثناء عرض ملف واحد.
 * يُعرض فقط عند وجود مفتوحة في غير النشط، والزر يبدّل للملف فوراً
 * بنفس آلية المبدّل — لا مسارات ولا مفاهيم جديدة.
 */
export function OtherProfilesAlert({ items }: { items: OtherProfileOpen[] }) {
  const { setActiveCraftsman } = useActiveCraftsman();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  if (items.length === 0) return null;

  function handleShow(id: string) {
    if (switchingId) return;
    setSwitchingId(id);
    setActiveCraftsman(id);
  }

  return (
    <div
      role="status"
      className="rounded-2xl border border-accent/40 bg-accent/5 p-4 shadow-card"
    >
      <p className="text-sm font-bold text-foreground">
        لديك عروض مفتوحة في {toArabicDigits(items.length)}{" "}
        {items.length === 1 ? "ملف آخر" : "ملفات أخرى"}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-3 py-2"
          >
            <span className="min-w-0 truncate text-sm">
              <span className="font-bold">{item.categoryName}</span>
              <span className="text-muted">
                {" "}
                — {toArabicDigits(item.openCount)}{" "}
                {item.openCount === 1 ? "عرض مفتوح" : "عروض مفتوحة"}
              </span>
            </span>
            <Button
              type="button"
              variant="action"
              size="sm"
              disabled={switchingId !== null}
              onClick={() => handleShow(item.id)}
              className="shrink-0"
            >
              {switchingId === item.id ? "جاري التبديل..." : "عرضها"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
