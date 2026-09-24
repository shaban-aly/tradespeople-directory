"use client";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { MessageCard } from "@/components/admin/messages/MessageCard";
import { MessageDetailsDrawer } from "@/components/admin/messages/MessageDetailsDrawer";
import { FilterTabs } from "@/components/shared/ui/FilterTabs";
import { IconMail } from "@/components/shared/icons";
import type { ContactMessageRow } from "@/lib/db/admin";
import {
  useAdminMessages,
  type MessageReadFilter,
} from "@/hooks/admin/useAdminMessages";
import { toArabicDigits } from "@/lib/utils/format";

const READ_TABS: { value: MessageReadFilter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "unread", label: "غير المقروءة" },
];

export function MessagesSection({
  initialMessages,
}: {
  initialMessages: ContactMessageRow[];
}) {
  const {
    filteredMessages,
    unreadCount,
    allCount,
    readFilter,
    setReadFilter,
    detailsTarget,
    setDetailsTarget,
    deleteTarget,
    setDeleteTarget,
    handleToggleRead,
    handleDelete,
    loading,
    busyKey,
    refresh,
  } = useAdminMessages(initialMessages);

  if (loading) return <DashboardLoading />;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="رسائل التواصل"
        description={`${toArabicDigits(unreadCount)} رسالة غير مقروءة من إجمالي ${toArabicDigits(allCount)}.`}
        actions={<RefreshButton onRefresh={() => void refresh()} />}
      />

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <FilterTabs
          tabs={READ_TABS.map((tab) => ({
            ...tab,
            count: tab.value === "all" ? allCount : unreadCount,
          }))}
          active={readFilter}
          onChange={setReadFilter}
        />

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