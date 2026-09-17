"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/hooks/auth/useSession";
import { usePushNotifications } from "@/hooks/usePushNotifications";

/**
 * تفعيل تلقائي لإشعارات المتصفح لجميع المستخدمين (زوار مجهولين ومسجلين).
 *
 * منطق السلوك:
 * 1. عند دخول أي مستخدم للموقع (ولم يكن قد رفض الإذن سابقاً أو أوقفه صراحة من الموقع)،
 *    يتم إطلاق طلب إذن الإشعارات فوراً من المتصفح (مع الاستماع لأول تفاعل لضمان توافق قيود المتصفحات).
 * 2. فور موافقة المستخدم، يُستخرج FCM Token ويُسجَّل فوراً في Supabase:
 *    - للمسجّل: في user_push_tokens مع ربطه بحسابه.
 *    - للزائر: في anonymous_push_subscriptions مع ربط اهتماماته التلقائية.
 * 3. لا يتطلب أي زر متابعة أو دخول لصفحة الإعدادات.
 */
export function useAutoPushEnabler(): void {
  const { isLoggedIn } = useSession();
  const { status, enable } = usePushNotifications();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (attemptedRef.current) return;
    if (status !== "idle") return;
    if (typeof Notification === "undefined" || Notification.permission === "denied") {
      return;
    }

    const attempt = () => {
      if (attemptedRef.current) return;
      attemptedRef.current = true;
      cleanup();
      void enable();
    };

    function cleanup() {
      window.removeEventListener("pointerdown", attempt);
      window.removeEventListener("click", attempt);
      window.removeEventListener("keydown", attempt);
      window.removeEventListener("touchstart", attempt);
    }

    // محاولة الطلب المباشر عند تحميل الصفحة
    try {
      if (Notification.permission === "default") {
        void attempt();
      }
    } catch {
      // تجاهل في حال اعترض المتصفح
    }

    // الاستماع لأول تفاعل لضمان إطلاق نافذة الإذن داخل user gesture
    window.addEventListener("pointerdown", attempt, { passive: true });
    window.addEventListener("click", attempt, { passive: true });
    window.addEventListener("keydown", attempt);
    window.addEventListener("touchstart", attempt, { passive: true });

    return cleanup;
  }, [isLoggedIn, status, enable]);
}