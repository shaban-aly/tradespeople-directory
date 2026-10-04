"use client";

import { useEffect, useRef } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

/**
 * تفعيل إشعارات المتصفح عند أول تفاعل حقيقي من المستخدم.
 *
 * القاعدة: `Notification.requestPermission()` يجب أن يُستدعى داخل user gesture،
 * وإلا رفضته المتصفحات (Safari/iOS وChrome على 일부 الأنسجة) ورُفضت الفرصة
 * نهائياً دون أن يُعرف المستخدم أصلاً أن هناك إذناً يُطلب.
 *
 * لماذا كان التفعيل التلقائي عند التحميل فكرة سيئة:
 *   الاستدعاء كان يقع داخل `useEffect` عند أول زيارة، و`attemptedRef.current`
 *   كان يُضبط قبل معرفة نتيجة الطلب. فإذا رفض المتصفح الطلب لعدم وجود gesture
 *   (لا لأن المستخدم رفض) تُسجَّل محاولة فاشلة واحدة ولا تُعاد المحاولة أبداً،
 *   وتضيع فرصة التفعيل في كل زيارات المستخدم القادمة.
 *
 * السلوك الصحيح هنا:
 *   1) لا طلب تلقائي عند التحميل — فقط تسجيل المستمعين.
 *   2) `attemptedRef` يُضبط فقط عند بدء طلب الإذن من تفاعل حقيقي.
 *   3) إن لم يتفاعل المستخدم، لا يُسجَّل رفض ولا تُلغى فرصة التفعيل.
 *   4) التفعيل اليدوي متاح دائماً عبر زر الإعدادات (PushSettingsCard).
 */
export function useAutoPushEnabler(): void {
  const { status, enable } = usePushNotifications();
  const attemptedRef = useRef(false);
  // نحتفظ بمرجع لدالة enable المستقرة حتى لا نُعيد ربط المستمعين كل رندر
  const enableRef = useRef(enable);
  useEffect(() => {
    enableRef.current = enable;
  }, [enable]);

  useEffect(() => {
    if (attemptedRef.current) return;
    if (status !== "idle") return;
    if (typeof Notification === "undefined") return;
    // permission === "denied" قرار من المستخدم — نحترمه ولا نلمس شيئاً.
    // أما "default" فالمتصفح لم يسأل بعد — ننتظر تفاعلاً حقيقياً.
    if (Notification.permission !== "default") return;

    // الفحص آمن ولا يرمي استثناءات، فبلا try/catch
    const attempt = () => {
      if (attemptedRef.current) return;
      // نضبط العلامة فقط الآن — أي بعد وجود تفاعل حقيقي وبلا رمي
      attemptedRef.current = true;
      cleanup();
      void enableRef.current();
    };

    function cleanup() {
      window.removeEventListener("pointerdown", attempt);
      window.removeEventListener("click", attempt);
      window.removeEventListener("keydown", attempt);
      window.removeEventListener("touchstart", attempt);
    }

    window.addEventListener("pointerdown", attempt, { passive: true });
    window.addEventListener("click", attempt, { passive: true });
    window.addEventListener("keydown", attempt);
    window.addEventListener("touchstart", attempt, { passive: true });

    return cleanup;
  }, [status]);
}
