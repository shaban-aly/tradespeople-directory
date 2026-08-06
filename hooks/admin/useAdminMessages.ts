"use client";

import {
  deleteContactMessage,
  fetchMessages,
  toggleMessageRead,
  type ContactMessageRow,
} from "@/lib/db/admin";
import { useAdminAction } from "./useAdminAction";
import { useAdminQuery } from "./useAdminQuery";

export function useAdminMessages() {
  const { data, loading, error: loadError, refresh } = useAdminQuery(fetchMessages);
  const { busyKey, error: actionError, run } = useAdminAction();

  const toggleRead = (message: ContactMessageRow) =>
    run(`message-${message.id}`, () => toggleMessageRead(message), refresh);

  const deleteMessage = (messageId: string) =>
    run(`delete-message-${messageId}`, () => deleteContactMessage(messageId), refresh);

  return {
    messages: data ?? [],
    loading,
    error: loadError || actionError,
    busyKey,
    toggleMessageRead: toggleRead,
    deleteMessage,
    refresh,
  };
}
