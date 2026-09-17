"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/auth/useSession";
import { useNotifications } from "@/hooks/useNotifications";
import { formatRelativeTime } from "@/lib/utils/formatTime";
import { IconBell, IconCheck, IconInbox } from "@/components/shared/icons";

type NotificationMeta = {
  slug?: string;
};

export function NotificationsBell() {
  const { isLoggedIn } = useSession();
  const { items, unreadCount, markAllRead, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // إغلاق اللوحة عند النقر خارجها
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        id="header-notifications-btn"
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent/10"
        aria-label="الإشعارات"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <IconBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent"
            aria-label={`${unreadCount} إشعارات غير مقروءة`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="الإشعارات"
          className="fixed left-1/2 top-16 z-50 w-[min(calc(100vw-2rem),24rem)] -translate-x-1/2 origin-top rounded-2xl border border-border bg-card shadow-card overflow-hidden sm:absolute sm:left-0 sm:top-auto sm:mt-2 sm:w-96 sm:translate-x-0 sm:origin-top-left"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-bold text-foreground">الإشعارات</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="flex items-center gap-1 text-xs font-semibold text-accent transition-colors hover:text-accent/80"
              >
                <IconCheck className="h-3.5 w-3.5" />
                تعليم الكل كمقروء
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <IconInbox className="h-8 w-8 text-muted" />
                <p className="text-sm text-muted">لا توجد إشعارات حتى الآن</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((n) => {
                  const meta = (n.metadata ?? {}) as NotificationMeta;
                  const href = meta.slug
                    ? `/craftsman/${meta.slug}`
                    : n.type.startsWith("new_")
                      ? "/admin"
                      : null;
                  const row = (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {n.title}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted">
                          {formatRelativeTime(n.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">
                        {n.body}
                      </p>
                    </>
                  );
                  return (
                    <li key={n.id}>
                      {href ? (
                        <Link
                          href={href}
                          onClick={() => {
                            setOpen(false);
                            if (!n.read_at) void markAsRead(n.id);
                          }}
                          className={`block px-4 py-3 transition-colors hover:bg-accent/10 ${
                            n.read_at ? "opacity-70" : ""
                          }`}
                        >
                          {row}
                        </Link>
                      ) : (
                        <div
                          onClick={() => {
                            if (!n.read_at) void markAsRead(n.id);
                          }}
                          className={`block px-4 py-3 transition-colors hover:bg-accent/10 ${
                            n.read_at ? "opacity-70" : ""
                          }`}
                        >
                          {row}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-border p-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
            >
              <IconInbox className="h-4 w-4" />
              عرض كل الإشعارات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}