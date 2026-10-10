import { NotificationsSkeleton } from "@/components/notifications/NotificationsSkeleton";

/**
 * شاشة التحميل الهيكلية لصفحة /notifications
 * مطابقة تماماً لتخطيط الصفحة: هيدر بحدود سفلية + شبكة الإشعارات
 */
export default function NotificationsLoading() {
  return (
    <div role="status" aria-label="جاري تحميل صفحة الإشعارات">
      {/* ============ Header Section ============ */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-5xl px-4 py-8">
          <div className="h-4 w-36 animate-pulse rounded-md bg-border/70" />
          <div className="mt-2 h-9 w-40 animate-pulse rounded-xl bg-border" />
          <div className="mt-3 h-5 w-80 max-w-full animate-pulse rounded-md bg-border/60" />
        </div>
      </section>

      {/* ============ Content Section ============ */}
      <section className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="mx-auto w-full max-w-2xl">
          <NotificationsSkeleton count={5} />
        </div>
      </section>
    </div>
  );
}
