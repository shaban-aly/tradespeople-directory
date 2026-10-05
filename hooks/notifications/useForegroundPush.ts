"use client";

import { useEffect, useRef } from "react";
import {
  listenToForegroundPush,
  type ForegroundPushMessage,
} from "@/lib/push/client";

/**
 * هوك استقبال إشعارات FCM أثناء عمل التطبيق في المقدمة (Foreground).
 * يضمن تسجيل المستمع مرة واحدة فقط، ويحدث الـ callback دون إعادة الاشتراك،
 * ويقوم بإلغاء الاشتراك تلقائياً عند unmount المكون.
 */
export function useForegroundPush(
  onMessage: (message: ForegroundPushMessage) => void,
): void {
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    return listenToForegroundPush((msg) => {
      onMessageRef.current(msg);
    });
  }, []);
}
