"use client";

import Link from "next/link";
import { useSession } from "@/hooks/auth/useSession";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { formatRelativeTime } from "@/lib/utils/formatTime";
import { resolveNotificationHref } from "@/lib/utils/notificationLink";
import type { NotificationRow } from "@/lib/db/notifications";
import {
  IconAlert,
  IconBell,
  IconCheck,
  IconGlobe,
  IconInbox,
  IconLink,
  IconMail,
  IconRefresh,
  IconShieldCheck,
  IconSparkles,
  IconStar,
  IconUserPlus,
  IconX,
} from "@/components/shared/icons";

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
  isAdmin,
  currentUserId,
}: {
  n: NotificationRow;
  onMarkRead?: (id: string) => void;
  isAdmin: boolean;
  currentUserId: string | null;
}) {
  const { Icon, tone } = iconForType(n.type);
  // رابط داخلي مُتحقَّق منه فقط — لا خروج عن الموقع ولا javascript:
  const href = resolveNotificationHref(n, { isAdmin, currentUserId });

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
  const { isLoggedIn, isAdmin, user } = useSession();
  const {
    items,
    unreadCount,
    loading,
    error,
    markingAll,
    markError,
    refresh,
    markAllRead,
    markAsRead,
  } = useNotifications();

  if (!isLoggedIn) {
    return null;
  }

  // الخطأ حالة منفصلة عن الفراغ: لا «لا توجد إشعارات» إلا بنجاح حقيقي بلا صفوف.
  const showErrorState = error !== null && items.length === 0;
  const showEmptyState = error === null && !loading && items.length === 0;

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
            disabled={markingAll}
            aria-busy={markingAll}
            className="flex min-h-12 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconCheck className="h-4 w-4" />
            {markingAll ? "جارٍ التعليم…" : "تعليم الكل كمقروء"}
          </button>
        )}
        </div>

        {markError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm leading-relaxed text-danger"
          >
            <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>لم يتم حفظ التعديل: {markError}</span>
          </div>
        )}

        {/* فشل العدّاد وحده: القائمة سليمة لكن العدد غير موثوق */}
        {error !== null && items.length > 0 && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm leading-relaxed text-danger"
          >
            <span className="flex items-start gap-2">
              <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
              تعذّر تحديث عدّاد الإشعارات: {error}
            </span>
            <button
              type="button"
              onClick={() => void refresh()}
              className="flex min-h-12 items-center gap-2 rounded-xl px-3 font-semibold text-danger underline-offset-4 hover:underline"
            >
              <IconRefresh className="h-4 w-4" />
              إعادة المحاولة
            </button>
          </div>
        )}
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
      ) : showErrorState ? (
        <EmptyState
          icon={<IconAlert className="h-6 w-6" />}
          title="تعذّر تحميل إشعاراتك"
          description={error ?? "حدث خطأ أثناء الاتصال. جرّب مرة أخرى."}
          action={
            <button
              type="button"
              onClick={() => void refresh()}
              className="flex min-h-12 items-center gap-2 rounded-xl px-4 text-base font-semibold text-accent transition-colors hover:bg-accent/10"
            >
              <IconRefresh className="h-4 w-4" />
              إعادة المحاولة
            </button>
          }
        />
      ) : showEmptyState ? (
        <EmptyState
          icon={<IconInbox className="h-6 w-6" />}
          title="لا توجد إشعارات"
          description="لما يحصل أي حدث جديد على حسابك (تقييمات، تحديثات، أو رسائل) هيظهر هنا."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {items.map((n) => (
            <NotificationRow
              key={n.id}
              n={n}
              onMarkRead={markAsRead}
              isAdmin={isAdmin}
              currentUserId={user?.id ?? null}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
