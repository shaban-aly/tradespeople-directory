"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useForegroundPush } from "@/hooks/useForegroundPush";
import { useBehaviorPushBridge } from "@/hooks/useBehaviorPushBridge";
import { type NotificationRow } from "@/lib/db/notifications";
import { type ForegroundPushMessage } from "@/lib/push/client";
import { IconBell, IconX } from "@/components/shared/icons";

type LiveToast = {
  id: string;
  title: string;
  body: string;
  link?: string;
};

const TOAST_TTL_MS = 6000;

/**
 * Toast داخل التطبيق للإشعارات الجديدة الواردة عبر Realtime و FCM Foreground Push.
 * مسار عرض موحد يمنع التكرار (Deduplication) عبر notification_id، ويعرض
 * التوست لمدة 6 ثوانٍ مع إمكانية النقر والانتقال للرابط أو الإغلاق.
 */
export function NotificationsToast() {
  useBehaviorPushBridge();
  const [toasts, setToasts] = useState<LiveToast[]>([]);
  const seen = useRef(new Set<string>());

  const remove = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  // مسار العرض الموحد: يفحص الـ ID ويمنع التكرار تماماً بين Realtime و FCM Push
  const displayToast = useCallback((toast: LiveToast) => {
    if (!toast.id || seen.current.has(toast.id)) return;
    seen.current.add(toast.id);
    if (seen.current.size > 200) seen.current.clear();

    setToasts((list) => [...list, toast].slice(-3));
    window.setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== toast.id));
    }, TOAST_TTL_MS);
  }, []);

  // 1. مسار Supabase Realtime (للمستخدمين المسجلين)
  useRealtimeNotifications(
    useCallback(
      (row: NotificationRow) => {
        const meta = (row.metadata ?? {}) as { slug?: string };
        const link = meta.slug ? `/craftsman/${meta.slug}` : undefined;
        displayToast({
          id: row.id,
          title: row.title,
          body: row.body,
          link,
        });
      },
      [displayToast],
    ),
  );

  // 2. مسار FCM Foreground Push (للمسجلين والزوار في الـ foreground)
  useForegroundPush(
    useCallback(
      (msg: ForegroundPushMessage) => {
        const id = msg.notificationId || `fcm-${msg.title}-${msg.body}`;
        displayToast({
          id,
          title: msg.title,
          body: msg.body,
          link: msg.link,
        });
      },
      [displayToast],
    ),
  );

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed top-16 left-1/2 z-[120] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((toast) => {
        const href = toast.link || null;
        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
          >
            <div className="flex shrink-0 items-center gap-2 text-action dark:text-action">
              <IconBell className="h-5 w-5" />
            </div>
            {href ? (
              <Link href={href} className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">{toast.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">
                  {toast.body}
                </p>
              </Link>
            ) : (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">{toast.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">
                  {toast.body}
                </p>
              </div>
            )}
            <button
              type="button"
              aria-label="إغلاق الإشعار"
              onClick={() => remove(toast.id)}
              className="shrink-0 rounded-lg p-1 text-muted transition-colors hover:text-foreground"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}