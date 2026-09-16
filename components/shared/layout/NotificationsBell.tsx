"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/auth/useSession";
import { useNotifications } from "@/hooks/useNotifications";
import { IconBell, IconCheck, IconInbox } from "@/components/shared/icons";

type NotificationMeta = {
  slug?: string;
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "الآن";
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `منذ ${diffDays} يوم`;

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function NotificationsBell() {
  const { isLoggedIn } = useSession();
  const { items, unreadCount, markAllRead } = useNotifications();
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
          className="absolute left-0 z-50 mt-2 w-80 origin-top-left rounded-2xl border border-border bg-card shadow-card overflow-hidden sm:w-96"
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
                          {formatTime(n.created_at)}
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
                            if (!n.read_at) void markAllRead();
                          }}
                          className={`block px-4 py-3 transition-colors hover:bg-accent/10 ${
                            n.read_at ? "opacity-70" : ""
                          }`}
                        >
                          {row}
                        </Link>
                      ) : (
                        <div
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
        </div>
      )}
    </div>
  );
}