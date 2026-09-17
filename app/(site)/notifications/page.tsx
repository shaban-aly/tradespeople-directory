import type { Metadata } from "next";
import { NotificationsFullPage } from "@/components/notifications/NotificationsFullPage";

export const metadata: Metadata = {
  title: "الإشعارات — دليل الصنايعية",
  description: "كل الإشعارات الخاصة بحسابك في دليل الصنايعية.",
  robots: { index: false, follow: false },
};

export default function NotificationsPage() {
  return (
    <>
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-5xl px-4 py-8">
          <p className="text-sm font-bold text-muted">دليل الصنايعية · السويس</p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold sm:text-4xl">
            الإشعارات
          </h1>
          <p className="mt-2 max-w-xl text-base text-muted">
            آخر الأحداث الخاصة بحسابك — تقييمات، تحديثات، ورسائل.
          </p>
          <p className="mt-2 max-w-lg text-xs text-muted leading-relaxed">
            تُفعَّل إشعارات المتصفح تلقائياً أول ما توافق على إذن المتصفح — يمكنك إيقافها أو إعادة تشغيلها من الملف الشخصي.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-8">
        <NotificationsFullPage />
      </section>
    </>
  );
}