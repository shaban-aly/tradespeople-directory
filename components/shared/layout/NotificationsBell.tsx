"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSession } from "@/hooks/auth/useSession";
import { useNotifications } from "@/hooks/useNotifications";
import { useHydratedValue } from "@/hooks/ui/useHydratedValue";
import { formatRelativeTime } from "@/lib/utils/formatTime";
import { IconBell, IconCheck, IconInbox } from "@/components/shared/icons";

type NotificationMeta = {
  slug?: string;
  link?: string;
};

const PANEL_WIDTH = 384; // 24rem — عرض اللوحة على الديسكتوب
const VIEWPORT_GAP = 16; // 1rem — المسافة من حافة الشاشة على الموبايل

export function NotificationsBell() {
  const { isLoggedIn } = useSession();
  const { items, unreadCount, markAllRead, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mounted = useHydratedValue(false, () => true);

  // اللوحة بتتثبت على الـ viewport، فموضعها بيتحسب من قياس زرار الجرس.
  // بنرجّع نفس المرجع لما القياس ما يتغيّرش عشان مافيش re-render على كل إطار سكرول.
  function measure() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const isDesktop = window.matchMedia("(min-width: 640px)").matches;
    const width = isDesktop
      ? PANEL_WIDTH
      : Math.min(window.innerWidth - VIEWPORT_GAP * 2, PANEL_WIDTH);
    const next = {
      top: rect.bottom + 8,
      left: isDesktop ? rect.left : (window.innerWidth - width) / 2,
      width,
    };
    setPos((current) =>
      current &&
      current.top === next.top &&
      current.left === next.left &&
      current.width === next.width
        ? current
        : next,
    );
  }

  function handleToggle() {
    if (open) {
      setOpen(false);
      return;
    }
    measure();
    setOpen(true);
  }

  // إغلاق اللوحة عند النقر خارجها
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // اللوحة مربوطة بموضع محسوب: سكرول الصفحة وتغيير الحجم بيعيدوا القياس بدل
  // ما يقفلوها — وسكرول القائمة جوه اللوحة ما يستاهلش يعيد قياس أصلاً.
  useEffect(() => {
    if (!open) return;

    const handleScroll = (e: Event) => {
      if (e.target instanceof Node && panelRef.current?.contains(e.target)) return;
      measure();
    };

    // عنوان المتصفح على الموبايل بينكمش مع أي سكرول فيبعت resize.
    const handleResize = () => measure();

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="relative" ref={rootRef} data-tour="notifications-bell">
      <button
        ref={triggerRef}
        id="header-notifications-btn"
        type="button"
        onClick={handleToggle}
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

      {open && mounted && pos
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label="الإشعارات"
              style={{ top: pos.top, left: pos.left, width: pos.width }}
              className="fixed z-50 overflow-hidden rounded-2xl border border-border bg-card shadow-card"
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

            <div className="max-h-[min(20rem,calc(100dvh-14rem))] overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                  <IconInbox className="h-8 w-8 text-muted" />
                  <p className="text-sm text-muted">لا توجد إشعارات حتى الآن</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((n) => {
                    const meta = (n.metadata ?? {}) as NotificationMeta;
                    const href = meta.link
                      ? meta.link
                      : meta.slug
                        ? `/craftsman/${meta.slug}`
                        : n.type === "new_request" || n.type === "new_report" || n.type === "new_message"
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
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
