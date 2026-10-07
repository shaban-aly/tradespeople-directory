"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useActiveCraftsman } from "@/hooks/craftsman/useActiveCraftsman";
import { IconCheck, IconChevronDown, IconPlus } from "@/components/shared/icons";
import type { CraftsmanBrief } from "@/lib/db/craftsman-dashboard";

/**
 * مبدّل الملفات المدمج: زر واحد مضغوط (نقطة + اسم الملف + سهم) يفتح
 * قائمة منسدلة — بدل كارت "ملفاتي المهنية" الكامل. لا يظهر لصاحب
 * الملف الواحد. التبديل يبقيك في صفحتك الحالية (نفس آلية الهوك).
 */
interface ProfileSwitcherProps {
  craftsmen: CraftsmanBrief[];
  activeCraftsmanId: string;
  /** عدد العروض أو الإشعارات المفتوحة لكل ملف (معرّف الملف ← العدد) */
  counts?: Record<string, number>;
}

/**
 * مبدّل الملفات المدمج: زر أنيق يفتح قائمة منسدلة لاختيار الملف المهني النشط.
 * يعرض حالة النشر، وعدد العروض المتاحة، ويدعم التبديل اللحظي بلا فلاش.
 */
export function ProfileSwitcher({
  craftsmen,
  activeCraftsmanId,
  counts,
}: ProfileSwitcherProps) {
  const { setActiveCraftsman } = useActiveCraftsman();
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const active = craftsmen.find((c) => c.id === activeCraftsmanId) ?? craftsmen[0];
  const pending = pendingId && pendingId !== active?.id ? pendingId : null;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!active || craftsmen.length < 2) return null;

  function handleSwitch(id: string) {
    if (id === active.id || pending) return;
    setPendingId(id);
    setOpen(false);
    setActiveCraftsman(id);
  }

  return (
    <div ref={rootRef} className="relative inline-block text-right">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="تبديل الملف المهني"
        className="flex items-center gap-2 rounded-xl border border-border/80 bg-card py-1.5 pe-2.5 ps-2 text-xs sm:text-sm font-bold transition-all hover:border-accent hover:shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span
          aria-hidden
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-xs font-black text-accent"
        >
          {active.categoryName.charAt(0) || "•"}
        </span>
        <span className="max-w-28 sm:max-w-36 truncate text-foreground">
          {active.categoryName || active.name}
        </span>
        <span className="rounded-full bg-muted/15 px-1.5 py-0.2 text-[10px] font-semibold text-muted">
          {craftsmen.length} ملفات
        </span>
        <IconChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border/80 bg-card p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-2 border-b border-border/60">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">
              ملفاتك المهنية المعتمدة
            </p>
          </div>

          <div className="py-1 space-y-0.5">
            {craftsmen.map((c) => {
              const isActive = c.id === active.id;
              const leadCount = counts ? counts[c.id] ?? 0 : 0;

              return (
                <button
                  key={c.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  disabled={isActive || pending !== null}
                  onClick={() => handleSwitch(c.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right transition-colors ${
                    isActive
                      ? "bg-accent/10 text-accent font-bold cursor-default"
                      : "hover:bg-muted/10 text-foreground cursor-pointer"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${
                      isActive
                        ? "bg-accent text-on-accent"
                        : "bg-muted/15 text-muted"
                    }`}
                  >
                    {c.categoryName.charAt(0) || "•"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="block truncate text-xs sm:text-sm font-bold">
                        {c.name}
                      </span>
                      {c.isPublished ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" title="منشور" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" title="قيد المراجعة" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="block truncate text-[11px] text-muted font-medium">
                        {c.categoryName}
                      </span>
                      {leadCount > 0 && (
                        <span className="inline-flex items-center rounded-full bg-action/15 px-1.5 py-0.2 text-[10px] font-bold text-action">
                          {leadCount} عرض جديد
                        </span>
                      )}
                    </div>
                  </div>

                  {isActive && (
                    <IconCheck className="h-4 w-4 shrink-0 text-accent" />
                  )}
                  {pending === c.id && (
                    <span className="h-4 w-4 shrink-0 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-border/60 pt-1 mt-1">
            <Link
              href="/join"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-accent hover:bg-accent/10 transition-colors"
            >
              <IconPlus className="h-4 w-4 shrink-0" />
              <span>إضافة تخصص مهني جديد</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
