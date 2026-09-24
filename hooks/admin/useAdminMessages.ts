"use client";

import { useEffect, useMemo, useState } from "react";
import {
  deleteContactMessage,
  fetchMessages,
  toggleMessageRead,
  type ContactMessageRow,
} from "@/lib/db/admin";
import { filterMessages } from "@/lib/db/admin-selectors";
import { useToast } from "@/hooks/ui/useToast";
import { useAdminAction } from "./useAdminAction";
import { useAdminQuery } from "./useAdminQuery";

export type MessageReadFilter = "all" | "unread";

export function useAdminMessages(initialMessages?: ContactMessageRow[]) {
  const { toast } = useToast();
  const { data, loading, error: loadError, refresh } = useAdminQuery(
    fetchMessages,
    initialMessages,
  );
  const { busyKey, error: actionError, run } = useAdminAction();
  const error = loadError || actionError;

  const [readFilter, setReadFilter] = useState<MessageReadFilter>("unread");
  const [detailsTarget, setDetailsTarget] = useState<ContactMessageRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactMessageRow | null>(null);

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  const rawMessages = data ?? [];
  const unreadCount = rawMessages.filter((item) => !item.is_read).length;
  const allCount = rawMessages.length;

  const filteredMessages = useMemo(
    () => filterMessages(rawMessages, readFilter),
    [rawMessages, readFilter],
  );

  const toggleRead = (message: ContactMessageRow) =>
    run(`message-${message.id}`, () => toggleMessageRead(message), refresh);

  const deleteMessage = (messageId: string) =>
    run(`delete-message-${messageId}`, () => deleteContactMessage(messageId), refresh);

  const handleToggleRead = async (message: ContactMessageRow) => {
    const ok = await toggleRead(message);
    if (ok) {
      toast(
        "success",
        message.is_read ? "تم تحديدها كغير مقروءة" : "تم تحديدها كمقروءة",
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteMessage(deleteTarget.id);
    if (ok) {
      toast("success", "تم حذف الرسالة");
      setDeleteTarget(null);
    }
  };

  return {
    messages: rawMessages,
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
    error,
    busyKey,
    toggleMessageRead: toggleRead,
    deleteMessage,
    refresh,
  };
}
