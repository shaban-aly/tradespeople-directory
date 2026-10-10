"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/auth/useSession";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { NotificationsSkeleton } from "@/components/notifications/NotificationsSkeleton";
import { formatRelativeTime } from "@/lib/utils/formatTime";
import { resolveNotificationHref } from "@/lib/utils/notificationLink";
import { toArabicDigits } from "@/lib/utils/format";
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
      return { Icon: IconBell, tone: "bg-accent/15 text-accent" };
    default:
      return { Icon: IconBell, tone: "bg-accent/10 text-accent" };
  }
}

function NotificationRowItem({
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
  const isUnread = !n.read_at;

  const row = (
    <>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="flex flex-wrap items-center gap-1.5 text-base font-bold text-foreground">
            {n.title}
            {n.type === "admin_broadcast" && (
              <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                من الإدارة
              </span>
            )}
          </span>
          <span className="shrink-0 text-xs text-muted">
            {formatRelativeTime(n.created_at)}
          </span>
        </span>
        <span
          className={`mt-1 block text-sm leading-relaxed ${
            isUnread ? "text-foreground/90 font-medium" : "text-muted"
          }`}
        >
          {n.body}
        </span>
      </span>
      {isUnread && (
        <span
          className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent ring-4 ring-accent/15"
          aria-label="إشعار غير مقروء"
        />
      )}
    </>
  );

  const classes = `flex min-h-12 w-full items-start gap-3.5 px-4 py-4 text-start transition-colors hover:bg-muted/10 ${
    isUnread ? "bg-accent/4 dark:bg-accent/8" : "bg-card"
  }`;

  return (
    <li>
      {href ? (
        <Link
          href={href}
          className={classes}
          onClick={() => {
            if (isUnread) onMarkRead?.(n.id);
          }}
        >
          {row}
        </Link>
      ) : (
        <button
          type="button"
          className={classes}
          onClick={() => {
            if (isUnread) onMarkRead?.(n.id);
          }}
        >
          {row}
        </button>
      )}
    </li>
  );
}

function formatUnreadText(count: number): string {
  if (count === 0) return "كل الإشعارات مقروءة";
  if (count === 1) return "إشعار واحد غير مقروء";
  if (count === 2) return "إشعاران غير مقروءين";
  if (count <= 10) return `${toArabicDigits(count)} إشعارات غير مقروءة`;
  return `${toArabicDigits(count)} إشعاراً غير مقروء`;
}

export function NotificationsFullPage() {
  const { isLoggedIn, isAdmin, user, loading: sessionLoading } = useSession();
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

  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadItems = useMemo(() => items.filter((n) => !n.read_at), [items]);
  const displayedItems = filter === "unread" ? unreadItems : items;

  // إظهار الهيكل أثناء تحميل الجلسة أو التحميل الأولي للإشعارات لمنع الشاشة البيضاء
  if (sessionLoading || (loading && items.length === 0)) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <NotificationsSkeleton count={5} />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  // الخطأ حالة منفصلة عن الفراغ: لا «لا توجد إشعارات» إلا بنجاح حقيقي بلا صفوف.
  const showErrorState = error !== null && items.length === 0;
  const showEmptyState = error === null && !loading && items.length === 0;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {/* شريط الأدوات والفلاتر */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        {/* تبويبات الفلترة: الكل مقابل غير المقروءة */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              filter === "all"
                ? "bg-accent text-on-accent shadow-2xs"
                : "border border-border bg-background text-muted hover:text-foreground"
            }`}
          >
            الكل ({toArabicDigits(items.length)})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              filter === "unread"
                ? "bg-accent text-on-accent shadow-2xs"
                : "border border-border bg-background text-muted hover:text-foreground"
            }`}
          >
            غير المقروءة ({toArabicDigits(unreadCount)})
          </button>
        </div>

        {/* عدّاد وحالة المقروء */}
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-xs font-semibold text-muted">
            {formatUnreadText(unreadCount)}
          </span>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={markingAll}
              aria-busy={markingAll}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <IconCheck className="h-4 w-4" />
              <span>{markingAll ? "جارٍ التعليم…" : "تعليم الكل كمقروء"}</span>
            </button>
          )}
        </div>
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
            className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-danger underline-offset-4 hover:underline"
          >
            <IconRefresh className="h-4 w-4" />
            إعادة المحاولة
          </button>
        </div>
      )}

      {showErrorState ? (
        <EmptyState
          icon={<IconAlert className="h-6 w-6" />}
          title="تعذّر تحميل إشعاراتك"
          description={error ?? "حدث خطأ أثناء الاتصال. جرّب مرة أخرى."}
          action={
            <button
              type="button"
              onClick={() => void refresh()}
              className="flex min-h-12 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-on-accent transition-colors hover:bg-accent/90"
            >
              <IconRefresh className="h-4 w-4" />
              إعادة المحاولة
            </button>
          }
        />
      ) : showEmptyState ? (
        <EmptyState
          icon={<IconInbox className="h-6 w-6" />}
          title="لا توجد إشعارات حتى الآن"
          description="ستصلك تنبيهات بأي تحديثات على طلباتك أو ردود الفنيين أو تقييماتك في السويس فور حدوثها."
        />
      ) : filter === "unread" && displayedItems.length === 0 ? (
        <EmptyState
          icon={<IconCheck className="h-6 w-6 text-accent" />}
          title="كل الإشعارات مقروءة!"
          description="لقد اطلعت على كافة التنبيهات السابقة، ولا توجد أي إشعارات جديدة حالياً."
          action={
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold text-foreground transition-colors hover:border-accent hover:text-accent shadow-2xs"
            >
              عرض كل الإشعارات ({toArabicDigits(items.length)})
            </button>
          }
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {displayedItems.map((n) => (
            <NotificationRowItem
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
