"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/hooks/auth/useSession";
import {
  canAutoPrompt,
  executePushActivation,
  type ActivationContext,
} from "@/lib/push/activation";

/**
 * تفعيل سياقي وتلقائي لإشعارات الـ Push في لحظة القيمة (Contextual Value Moment).
 *
 * المنطق:
 * - يستمع لأول gesture من المستخدم (نقرة / لمسة / زر).
 * - يتحقق من جاهزية المتصفح وعدم وجود رفض صريح (denied أو opt-out '0').
 * - يطلب الإذن تلقائياً ويسجل التوكن مع ربط الاهتمام (التصنيف) للزائر أو المسجل.
 * - يمنع التكرار التلقائي في نفس الجلسة لتفادي أي إزعاج.
 */
export function useAutoPushActivator(context?: ActivationContext): void {
  const { isLoggedIn } = useSession();
  const attemptedRef = useRef(false);
  const contextRef = useRef(context);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    if (attemptedRef.current) return;
    if (!canAutoPrompt()) return;

    const onGesture = () => {
      if (attemptedRef.current) return;
      attemptedRef.current = true;
      cleanup();

      void executePushActivation({
        context: contextRef.current,
        isLoggedIn,
      });
    };

    function cleanup() {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("touchstart", onGesture);
    }

    window.addEventListener("pointerdown", onGesture, { passive: true });
    window.addEventListener("keydown", onGesture);
    window.addEventListener("touchstart", onGesture, { passive: true });

    return cleanup;
  }, [isLoggedIn]);
}
