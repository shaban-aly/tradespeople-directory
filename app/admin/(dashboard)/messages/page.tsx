"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IconEye,
  IconEyeOff,
  IconMail,
  IconRefresh,
  IconTrash,
} from "@/components/shared/icons";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { Drawer } from "@/components/admin/Drawer";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  type ContactMessageRow,
  useAdminDashboard,
} from "@/hooks/admin/useAdminDashboard";
import { useToast } from "@/hooks/ui/useToast";
import { toArabicDigits } from "@/lib/utils/format";

type ReadFilter = "all" | "unread";

const READ_TABS: { value: ReadFilter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "unread", label: "غير المقروءة" },
];

export default function MessagesPage() {
  const { toast } = useToast();
  const {
    messages,
    loading,
    error,
    busyKey,
    toggleMessageRead,
    deleteMessage,
    refresh,
  } = useAdminDashboard({ messages: true });
  const [readFilter, setReadFilter] = useState<ReadFilter>("unread");
  const [detailsTarget, setDetailsTarget] = useState<ContactMessageRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactMessageRow | null>(null);

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  const unreadCount = messages.filter((item) => !item.is_read).length;
  const allCount = messages.length;

  const filteredMessages = useMemo(
    () => messages.filter((message) => readFilter === "all" || !message.is_read),
    [messages, readFilter],
  );

  if (loading) return <DashboardLoading />;

  async function handleToggleRead(message: ContactMessageRow) {
    const ok = await toggleMessageRead(message);
    if (ok) {
      toast(
        "success",
        message.is_read ? "تم تحديدها كغير مقروءة" : "تم تحديدها كمقروءة",
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const ok = await deleteMessage(deleteTarget.id);
    if (ok) {
      toast("success", "تم حذف الرسالة");
      setDeleteTarget(null);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="رسائل التواصل"
        description={`${toArabicDigits(unreadCount)} رسالة غير مقروءة من إجمالي ${toArabicDigits(allCount)}.`}
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
        <div className="flex flex-wrap items-center gap-2">
          {READ_TABS.map((tab) => {
            const count = tab.value === "all" ? allCount : unreadCount;
            const isActive = readFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setReadFilter(tab.value)}
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

        {filteredMessages.length === 0 ? (
          <EmptyState
            icon={<IconMail className="h-8 w-8" />}
            title={readFilter === "unread" ? "لا توجد رسائل غير مقروءة" : "لا توجد رسائل بعد"}
            description="رسائل فورم التواصل هتظهر هنا."
          />
        ) : (
          <div className="grid gap-4">
            {filteredMessages.map((message) => (
              <article
                key={message.id}
                className="grid gap-4 rounded-xl border border-border p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge variant={message.is_read ? "active" : "inactive"}>
                      {message.is_read ? "مقروءة" : "غير مقروءة"}
                    </StatusBadge>
                    <span className="text-base font-bold text-foreground">
                      {message.name}
                    </span>
                  </div>
                  <span className="text-base text-muted">
                    {toArabicDigits(message.created_at.slice(0, 10))}
                  </span>
                </div>

                <p
                  className={`line-clamp-2 text-base ${
                    message.is_read ? "text-muted" : "font-bold text-foreground"
                  }`}
                >
                  {message.message}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDetailsTarget(message)}
                    className="min-h-12 rounded-xl border border-border px-4 text-base font-bold text-muted transition-colors hover:text-foreground"
                  >
                    التفاصيل
                  </button>
                  <button
                    type="button"
                    disabled={busyKey === `message-${message.id}`}
                    onClick={() => void handleToggleRead(message)}
                    className="flex min-h-12 items-center gap-2 rounded-xl border border-border px-4 text-base font-bold text-muted transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    {message.is_read ? (
                      <IconEyeOff className="h-5 w-5" />
                    ) : (
                      <IconEye className="h-5 w-5" />
                    )}
                    {message.is_read ? "تحديد كغير مقروءة" : "تحديد كمقروءة"}
                  </button>
                  <button
                    type="button"
                    aria-label="حذف الرسالة"
                    disabled={busyKey === `delete-message-${message.id}`}
                    onClick={() => setDeleteTarget(message)}
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

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="حذف الرسالة"
        message="هل أنت متأكد من حذف هذه الرسالة نهائياً؟ لا يمكن التراجع عن هذا القرار."
        confirmLabel="حذف الرسالة"
        danger
        busy={busyKey === `delete-message-${deleteTarget?.id}`}
      />

      <Drawer
        open={detailsTarget !== null}
        onClose={() => setDetailsTarget(null)}
        title="تفاصيل الرسالة"
      >
        {detailsTarget && (
          <div className="grid gap-3 text-base text-muted">
            <p>
              <span className="font-bold text-foreground">الحالة: </span>
              {detailsTarget.is_read ? "مقروءة" : "غير مقروءة"}
            </p>
            <p>
              <span className="font-bold text-foreground">الاسم: </span>
              {detailsTarget.name}
            </p>
            <p dir="ltr" className="text-right">
              <span className="font-bold text-foreground">رقم الهاتف: </span>
              {detailsTarget.phone}
            </p>
            <p>
              <span className="font-bold text-foreground">التاريخ: </span>
              {toArabicDigits(detailsTarget.created_at)}
            </p>
            <div className="rounded-xl bg-background p-4">
              <p className="mb-2 font-bold text-foreground">الرسالة:</p>
              <p className="whitespace-pre-wrap text-foreground">
                {detailsTarget.message}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busyKey === `message-${detailsTarget.id}`}
                onClick={() => void handleToggleRead(detailsTarget)}
                className="flex min-h-12 items-center gap-2 rounded-xl border border-border px-4 text-base font-bold text-muted transition-colors hover:text-foreground disabled:opacity-50"
              >
                {detailsTarget.is_read ? (
                  <IconEyeOff className="h-5 w-5" />
                ) : (
                  <IconEye className="h-5 w-5" />
                )}
                {detailsTarget.is_read ? "تحديد كغير مقروءة" : "تحديد كمقروءة"}
              </button>
              <button
                type="button"
                disabled={busyKey === `delete-message-${detailsTarget.id}`}
                onClick={() => setDeleteTarget(detailsTarget)}
                className="min-h-12 rounded-xl border border-danger/40 px-4 text-base font-bold text-danger disabled:opacity-50"
              >
                حذف الرسالة
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
