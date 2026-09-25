"use client";

import Link from "next/link";
import { useSession } from "@/hooks/auth/useSession";
import { useNotifications } from "@/hooks/useNotifications";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { formatRelativeTime } from "@/lib/utils/formatTime";
import type { NotificationRow } from "@/lib/db/notifications";
import {
  IconAlert,
  IconBell,
  IconCheck,
  IconGlobe,
  IconInbox,
  IconLink,
  IconMail,
  IconShieldCheck,
  IconSparkles,
  IconStar,
  IconUserPlus,
  IconX,
} from "@/components/shared/icons";

const PAGE_LIMIT = 200;

type NotificationMeta = {
  slug?: string;
  link?: string;
};

function iconForType(type: string) {
  switch (type) {
    case "join_approved":
      return { Icon: IconCheck, tone: "bg-accent/10 text-accent" };
    case "join_rejected":
      return { Icon: IconX, tone: "bg-danger/10 text-danger" };
    case "verified":
      return { Icon: IconShieldCheck, tone: "bg-accent/10 text-accent" };
    case "published":
      return { Icon: IconGlobe, tone: "bg-accent/10 text-accent" };
    case "account_linked":
      return { Icon: IconLink, tone: "bg-accent/10 text-accent" };
    case "review_added":
      return { Icon: IconStar, tone: "bg-accent/10 text-accent" };
    case "report_status":
      return { Icon: IconAlert, tone: "bg-danger/10 text-danger" };
    case "new_request":
    case "new_craftsman":
      return { Icon: IconUserPlus, tone: "bg-accent/10 text-accent" };
    case "new_report":
      return { Icon: IconAlert, tone: "bg-danger/10 text-danger" };
    case "new_message":
      return { Icon: IconMail, tone: "bg-accent/10 text-accent" };
    case "welcome":
      return { Icon: IconSparkles, tone: "bg-accent/10 text-accent" };
    case "admin_broadcast":
      return { Icon: IconBell, tone: "bg-blue-500/10 text-blue-500" };
    default:
      return { Icon: IconBell, tone: "bg-accent/10 text-accent" };
  }
}

function NotificationRow({
  n,
  onMarkRead,
}: {
  n: NotificationRow;
  onMarkRead?: (id: string) => void;
}) {
  const { Icon, tone } = iconForType(n.type);
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
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="flex items-center gap-2 text-base font-semibold text-foreground">
            {n.title}
            {n.type === "admin_broadcast" && (
              <span className="shrink-0 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-500">
                من الإدارة
              </span>
            )}
          </span>
          <span className="shrink-0 text-[11px] text-muted">
            {formatRelativeTime(n.created_at)}
          </span>
        </span>
        <span className="mt-0.5 block line-clamp-2 text-sm leading-relaxed text-muted">
          {n.body}
        </span>
      </span>
      {!n.read_at && (
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent"
          aria-label="إشعار جديد"
        />
      )}
    </>
  );

  const classes = `flex items-start gap-3 px-4 py-4 transition-colors hover:bg-accent/10 ${
    n.read_at ? "opacity-70" : ""
  }`;

  return (
    <li key={n.id}>
      {href ? (
        <Link
          href={href}
          className={classes}
          onClick={() => {
            if (!n.read_at) onMarkRead?.(n.id);
          }}
        >
          {row}
        </Link>
      ) : (
        <div
          className={classes}
          onClick={() => {
            if (!n.read_at) onMarkRead?.(n.id);
          }}
        >
          {row}
        </div>
      )}
    </li>
  );
}

export function NotificationsFullPage() {
  const { isLoggedIn } = useSession();
  const { items, unreadCount, loading, markAllRead, markAsRead } = useNotifications(PAGE_LIMIT);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-4 space-y-4">
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-3">
        <p className="text-base font-bold text-foreground">
          {unreadCount > 0
            ? `${unreadCount} إشعارات غير مقروءة`
            : "كل الإشعارات مقروءة"}
        </p>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="flex min-h-12 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
          >
            <IconCheck className="h-4 w-4" />
            تعليم الكل كمقروء
          </button>
        )}
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="space-y-3" aria-busy="true" aria-label="جارٍ تحميل الإشعارات">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-border bg-card"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<IconInbox className="h-6 w-6" />}
          title="لا توجد إشعارات"
          description="لما يحصل أي حدث جديد على حسابك (تقييمات، تحديثات، أو رسائل) هيظهر هنا."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {items.map((n) => (
            <NotificationRow key={n.id} n={n} onMarkRead={markAsRead} />
          ))}
        </ul>
      )}
    </div>
  );
}