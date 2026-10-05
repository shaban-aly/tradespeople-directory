"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ConfirmDialogProps } from "@/components/shared/ui/ConfirmDialog";

export type ConfirmDialogOptions = Omit<
  ConfirmDialogProps,
  "open" | "onClose" | "onConfirm"
>;

/**
 * إدارة حوار التأكيد كوعد (promise): تستدعي `ask(...)` فترجع `true` عند
 * التأكيد و `false` عند الإلغاء، فيمكن كتابة منطق الحذف تسلسلياً:
 *
 *   if (!(await ask({ title, message, danger: true }))) return;
 *
 * المكوّن يعرض النتيجة فقط عبر `<ConfirmDialog {...dialogProps} />`.
 * سبب وجوده: `window.confirm` لا يظهر بثيم الموقع ولا ينسجم معه،
 * والـ busy state يُبنى هنا بدل تكراره في كل كومبوننت.
 */
export function useConfirmDialog() {
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  // إغلاق أي طلب معلّق عند تفكيك الكومبوننت حتى لا يبقى الـ promise بلا حل.
  useEffect(() => {
    return () => {
      resolverRef.current?.(false);
      resolverRef.current = null;
    };
  }, []);

  const ask = useCallback((next: ConfirmDialogOptions) => {
    // أي حوار سابق لم يُحسم يُلغى أولاً حتى لا تتعارض الوعود.
    resolverRef.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOptions(next);
    });
  }, []);

  const settle = useCallback((confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const dialogProps: ConfirmDialogProps | null = options
    ? {
        ...options,
        open: true,
        onConfirm: () => settle(true),
        onClose: () => settle(false),
      }
    : null;

  return { ask, dialogProps };
}