"use client";

import { useEffect, useRef } from "react";
import { createSupabase } from "@/lib/db/client";
import { type NotificationRow } from "@/lib/db/notifications";
import { useSession } from "@/hooks/auth/useSession";

/**
 * اشتراك Realtime على جدول `notifications` حسب صاحب الجلسة (RLS يمنع رؤية
 * صفوف الغير). عند كل إدراج جديد يصل صف للمستخدم يُستدعى onNew.
 *
 * ملاحظة: الجدول مُضاف لنشر `supabase_realtime` في migration 0013 (idempotent).
 */
export function useRealtimeNotifications(onNew: (row: NotificationRow) => void) {
  const { user, isLoggedIn } = useSession();
  const onNewRef = useRef(onNew);

  useEffect(() => {
    onNewRef.current = onNew;
  }, [onNew]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;

    const supabase = createSupabase();
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as NotificationRow;
          if (row && typeof row.id === "string") {
            onNewRef.current(row);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isLoggedIn, user?.id]);
}