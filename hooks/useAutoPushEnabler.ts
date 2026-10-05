"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

/**
 * تفعيل إشعارات المتصفح عند أول تفاعل حقيقي من المستخدم.
 *
 * القاعدة: `Notification.requestPermission()` يجب أن يُستدعى داخل user gesture،
 * وإلا رفضته المتصفحات (Safari/iOS وChrome على بعض الأنسجة) ورُفضت الفرصة
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
 *   2) العلم يُضبط أثناء المحاولة الجارية فقط (لا يُثبَّت)، فإذا فشلت تُعاد
 *      دورة الإصغاء من جديد ويُتاح للمستخدم فرصة ثانية بلا إعادة تحميل.
 *   3) إن لم يتفاعل المستخدم، لا يُسجَّل رفض ولا تُلغى فرصة التفعيل.
 *   4) التفعيل اليدوي متاح دائماً عبر زر الإعدادات (PushSettingsCard).
 */
export function useAutoPushEnabler(): void {
  const { status, enable } = usePushNotifications();
  const inFlightRef = useRef(false);
  // `cycle` يُعيد تشغيل تأثير الإصغاء بعد كل محاولة فاشلة. الاعتماد على
  // `status` وحده لا يكفي لأن الحالة تعود إلى نفس القيمة "idle" فلا يُعاد
  // تشغيل التأثير، فتبقى فرصة المستخدم الثانية ضائعة.
  const [cycle, setCycle] = useState(0);

  const enableRef = useRef(enable);
  useEffect(() => {
    enableRef.current = enable;
  }, [enable]);

  const rearm = useCallback(() => {
    setCycle((n) => n + 1);
  }, []);

  useEffect(() => {
    if (inFlightRef.current) return;
    if (status !== "idle") return;
    if (typeof Notification === "undefined") return;
    // permission === "denied" قرار من المستخدم — نحترمه ولا نلمس شيئاً.
    // أما "default" فالمتصفح لم يسأل بعد — ننتظر تفاعلاً حقيقياً.
    if (Notification.permission !== "default") return;

    // الفحص آمن ولا يرمي استثناءات، فبلا try/catch
    const attempt = () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      cleanup();
      void enableRef
        .current()
        .catch(() => undefined)
        .finally(() => {
          inFlightRef.current = false;
          // أي فشل (ف 네트워크، أو رفض المتصفح بلا gesture، أو تعذّر
          // التسجيل) يعيد بناء المستمعين بدل تثبيت اللوحة إلى الأبد.
          rearm();
        });
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
  }, [status, cycle, rearm]);
}