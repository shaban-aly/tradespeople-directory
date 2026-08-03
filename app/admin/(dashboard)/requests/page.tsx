"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  IconInbox,
  IconRefresh,
  IconTrash,
  IconUsers,
} from "@/components/shared/icons";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { Drawer } from "@/components/admin/Drawer";
import { EmptyState } from "@/components/admin/EmptyState";
import { Modal } from "@/components/admin/Modal";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  type JoinRequestRow,
  useAdminDashboard,
} from "@/hooks/admin/useAdminDashboard";
import { useToast } from "@/hooks/ui/useToast";
import { toArabicDigits } from "@/lib/utils/format";

type StatusFilter = "all" | "pending" | "approved" | "rejected";
type TypeTab = "all" | "register" | "report";

const TYPE_TABS: { value: TypeTab; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "register", label: "طلبات التسجيل" },
  { value: "report", label: "البلاغات" },
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "كل الحالات" },
  { value: "pending", label: "معلق" },
  { value: "approved", label: "مقبول" },
  { value: "rejected", label: "مرفوض" },
];

export default function RequestsPage() {
  const { toast } = useToast();
  const {
    requests,
    loading,
    error,
    busyKey,
    approveRequest,
    rejectRequest,
    deleteRequest,
    refresh,
  } = useAdminDashboard({ requests: true });
  const [typeTab, setTypeTab] = useState<TypeTab>("register");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [approveTarget, setApproveTarget] = useState<JoinRequestRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<JoinRequestRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JoinRequestRow | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<JoinRequestRow | null>(null);

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  const registerCount = requests.filter((item) => item.type === "register").length;
  const reportCount = requests.filter((item) => item.type === "report").length;
  const pendingCount = requests.filter((item) => item.status === "pending").length;

  const filteredRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          (typeTab === "all" || request.type === typeTab) &&
          (statusFilter === "all" || request.status === statusFilter),
      ),
    [requests, typeTab, statusFilter],
  );

  if (loading) return <DashboardLoading />;

  async function handleApprove() {
    if (!approveTarget) return;
    const ok = await approveRequest(approveTarget);
    if (ok) {
      toast("success", "تمت الموافقة ونشر الصنايعي في الدليل");
      setApproveTarget(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    const ok = await rejectRequest(rejectTarget.id);
    if (ok) {
      toast("success", "تم رفض الطلب");
      setRejectTarget(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const ok = await deleteRequest(deleteTarget.id);
    if (ok) {
      toast("success", "تم حذف الطلب نهائياً");
      setDeleteTarget(null);
    }
  }

  const statusVariant = (request: JoinRequestRow) =>
    request.status === "pending"
      ? ("pending" as const)
      : request.status === "approved"
        ? ("approved" as const)
        : ("rejected" as const);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="الطلبات"
        description={`${toArabicDigits(pendingCount)} طلب معلق بانتظار المراجعة.`}
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

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {TYPE_TABS.map((tab) => {
              const count =
                tab.value === "all"
                  ? requests.length
                  : tab.value === "register"
                    ? registerCount
                    : reportCount;
              const isActive = typeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setTypeTab(tab.value)}
                  className={`flex min-h-12 items-center gap-2 rounded-xl px-4 text-base font-bold transition-colors ${
                    isActive
                      ? "bg-accent text-on-accent"
                      : "border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-sm ${
                      isActive ? "bg-on-accent/20" : "bg-accent/10 text-accent"
                    }`}
                  >
                    {toArabicDigits(count)}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={`min-h-12 rounded-xl px-4 text-base font-bold transition-colors ${
                  statusFilter === filter.value
                    ? "bg-action text-on-action"
                    : "border border-border text-muted hover:text-foreground"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <EmptyState
            icon={<IconInbox className="h-8 w-8" />}
            title="لا توجد طلبات بهذا الفلتر"
            description="جرّب تغيير الفلتر أو راجع لاحقاً."
          />
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((request) => (
              <article
                key={request.id}
                className="grid gap-4 rounded-xl border border-border p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge variant={statusVariant(request)}>
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

                <div className="grid gap-2 text-base text-muted sm:grid-cols-2">
                  {request.type === "register" ? (
                    <>
                      <p>
                        <span className="font-bold text-foreground">الاسم: </span>
                        {request.name}
                      </p>
                      <p>
                        <span className="font-bold text-foreground">التخصص: </span>
                        {request.category?.name}
                      </p>
                      <p>
                        <span className="font-bold text-foreground">المنطقة: </span>
                        {request.area?.name}
                      </p>
                      <p dir="ltr" className="text-right">
                        <span className="font-bold text-foreground">الهاتف: </span>
                        {request.phone}
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <span className="font-bold text-foreground">الصنايعي: </span>
                        {request.craftsman_name}
                      </p>
                      <p dir="ltr" className="text-right">
                        <span className="font-bold text-foreground">رقم المبلغ: </span>
                        {request.phone}
                      </p>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDetailsTarget(request)}
                    className="min-h-12 rounded-xl border border-border px-4 text-base font-bold text-muted transition-colors hover:text-foreground"
                  >
                    التفاصيل
                  </button>
                  {request.status === "pending" && (
                    <>
                      <button
                        type="button"
                        disabled={busyKey === `approve-${request.id}`}
                        onClick={() => setApproveTarget(request)}
                        className="min-h-12 rounded-xl bg-action px-4 text-base font-bold text-on-action disabled:opacity-50"
                      >
                        موافقة
                      </button>
                      <button
                        type="button"
                        disabled={busyKey === `reject-${request.id}`}
                        onClick={() => setRejectTarget(request)}
                        className="min-h-12 rounded-xl border border-danger/40 px-4 text-base font-bold text-danger disabled:opacity-50"
                      >
                        رفض
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    aria-label="حذف الطلب"
                    disabled={busyKey === `delete-request-${request.id}`}
                    onClick={() => setDeleteTarget(request)}
                    className="rounded-xl border border-border p-3 text-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
                  >
                    <IconTrash className="h-5 w-5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={approveTarget !== null}
        onClose={() => setApproveTarget(null)}
        title="موافقة على طلب التسجيل"
        footer={
          <>
            <button
              type="button"
              onClick={() => setApproveTarget(null)}
              disabled={busyKey === `approve-${approveTarget?.id}`}
              className="min-h-12 rounded-xl border border-border px-4 text-base font-bold text-muted transition-colors hover:text-foreground"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={() => void handleApprove()}
              disabled={busyKey === `approve-${approveTarget?.id}`}
              className="min-h-12 rounded-xl bg-action px-4 text-base font-bold text-on-action disabled:opacity-50"
            >
              {busyKey === `approve-${approveTarget?.id}` ? "جاري النشر..." : "نشر الصنايعي"}
            </button>
          </>
        }
      >
        {approveTarget && (
          <div className="grid gap-4">
            <div className="rounded-xl border border-border p-4">
              <p className="mb-3 text-base font-bold text-foreground">
                معاينة الصنايعي قبل النشر
              </p>
              <div className="grid gap-2 text-base text-muted">
                <p>
                  <span className="font-bold text-foreground">الاسم: </span>
                  {approveTarget.name}
                </p>
                <p>
                  <span className="font-bold text-foreground">التخصص: </span>
                  {approveTarget.category?.name}
                </p>
                <p>
                  <span className="font-bold text-foreground">المنطقة: </span>
                  {approveTarget.area?.name}
                </p>
                <p dir="ltr" className="text-right">
                  <span className="font-bold text-foreground">الهاتف: </span>
                  {approveTarget.phone}
                </p>
                <p dir="ltr" className="text-right">
                  <span className="font-bold text-foreground">الرابط: </span>
                  /craftsman/
                  {approveTarget.category?.slug}-{approveTarget.id.slice(0, 8)}
                </p>
                {approveTarget.socialLinks?.length ? (
                  <div className="rounded-xl bg-background/40 p-3">
                    <p className="mb-1 text-sm font-bold text-foreground">
                      روابط السوشيال
                    </p>
                    {approveTarget.socialLinks.map((link) => (
                      <p key={link.platform} dir="ltr" className="truncate text-left">
                        {link.platform}: {link.url}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
              {approveTarget.image_url && (
                <div className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-xl">
                  <Image
                    src={approveTarget.image_url}
                    alt={approveTarget.name ?? "صورة الطلب"}
                    fill
                    sizes="(max-width: 640px) 100vw, 640px"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
            <p className="text-base text-muted">
              بعد الموافقة سيتاح الصنايعي في الدليل فوراً بنشر تلقائي.
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        onConfirm={() => void handleReject()}
        title="رفض الطلب"
        message="هل أنت متأكد من رفض هذا الطلب؟ لا يمكن التراجع عن هذا القرار."
        confirmLabel="رفض الطلب"
        danger
        busy={busyKey === `reject-${rejectTarget?.id}`}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="حذف الطلب"
        message="هل أنت متأكد من حذف هذا الطلب نهائياً؟ لا يمكن التراجع عن هذا القرار."
        confirmLabel="حذف الطلب"
        danger
        busy={busyKey === `delete-request-${deleteTarget?.id}`}
      />

      <Drawer
        open={detailsTarget !== null}
        onClose={() => setDetailsTarget(null)}
        title={detailsTarget?.type === "register" ? "تفاصيل طلب التسجيل" : "تفاصيل البلاغ"}
      >
        {detailsTarget && (
          <div className="grid gap-3 text-base text-muted">
            <p>
              <span className="font-bold text-foreground">الحالة: </span>
              {detailsTarget.status === "pending"
                ? "معلق"
                : detailsTarget.status === "approved"
                  ? "مقبول"
                  : "مرفوض"}
            </p>
            <p>
              <span className="font-bold text-foreground">النوع: </span>
              {detailsTarget.type === "register" ? "طلب تسجيل" : "بلاغ"}
            </p>
            <p>
              <span className="font-bold text-foreground">التاريخ: </span>
              {toArabicDigits(detailsTarget.created_at)}
            </p>
            {detailsTarget.type === "register" ? (
              <>
                <p>
                  <span className="font-bold text-foreground">الاسم: </span>
                  {detailsTarget.name}
                </p>
                <p>
                  <span className="font-bold text-foreground">التخصص: </span>
                  {detailsTarget.category?.name}
                </p>
                <p>
                  <span className="font-bold text-foreground">المنطقة: </span>
                  {detailsTarget.area?.name}
                </p>
                <p dir="ltr" className="text-right">
                  <span className="font-bold text-foreground">الهاتف: </span>
                  {detailsTarget.phone}
                </p>
                {detailsTarget.whatsapp && (
                  <p dir="ltr" className="text-right">
                    <span className="font-bold text-foreground">واتساب: </span>
                    {detailsTarget.whatsapp}
                  </p>
                )}
                {detailsTarget.description && (
                  <p>
                    <span className="font-bold text-foreground">الوصف: </span>
                    {detailsTarget.description}
                  </p>
                )}
                {detailsTarget.socialLinks?.length ? (
                  <div className="rounded-xl bg-background/40 p-3">
                    <p className="mb-1 text-sm font-bold text-foreground">
                      روابط السوشيال
                    </p>
                    {detailsTarget.socialLinks.map((link) => (
                      <p key={link.platform} dir="ltr" className="truncate text-left">
                        {link.platform}: {link.url}
                      </p>
                    ))}
                  </div>
                ) : null}
                {detailsTarget.image_url && (
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                    <Image
                      src={detailsTarget.image_url}
                      alt={detailsTarget.name ?? "صورة الطلب"}
                      fill
                      sizes="(max-width: 640px) 100vw, 640px"
                      className="object-cover"
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <p>
                  <span className="font-bold text-foreground">الصنايعي: </span>
                  {detailsTarget.craftsman_name}
                </p>
                <p dir="ltr" className="text-right">
                  <span className="font-bold text-foreground">رقم المبلغ: </span>
                  {detailsTarget.phone}
                </p>
                <p>
                  <span className="font-bold text-foreground">المشكلة: </span>
                  {detailsTarget.report_message}
                </p>
              </>
            )}
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-accent/10 p-4 text-accent">
              <IconUsers className="h-6 w-6 shrink-0" />
              <p className="text-base">
                افحص البيانات جيداً قبل اتخاذ قرار الموافقة أو الرفض.
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
