import type { Metadata } from "next";
import Link from "next/link";
import { NotificationsFullPage } from "@/components/notifications/NotificationsFullPage";
import { IconSettings } from "@/components/shared/icons";

export const metadata: Metadata = {
  title: "الإشعارات — دليل الصنايعية",
  description: "كل الإشعارات والتنبيهات الخاصة بحسابك في دليل الصنايعية بالسويس.",
  robots: { index: false, follow: false },
};

export default function NotificationsPage() {
  return (
    <>
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-5xl px-4 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-muted">دليل الصنايعية · السويس</p>
              <h1 className="mt-1 font-heading text-3xl font-extrabold sm:text-4xl text-foreground">
                الإشعارات
              </h1>
              <p className="mt-2 max-w-xl text-base text-muted">
                آخر الأحداث والتنبيهات الخاصة بحسابك — تقييمات، تحديثات الطلبات، ورسائل الفنيين.
              </p>
            </div>

            <Link
              href="/profile"
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-bold text-muted hover:border-accent hover:text-accent transition-colors shadow-2xs sm:self-center"
            >
              <IconSettings className="h-4 w-4" />
              <span>إعدادات إشعارات المتصفح</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-8">
        <NotificationsFullPage />
      </section>
    </>
  );
}