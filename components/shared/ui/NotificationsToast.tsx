"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useBehaviorPushBridge } from "@/hooks/useBehaviorPushBridge";
import { type NotificationRow } from "@/lib/db/notifications";
import { IconBell, IconX } from "@/components/shared/icons";

type LiveToast = {
  id: string;
  title: string;
  body: string;
  slug?: string;
};

const TOAST_TTL_MS = 6000;

/**
 * Toast داخل التطبيق للإشعارات الجديدة الواردة عبر Realtime (قناة Delivery
 * منفصلة عن المركز — جرس الهيدر). يُركَّب مرة واحدة في الهيدر المشترك، وكل
 * Toast يظهر 6 ثوانٍ ثم يختفي تلقائياً (يمكن إغلاقه مبكراً).
 */
export function NotificationsToast() {
  useBehaviorPushBridge();
  const [toasts, setToasts] = useState<LiveToast[]>([]);
  const seen = useRef(new Set<string>());

  const remove = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  useRealtimeNotifications(
    useCallback((row: NotificationRow) => {
      // منع التكرار عند إعادة الاشتراك أو مضاعفة الصف نفسه
      if (seen.current.has(row.id)) return;
      seen.current.add(row.id);
      if (seen.current.size > 200) seen.current.clear();

      const meta = (row.metadata ?? {}) as { slug?: string };
      setToasts((list) =>
        [...list, { id: row.id, title: row.title, body: row.body, slug: meta.slug }].slice(-3),
      );
      window.setTimeout(() => {
        setToasts((list) => list.filter((t) => t.id !== row.id));
      }, TOAST_TTL_MS);
    }, []),
  );

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed top-16 left-1/2 z-[120] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((toast) => {
        const href = toast.slug ? `/craftsman/${toast.slug}` : null;
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