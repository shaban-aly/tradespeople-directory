"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const initSw = async () => {
      try {
        const origin = window.location.origin;

        // 1. فحص محدد وآمن لتسجيلات الـ Service Worker التابعة لنفس أصل هذا الموقع فقط
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.scope.startsWith(origin)) {
            const scriptUrl =
              reg.active?.scriptURL ||
              reg.installing?.scriptURL ||
              reg.waiting?.scriptURL;

            // إلغاء أي registration قديم منفصل لـ firebase-messaging-sw.js لحسم التعارض
            if (scriptUrl && scriptUrl.includes("/firebase-messaging-sw.js")) {
              await reg.unregister();
            }
          }
        }

        // 2. تسجيل Service Worker الموحد للمشروع على scope: /
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // تجاهل أخطاء التسجيل الصامتة
      }
    };

    if (document.readyState === "complete") {
      void initSw();
    } else {
      window.addEventListener("load", () => void initSw(), { once: true });
    }
  }, []);

  return null;
}
