"use client";

import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { MessageCard } from "@/components/admin/messages/MessageCard";
import { MessageDetailsDrawer } from "@/components/admin/messages/MessageDetailsDrawer";
import { IconMail } from "@/components/shared/icons";
import type { ContactMessageRow } from "@/lib/db/admin";
import { filterMessages } from "@/lib/db/admin-selectors";
import { useAdminMessages } from "@/hooks/admin/useAdminMessages";
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
  } = useAdminMessages();
  const [readFilter, setReadFilter] = useState<ReadFilter>("unread");
  const [detailsTarget, setDetailsTarget] = useState<ContactMessageRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactMessageRow | null>(null);

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  const unreadCount = messages.filter((item) => !item.is_read).length;
  const allCount = messages.length;

  const filteredMessages = useMemo(
    () => filterMessages(messages, readFilter),
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
        actions={<RefreshButton onRefresh={() => void refresh()} />}
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
            title={
              readFilter === "unread"
                ? "لا توجد رسائل غير مقروءة"
                : "لا توجد رسائل بعد"
            }
            description="رسائل فورم التواصل هتظهر هنا."
          />
        ) : (
          <div className="grid gap-4">
            {filteredMessages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                busyKey={busyKey}
                onToggleRead={(item) => void handleToggleRead(item)}
                onDelete={setDeleteTarget}
                onDetails={setDetailsTarget}
              />
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

      <MessageDetailsDrawer
        message={detailsTarget}
        open={detailsTarget !== null}
        busyKey={busyKey}
        onClose={() => setDetailsTarget(null)}
        onToggleRead={(item) => void handleToggleRead(item)}
        onDelete={setDeleteTarget}
      />
    </div>
  );
}
