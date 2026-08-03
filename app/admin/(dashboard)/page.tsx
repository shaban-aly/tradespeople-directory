"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconChart,
  IconInbox,
  IconMail,
  IconPin,
  IconRefresh,
  IconTags,
  IconTrendingUp,
  IconUsers,
} from "@/components/shared/icons";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminDashboard } from "@/hooks/admin/useAdminDashboard";
import { useGaStats } from "@/hooks/admin/useGaStats";
import { useToast } from "@/hooks/ui/useToast";
import { toArabicDigits } from "@/lib/utils/format";

export default function OverviewPage() {
  const { toast } = useToast();
  const {
    requests,
    categories,
    areas,
    craftsmen,
    messages,
    loading,
    error,
    busyKey,
    approveRequest,
    rejectRequest,
    refresh,
  } = useAdminDashboard({
    requests: true,
    categories: true,
    areas: true,
    craftsmen: true,
    messages: true,
  });

  const { overview: ga, loading: gaLoading, error: gaError, needsSetup } =
    useGaStats();

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  if (loading) return <DashboardLoading />;

  const publishedCraftsmen = craftsmen.filter((item) => item.is_published);
  const activeCategories = categories.filter((item) => item.is_active);
  const activeAreas = areas.filter((item) => item.is_active);
  const pendingRequests = requests.filter((item) => item.status === "pending");
  const unreadMessages = messages.filter((item) => !item.is_read).length;
  const recentRequests = requests.slice(0, 5);
  const recentCraftsmen = craftsmen.slice(0, 5);

  const categoryChart = categories
    .filter((item) => item.is_active)
    .map((category) => ({
      name: category.name,
      count: craftsmen.filter(
        (craftsman) => craftsman.category?.slug === category.slug,
      ).length,
    }))
    .sort((a, b) => b.count - a.count);
  const maxCount = Math.max(1, ...categoryChart.map((item) => item.count));

  const totalCalls = craftsmen.reduce(
    (sum, item) => sum + (item.stats?.calls ?? 0),
    0,
  );
  const totalWhatsapp = craftsmen.reduce(
    (sum, item) => sum + (item.stats?.whatsapp ?? 0),
    0,
  );
  const totalViews = craftsmen.reduce(
    (sum, item) => sum + (item.stats?.views ?? 0),
    0,
  );

  const mostContacted = [...craftsmen]
    .map((item) => ({
      craftsman: item,
      contacts: (item.stats?.calls ?? 0) + (item.stats?.whatsapp ?? 0),
    }))
    .filter((item) => item.contacts > 0)
    .sort((a, b) => b.contacts - a.contacts)
    .slice(0, 5);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="نظرة عامة"
        description="ملخص سريع لحالة الدليل اليوم."
        actions={
          <button
            type="button"
            onClick={() => void refresh()}
            className="flex min-h-12 items-center gap-2 rounded-xl border border-border px-4 text-base font-bold text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <IconRefresh className="h-5 w-5" />
            تحديث
          </button>
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          icon={<IconUsers className="h-6 w-6" />}
          label="صنايعية منشورين"
          value={toArabicDigits(publishedCraftsmen.length)}
          hint={`من إجمالي ${toArabicDigits(craftsmen.length)} صنايعي`}
        />
        <StatCard
          icon={<IconInbox className="h-6 w-6" />}
          label="طلبات معلقة"
          value={toArabicDigits(pendingRequests.length)}
          hint="بانتظار المراجعة"
        />
        <StatCard
          icon={<IconTags className="h-6 w-6" />}
          label="تصنيفات نشطة"
          value={toArabicDigits(activeCategories.length)}
          hint={`من إجمالي ${toArabicDigits(categories.length)}`}
        />
        <StatCard
          icon={<IconPin className="h-6 w-6" />}
          label="مناطق نشطة"
          value={toArabicDigits(activeAreas.length)}
          hint={`من إجمالي ${toArabicDigits(areas.length)}`}
        />
        <div className="col-span-2 lg:col-span-1">
          <Link href="/admin/messages" className="block">
            <StatCard
              icon={<IconMail className="h-6 w-6" />}
              label="رسائل غير مقروءة"
              value={toArabicDigits(unreadMessages)}
              hint="رسائل فورم التواصل"
            />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm text-muted">زوار اليوم</p>
              <p className="mt-1 font-heading text-2xl font-extrabold text-foreground">
                {ga && !gaLoading ? toArabicDigits(ga.todayUsers) : "—"}
              </p>
            </div>
            <div className="shrink-0 rounded-xl bg-accent/10 p-2.5 text-accent">
              <IconTrendingUp className="h-6 w-6" />
            </div>
          </div>
          <p className="truncate text-xs text-muted">
            {needsSetup
              ? "اضبط بيانات GA في المتغيرات"
              : gaError
                ? gaError
                : ga
                  ? `مشاهدات الصفحات: ${toArabicDigits(ga.todayPageviews)}`
                  : "جاري التحميل..."}
          </p>
        </div>
        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm text-muted">زوار آخر 7 أيام</p>
              <p className="mt-1 font-heading text-2xl font-extrabold text-foreground">
                {ga && !gaLoading ? toArabicDigits(ga.weekUsers) : "—"}
              </p>
            </div>
            <div className="shrink-0 rounded-xl bg-accent/10 p-2.5 text-accent">
              <IconTrendingUp className="h-6 w-6" />
            </div>
          </div>
          <p className="truncate text-xs text-muted">
            {needsSetup
              ? "اضبط بيانات GA في المتغيرات"
              : gaError
                ? gaError
                : ga
                  ? `مشاهدات الصفحات: ${toArabicDigits(ga.weekPageviews)}`
                  : "جاري التحميل..."}
          </p>
        </div>
        <StatCard
          icon={<IconUsers className="h-6 w-6" />}
          label="ضغطات الموبايل"
          value={toArabicDigits(totalCalls)}
          hint="على زراير الاتصال"
        />
        <StatCard
          icon={<IconUsers className="h-6 w-6" />}
          label="ضغطات الواتساب"
          value={toArabicDigits(totalWhatsapp)}
          hint="على زراير الواتساب"
        />
        <StatCard
          icon={<IconChart className="h-6 w-6" />}
          label="مشاهدات الصنايعية"
          value={toArabicDigits(totalViews)}
          hint="صفحات تفاصيل الصنايعية"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">
                صنايعية لكل تخصص
              </h2>
              <p className="mt-1 text-base text-muted">
                عدد الصنايعية المسجلين في كل تصنيف نشط
              </p>
            </div>
            <IconChart className="h-6 w-6 text-muted" />
          </div>
          {categoryChart.length === 0 ? (
            <EmptyState title="لا توجد تصنيفات نشطة حالياً" />
          ) : (
            <div className="grid gap-3">
              {categoryChart.map((item) => (
                <div key={item.name} className="grid gap-1">
                  <div className="flex items-center justify-between text-base">
                    <span className="font-bold text-foreground">{item.name}</span>
                    <span className="text-muted">{toArabicDigits(item.count)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">
                أحدث الطلبات
              </h2>
              <p className="mt-1 text-base text-muted">آخر 5 طلبات واردة</p>
            </div>
            <Link
              href="/admin/requests"
              className="min-h-12 rounded-xl border border-border px-4 py-2.5 text-base font-bold text-accent transition-colors hover:bg-accent/10"
            >
              الكل
            </Link>
          </div>
          {recentRequests.length === 0 ? (
            <EmptyState title="لا توجد طلبات حالياً" />
          ) : (
            <div className="grid gap-3">
              {recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="grid gap-3 rounded-xl border border-border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        variant={
                          request.status === "pending"
                            ? "pending"
                            : request.status === "approved"
                              ? "approved"
                              : "rejected"
                        }
                      >
                        {request.status === "pending"
                          ? "معلق"
                          : request.status === "approved"
                            ? "مقبول"
                            : "مرفوض"}
                      </StatusBadge>
                      <span className="text-base font-bold text-foreground">
                        {request.type === "register" ? "طلب تسجيل" : "بلاغ"}
                      </span>
                    </div>
                    <span className="text-base text-muted">
                      {toArabicDigits(request.created_at.slice(0, 10))}
                    </span>
                  </div>
                  <p className="truncate text-base text-muted">
                    {request.type === "register"
                      ? request.name
                      : request.craftsman_name}
                  </p>
                  {request.status === "pending" && (
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={busyKey === `approve-${request.id}`}
                        onClick={() => void approveRequest(request)}
                        className="min-h-12 rounded-xl bg-action px-4 text-base font-bold text-on-action disabled:opacity-50"
                      >
                        {busyKey === `approve-${request.id}` ? "جاري..." : "موافقة"}
                      </button>
                      <button
                        type="button"
                        disabled={busyKey === `reject-${request.id}`}
                        onClick={() => void rejectRequest(request.id)}
                        className="min-h-12 rounded-xl border border-danger/40 px-4 text-base font-bold text-danger disabled:opacity-50"
                      >
                        {busyKey === `reject-${request.id}` ? "جاري..." : "رفض"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              الأكثر تواصلاً
            </h2>
            <p className="mt-1 text-base text-muted">
              أعلى صنايعية من حيث ضغطات الاتصال والواتساب
            </p>
          </div>
          <IconTrendingUp className="h-6 w-6 text-muted" />
        </div>
        {mostContacted.length === 0 ? (
          <EmptyState title="لا توجد ضغطات مسجلة بعد" />
        ) : (
          <div className="grid gap-3">
            {mostContacted.map((item, index) => (
              <div
                key={item.craftsman.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 font-heading text-base font-extrabold text-accent">
                    {toArabicDigits(index + 1)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-foreground">
                      {item.craftsman.name}
                    </p>
                    <p className="truncate text-base text-muted">
                      {item.craftsman.category?.name} · {item.craftsman.area?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-base text-muted">
                  <span>
                    {toArabicDigits(item.craftsman.stats?.calls ?? 0)} اتصال
                  </span>
                  <span className="text-border">·</span>
                  <span>
                    {toArabicDigits(item.craftsman.stats?.whatsapp ?? 0)} واتساب
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              أحدث الصنايعية
            </h2>
            <p className="mt-1 text-base text-muted">آخر 5 مضافين</p>
          </div>
          <Link
            href="/admin/craftsmen"
            className="min-h-12 rounded-xl border border-border px-4 py-2.5 text-base font-bold text-accent transition-colors hover:bg-accent/10"
          >
            الكل
          </Link>
        </div>
        {recentCraftsmen.length === 0 ? (
          <EmptyState title="لا يوجد صنايعية بعد" />
        ) : (
          <div className="grid gap-3">
            {recentCraftsmen.map((craftsman) => (
              <div
                key={craftsman.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {craftsman.image_url ? (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                      <Image
                        src={craftsman.image_url}
                        alt={craftsman.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <IconUsers className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-foreground">
                      {craftsman.name}
                    </p>
                    <p className="truncate text-base text-muted">
                      {craftsman.category?.name} · {craftsman.area?.name}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge variant={craftsman.verified ? "active" : "inactive"}>
                    {craftsman.verified ? "موثّق" : "غير موثق"}
                  </StatusBadge>
                  <StatusBadge
                    variant={craftsman.is_published ? "active" : "inactive"}
                  >
                    {craftsman.is_published ? "منشور" : "مخفي"}
                  </StatusBadge>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
