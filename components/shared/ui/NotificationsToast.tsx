"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRealtimeNotifications } from "@/hooks/notifications/useRealtimeNotifications";
import { useForegroundPush } from "@/hooks/notifications/useForegroundPush";
import { useBehaviorPushBridge } from "@/hooks/notifications/useBehaviorPushBridge";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import { isSafeInternalLink } from "@/lib/utils/internalLink";
import { type NotificationRow } from "@/lib/db/notifications";
import { type ForegroundPushMessage } from "@/lib/push/client";
import { IconBell, IconX } from "@/components/shared/icons";

type LiveToast = {
  id: string;
  title: string;
  body: string;
  /** رابط داخلي مُتحقَّق منه فقط */
  link?: string;
  /** معرّف الإشعار المحفوظ في القاعدة (لمّعاله كمقروء عند النقر) */
  notificationId?: string;
};

const TOAST_TTL_MS = 6000;

/**
 * Toast داخل التطبيق للإشعارات الجديدة الواردة عبر Realtime و FCM Foreground Push.
 * مسار عرض موحد يمنع التكرار (Deduplication) عبر notification_id، ويعرض
 * التوست لمدة 6 ثوانٍ مع إمكانية النقر والانتقال للرابط أو الإغلاق.
 */
export function NotificationsToast() {
  useBehaviorPushBridge();
  const { markAsRead } = useNotifications();
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
        const meta = (row.metadata ?? {}) as { slug?: unknown; link?: unknown };
        // نتحقق من الرابط الوارد من القاعدة — رابط قديم غير صالح يُتجاهل
        const link = isSafeInternalLink(meta.link)
          ? meta.link
          : typeof meta.slug === "string" && meta.slug.trim().length > 0
            ? `/craftsman/${encodeURIComponent(meta.slug.trim())}`
            : undefined;
        displayToast({
          id: row.id,
          title: row.title,
          body: row.body,
          link,
          notificationId: row.id,
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
        // رابط الـ FCM قد يكون مطلقاً — نحوّله لنسبي، ونرفض لو لم يكن داخلياً
        let link: string | undefined;
        if (msg.link) {
          try {
            const parsed = new URL(msg.link);
            if (typeof window !== "undefined" && parsed.origin === window.location.origin) {
              link = isSafeInternalLink(`${parsed.pathname}${parsed.search}`)
                ? `${parsed.pathname}${parsed.search}`
                : undefined;
            }
          } catch {
            // رابط غير قابل للتحليل (نسبية أصلاً أو تالف)
            link = isSafeInternalLink(msg.link) ? msg.link : undefined;
          }
        }
        displayToast({
          id,
          title: msg.title,
          body: msg.body,
          link,
          notificationId: msg.notificationId,
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
        const handleActivate = () => {
          // الإشعار المحفوظ يُعلَّم كمقروء عند التفاعل مع التوست
          if (toast.notificationId) void markAsRead(toast.notificationId);
          remove(toast.id);
        };
        const content = (
          <>
            <p className="text-sm font-bold text-foreground">{toast.title}</p>
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">
              {toast.body}
            </p>
          </>
        );
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
              <Link href={href} onClick={handleActivate} className="min-w-0 flex-1">
                {content}
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleActivate}
                className="min-w-0 flex-1 text-right"
              >
                {content}
              </button>
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
